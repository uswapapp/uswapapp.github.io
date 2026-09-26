/**
 * Swap Module
 * Handles swap calculations, fee calculations, and swap execution with improved accuracy
 */

const SwapManager = (function() {
    let feeConfig = {
        BASE_FEE: CONFIG.BASE_FEE,
        MIN_BASE_FEE: CONFIG.MIN_BASE_FEE,
        DIFF_COEFFICIENT: CONFIG.DIFF_COEFFICIENT,
        BASE_PRICE_HIVE_TO_SHIVE: CONFIG.BASE_PRICE_HIVE_TO_SHIVE
    };

    // Live backend script version, if fee.json publishes one (see fetchFeeConfig)
    let backendVersion = null;

    let currentSwap = {
        from: "HIVE",
        to: "SWAP.HIVE",
        amount: 0,
        expected: 0,
        fee: 0,
        feePercent: 0,
        slippage: 0.02,
        minReceive: 0,
        // When true, skip slippage protection and accept whatever the bridge
        // sends back (memo "0") - ported from uswapapp's "No Minimum" checkbox.
        noMinimum: false
    };

    /**
     * Check uswap HIVE transfers for completion confirmation
     */
    async function checkUswapHiveTransfers(originalTxId, username) {
        try {
            const history = await APIManager.tryWithFailover(() => 
                hive.api.getAccountHistoryAsync(CONFIG.BRIDGE_USER, -1, 100)
            );
                        
            // Filter for direct transfers to our user
            // Structure: [index, {trx_id, block, op: [type, data], timestamp, ...}]
            const transfersToUser = history.filter((item) => {
                const op = item[1]?.op;
                return op && op[0] === 'transfer' && op[1].from === CONFIG.BRIDGE_USER && op[1].to === username;
            });
            
            for (let i = transfersToUser.length - 1; i >= 0; i--) {
                const item = transfersToUser[i];
                const op = item[1].op;
                const transferData = op[1];
                const memo = transferData.memo || '';
                const trxId = item[1].trx_id;
                
                if (memo.includes(originalTxId)) {
                    // Parse memo to extract swap details
                    const qtyMatch = memo.match(/Swapped Qty\s*:\s*([\d.]+)/);
                    const priceMatch = memo.match(/Swapped Price\s*:\s*([\d.]+)/);
                    
                    return {
                        found: true,
                        amount: transferData.amount,
                        txId: trxId,
                        swappedQty: qtyMatch ? qtyMatch[1] : null,
                        swappedPrice: priceMatch ? priceMatch[1] : null,
                        memo: memo
                    };
                }
            }
            
            return { found: false };
        } catch (error) {
            console.error('Error checking HIVE transfers:', error);
            return { found: false };
        }
    }

    /**
     * Confirm a SWAP.HIVE payout on the Hive-Engine SIDECHAIN itself.
     *
     * A `custom_json` op showing up in @uswap's Hive (L1) history only proves
     * the bridge BROADCAST an instruction - Hive-Engine (L2) is a separate
     * virtual machine that processes that instruction afterwards and can
     * reject it (e.g. an insufficient-balance error) even though the L1
     * broadcast succeeded. The "Valid" / "HE Block" fields shown on a
     * hivehub.dev transaction page come from this same Engine record, not
     * from Hive L1 - so that's what we check here, via the SAME node the rest
     * of the app already talks to (APIManager.getSSC()).
     *
     * Returns:
     *   { confirmed: true,  amount }                 - Engine applied the transfer
     *   { confirmed: false, engineError }             - Engine explicitly rejected it
     *   { confirmed: false }                          - not indexed by Engine yet (keep polling)
     */
    async function confirmOnHiveEngine(trxId, expectedTo, expectedSymbol) {
        const ssc = APIManager.getSSC();
        if (!ssc) {
            // No Engine node available yet - treat as "not confirmed yet" so the
            // caller keeps polling rather than wrongly reporting success or failure.
            return { confirmed: false };
        }

        let info;
        try {
            info = await Utils.retry(() => ssc.getTransactionInfo(trxId), 2, 1000);
        } catch (error) {
            console.error('Hive-Engine getTransactionInfo failed:', error);
            return { confirmed: false };
        }

        // Not indexed by this Engine node yet - L2 can lag a few seconds behind L1
        if (!info || !info.logs) {
            return { confirmed: false };
        }

        let logs;
        try {
            logs = JSON.parse(info.logs);
        } catch (error) {
            return { confirmed: false };
        }

        if (logs.errors && logs.errors.length > 0) {
            return { confirmed: false, engineError: logs.errors.join(', ') };
        }

        const transferEvent = (logs.events || []).find(ev =>
            ev.contract === 'tokens' &&
            ev.event === 'transfer' &&
            ev.data &&
            ev.data.to === expectedTo &&
            ev.data.symbol === expectedSymbol
        );

        if (!transferEvent) {
            // Engine processed the transaction but not as the transfer we expected -
            // don't confirm on the strength of the (unverified) L1 payload alone.
            return { confirmed: false };
        }

        // Ground truth: what Engine actually applied, not what the L1 payload claimed
        return { confirmed: true, amount: transferEvent.data.quantity };
    }

    /**
     * Check uswap SWAP.HIVE transfers for completion confirmation.
     * A candidate match is only reported `found: true` once it is also
     * confirmed on the Hive-Engine sidechain (see confirmOnHiveEngine above).
     */
    async function checkUswapEngineTransfers(originalTxId, username) {
        try {
            const history = await APIManager.tryWithFailover(() =>
                hive.api.getAccountHistoryAsync(CONFIG.BRIDGE_USER, -1, 100)
            );

            // Filter for custom_json operations
            // Structure: [index, {trx_id, block, op: [type, data], timestamp, ...}]
            const customJsonOps = history.filter((item) => {
                const op = item[1]?.op;
                return op && op[0] === 'custom_json' && op[1].id === 'ssc-mainnet-hive';
            });

            for (let i = customJsonOps.length - 1; i >= 0; i--) {
                const item = customJsonOps[i];
                const op = item[1].op;
                const opData = op[1];
                const trxId = item[1].trx_id;

                try {
                    const json = JSON.parse(opData.json);

                    // Check if it's a token transfer to our user
                    if (json.contractName === 'tokens' &&
                        json.contractAction === 'transfer' &&
                        json.contractPayload &&
                        json.contractPayload.to === username &&
                        json.contractPayload.symbol === 'SWAP.HIVE') {

                        const payload = json.contractPayload;
                        const memo = payload.memo || '';

                        if (memo.includes(originalTxId)) {
                            // This op is the right shape and the right memo - but that
                            // only proves what the bridge SENT to Engine, not what
                            // Engine actually DID with it. Confirm on L2 before trusting it.
                            const engineResult = await confirmOnHiveEngine(trxId, username, 'SWAP.HIVE');

                            if (engineResult.engineError) {
                                // Engine explicitly rejected this - stop looking, this
                                // will never resolve to a success no matter how long we wait.
                                return { found: false, engineError: engineResult.engineError, txId: trxId };
                            }

                            if (!engineResult.confirmed) {
                                // Seen on L1 but Engine hasn't indexed it yet - keep
                                // scanning other candidates, and the outer poll loop
                                // will re-check this same op again next cycle.
                                continue;
                            }

                            const qtyMatch = memo.match(/Swapped Qty\s*:\s*([\d.]+)/);
                            const priceMatch = memo.match(/Swapped Price\s*:\s*([\d.]+)/);

                            return {
                                found: true,
                                // Engine-confirmed amount, not the unverified L1 payload
                                amount: `${engineResult.amount} SWAP.HIVE`,
                                txId: trxId,
                                swappedQty: qtyMatch ? qtyMatch[1] : null,
                                swappedPrice: priceMatch ? priceMatch[1] : null,
                                memo: memo
                            };
                        }
                    }
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    continue;
                }
            }

            return { found: false };
        } catch (error) {
            console.error('Error checking Engine transfers:', error);
            return { found: false };
        }
    }

    /**
     * Look for the bridge's reply to one of our swaps.
     * Checks the expected payout token first, then the input token - the bridge
     * refunds in the original token when it cannot fill the swap.
     * Returns { found, outcome: 'completed'|'refunded', ... }
     */
    async function findBridgeReply(originalTxId, username, fromToken, toToken) {
        const lookup = (token) => token === "HIVE"
            ? checkUswapHiveTransfers(originalTxId, username)
            : checkUswapEngineTransfers(originalTxId, username);

        const payout = await lookup(toToken);
        if (payout.found) {
            return Object.assign({ outcome: 'completed' }, payout);
        }

        if (payout.engineError) {
            // Hive-Engine explicitly rejected the payout meant for us (e.g. a
            // balance error on the sidechain). This will not resolve itself no
            // matter how long we poll, so surface it now instead of silently
            // retrying for the full timeout. If the bridge separately issues a
            // refund later, loadSwapHistory()'s periodic re-check will still
            // pick it up next time "My Recent Swaps" is viewed.
            return { found: false, outcome: 'engine-error', engineError: payout.engineError, txId: payout.txId };
        }

        const refund = await lookup(fromToken);
        if (refund.found) {
            return Object.assign({ outcome: 'refunded' }, refund);
        }

        return { found: false };
    }

    /**
     * Poll until the bridge replies (or we give up).
     *
     * The bridge credits the user in a separate transaction whose memo carries
     * our original transaction id, e.g.
     *   "Thank you for using our service! Swapped Qty : 40.000 &
     *    Swapped Price : 0.997 & Tx : 1b5e1b02...".
     * Until that shows up, the swap is only *submitted*, not complete.
     */
    async function waitForSwapCompletion(originalTxId, username, fromToken, toToken) {
        const startedAt = Date.now();

        // Give the chain a moment before the first look
        await Utils.sleep(CONFIG.SWAP_VERIFY_INITIAL_DELAY);

        while (Date.now() - startedAt < CONFIG.SWAP_VERIFY_TIMEOUT) {
            const elapsed = Math.round((Date.now() - startedAt) / 1000);
            UIManager.showLoading(`Waiting for the bridge to send your ${toToken}... (${elapsed}s)`);

            const reply = await findBridgeReply(originalTxId, username, fromToken, toToken);
            if (reply.found || reply.outcome === 'engine-error') {
                return reply;
            }

            await Utils.sleep(CONFIG.SWAP_VERIFY_INTERVAL);
        }

        return { found: false, timedOut: true };
    }

    /**
     * Update a stored swap record once the bridge has replied
     */
    function markSwapResolved(txIdSent, username, reply) {
        try {
            const history = JSON.parse(localStorage.getItem('swapHistory') || '[]');
            const record = history.find(h => h.txIdSent === txIdSent && h.username === username);
            if (!record) return;

            record.status = reply.outcome;
            record.amountReceived = reply.amount;
            record.txIdReceived = reply.txId;
            record.swappedQty = reply.swappedQty;
            record.swappedPrice = reply.swappedPrice;

            localStorage.setItem('swapHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Could not update swap record:', error);
        }
    }

    /**
     * Add swap to history tracking
     */
    function addSwapToHistory(txId, amount, fromToken, username) {
        const swapRecord = {
            timestamp: Date.now(),
            txIdSent: txId,
            amountSent: `${amount.toFixed(3)} ${fromToken}`,
            fromToken: fromToken,
            toToken: fromToken === "HIVE" ? "SWAP.HIVE" : "HIVE",
            username: username,
            status: 'pending',
            txIdReceived: null,
            amountReceived: null
        };

        // Get existing history from localStorage
        let history = JSON.parse(localStorage.getItem('swapHistory') || '[]');
        
        // Add new record at the beginning
        history.unshift(swapRecord);
        
        // Keep only last 10 swaps per user
        const userHistory = history.filter(h => h.username === username).slice(0, 10);
        const otherHistory = history.filter(h => h.username !== username);
        history = [...userHistory, ...otherHistory];
        
        // Save to localStorage
        localStorage.setItem('swapHistory', JSON.stringify(history));
        
        // Update UI
        UIManager.updateSwapHistory();
    }

    /**
     * Verify if transaction exists on blockchain by transaction ID
     */
    async function verifyTransactionExists(txId, fromToken) {
        try {
            if (fromToken === "HIVE") {
                // For HIVE transactions, verify on Hive blockchain
                try {
                    const tx = await APIManager.tryWithFailover(() =>
                        hive.api.getTransactionAsync(txId)
                    );
                    return tx !== null && tx !== undefined;
                } catch (error) {
                    return false;
                }
            } else {
                // For SWAP.HIVE (custom_json), verify it was processed by Hive Engine side chain
                try {
                    const ssc = APIManager.getSSC();
                    if (!ssc) {
                        return false;
                    }
                    
                    const engineTx = await ssc.getTransactionInfo(txId);
                    // Hive Engine returns an object with blockNumber, transactionId, etc if found
                    // Returns null or undefined if not found
                    return engineTx !== null && engineTx !== undefined && engineTx.transactionId;
                } catch (error) {
                    return false;
                }
            }
        } catch (error) {
            console.error('Error verifying transaction existence:', error);
            return false;
        }
    }

    /**
     * Load and check swap history status
     */
    async function loadSwapHistory(username) {
        if (!username) return [];

        let history = JSON.parse(localStorage.getItem('swapHistory') || '[]');
        const userHistory = history.filter(h => h.username === username);
        
        // Check status for pending swaps AND re-check completed swaps with old data
        for (let swap of userHistory) {
            // Re-check completed swaps that have 'uswap-transfer' or 'uswap-refund' placeholder
            if ((swap.status === 'completed' || swap.status === 'refunded') && 
                (swap.txIdReceived === 'uswap-transfer' || swap.txIdReceived === 'uswap-refund')) {
                // Re-fetch to get actual transaction ID
                const toToken = swap.toToken;
                let result;
                
                if (toToken === "HIVE") {
                    result = await checkUswapHiveTransfers(swap.txIdSent, username);
                } else {
                    result = await checkUswapEngineTransfers(swap.txIdSent, username);
                }
                
                if (result.found) {
                    swap.txIdReceived = result.txId;
                }
            }
            
            if (swap.status === 'pending') {
                // First, check if swap completed or refunded by checking uswap history
                const toToken = swap.toToken;
                let result;

                if (toToken === "HIVE") {
                    result = await checkUswapHiveTransfers(swap.txIdSent, username);
                } else {
                    result = await checkUswapEngineTransfers(swap.txIdSent, username);
                }

                if (result.found) {
                    swap.status = 'completed';
                    swap.amountReceived = result.amount;
                    swap.txIdReceived = result.txId;
                    swap.swappedQty = result.swappedQty;
                    swap.swappedPrice = result.swappedPrice;
                    delete swap.engineError;
                    continue;
                }

                // Hive-Engine explicitly rejected the payout meant for us. This
                // proves the original transaction WAS received and processed as
                // far as attempting a payout, so it's a distinct state from
                // "not-sent" below - remember it, but keep polling for a refund.
                if (result.engineError) {
                    swap.engineError = result.engineError;
                } else {
                    delete swap.engineError;
                }

                // Not completed, check for refund (same token returned)
                if (swap.fromToken === "HIVE") {
                    const refund = await checkUswapHiveTransfers(swap.txIdSent, username);
                    if (refund.found) {
                        swap.status = 'refunded';
                        swap.amountReceived = refund.amount;
                        swap.txIdReceived = refund.txId;
                        delete swap.engineError;
                        continue;
                    }
                } else {
                    const refund = await checkUswapEngineTransfers(swap.txIdSent, username);
                    if (refund.found) {
                        swap.status = 'refunded';
                        swap.amountReceived = refund.amount;
                        swap.txIdReceived = refund.txId;
                        delete swap.engineError;
                        continue;
                    }
                }

                // Not completed and not refunded
                // Give time for blockchain/side chain to process before checking existence
                const now = Date.now();
                const swapAge = now - swap.timestamp; // in milliseconds
                const minimumWaitTime = 30 * 1000; // 30 seconds
                const maximumWaitTime = 10 * 60 * 1000; // 10 minutes

                // Only check if transaction exists after minimum wait time.
                // Skip this entirely if Hive-Engine already told us it rejected a
                // payout attempt for this tx - we already KNOW it was sent, so
                // "not-sent" would be actively wrong here.
                if (!swap.engineError && swapAge > minimumWaitTime && swapAge < maximumWaitTime) {
                    const txExists = await verifyTransactionExists(swap.txIdSent, swap.fromToken);

                    if (!txExists) {
                        swap.status = 'not-sent';
                    }
                }
                // If less than 30 seconds or more than 10 minutes, keep as pending
            }
        }
        
        // Update localStorage with new status
        localStorage.setItem('swapHistory', JSON.stringify(history));
        
        return userHistory.slice(0, 10);
    }

    /**
     * Fetch fee configuration from server
     */
    async function fetchFeeConfig() {
        try {
            const response = await Utils.withTimeout(
                axios.get(CONFIG.USWAP_FEE_JSON),
                5000
            );
            
            if (response.data) {
                feeConfig.BASE_FEE = Utils.parseNumber(response.data.BASE_FEE, feeConfig.BASE_FEE);
                feeConfig.MIN_BASE_FEE = Utils.parseNumber(response.data.MIN_BASE_FEE, feeConfig.MIN_BASE_FEE);
                feeConfig.DIFF_COEFFICIENT = Utils.parseNumber(response.data.DIFF_COEFFICIENT, feeConfig.DIFF_COEFFICIENT);
                feeConfig.BASE_PRICE_HIVE_TO_SHIVE = Utils.parseNumber(response.data.BASE_PRICE_HIVE_TO_SHIVE, feeConfig.BASE_PRICE_HIVE_TO_SHIVE);

                // Prefer a version published by the bridge itself so the footer
                // reflects reality rather than a value hardcoded at build time.
                // Accepts a few likely key names; falls back to CONFIG.BACKEND_VERSION.
                const published = response.data.VERSION
                    || response.data.SCRIPT_VERSION
                    || response.data.BACKEND_VERSION;
                if (published) {
                    backendVersion = String(published);
                    console.log("Backend script version (live):", backendVersion);
                }

                console.log("Fee config loaded:", feeConfig);
            }
        } catch (error) {
            const handled = Utils.handleError(error, 'SwapManager.fetchFeeConfig');
            console.error(handled.message);
        }
    }

    /**
     * Calculate swap fee and output based on amount and direction
     * Uses the exact formula from the original uswap.app
     */
    function calculateFee(amount, fromToken, toToken) {
        if (!Utils.isPositiveNumber(amount)) {
            return { feeAmount: 0, feePercent: 0 };
        }

        // Get pool liquidity amounts
        const fromPool = fromToken === "HIVE" ? CONFIG.HIVEPOOL : CONFIG.SHIVEPOOL;
        const totalPool = CONFIG.HIVEPOOL + CONFIG.SHIVEPOOL;
        
        // Calculate pool difference ratio
        const diff = ((amount * 0.5 + fromPool) / totalPool) - 0.5;
        
        // Calculate adjusted base fee (lower when balancing pools)
        const adjusted_base_fee = Math.max(
            feeConfig.BASE_FEE * (1 - 2 * Math.abs(diff)),
            feeConfig.MIN_BASE_FEE
        );
        
        // Calculate price with pool imbalance adjustment
        let price;
        if (fromToken === "HIVE") {
            price = feeConfig.BASE_PRICE_HIVE_TO_SHIVE - (2 * diff * feeConfig.DIFF_COEFFICIENT);
        } else {
            price = (1 / feeConfig.BASE_PRICE_HIVE_TO_SHIVE) - (2 * diff * feeConfig.DIFF_COEFFICIENT);
        }
        
        // Calculate expected output
        const expectedOutput = (amount * price) * (1 - adjusted_base_fee);
        
        // Calculate fee amount in input token
        const feeAmount = amount * adjusted_base_fee;
        const feePercent = adjusted_base_fee * 100;
        
        return {
            feeAmount: Utils.roundTo(feeAmount, 8),
            feePercent: Utils.roundTo(feePercent, 4),
            expectedOutput: Utils.roundTo(expectedOutput, 8)
        };
    }

    /**
     * Calculate expected output amount
     * Uses the new calculateFee function that includes output
     */
    function calculateExpectedOutput(inputAmount, fromToken, toToken) {
        if (!Utils.isPositiveNumber(inputAmount)) {
            return { expected: 0, fee: 0, feePercent: 0 };
        }

        const result = calculateFee(inputAmount, fromToken, toToken);

        return {
            expected: Math.floor(result.expectedOutput * CONFIG.DECIMAL) / CONFIG.DECIMAL,
            fee: result.feeAmount,
            feePercent: result.feePercent
        };
    }

    /**
     * Update swap calculation
     */
    function updateSwapCalculation(amount, fromToken, toToken, slippage) {
        currentSwap.from = fromToken;
        currentSwap.to = toToken;
        currentSwap.amount = Utils.parseNumber(amount, 0);
        currentSwap.slippage = Utils.parseNumber(slippage, 0.02);

        const result = calculateExpectedOutput(currentSwap.amount, fromToken, toToken);
        currentSwap.expected = result.expected;
        currentSwap.fee = result.fee;
        currentSwap.feePercent = result.feePercent;
        
        // Calculate minimum receive with slippage protection
        const slippageFactor = 1 - (currentSwap.slippage / 100);
        currentSwap.minReceive = Utils.roundTo(
            Utils.safeMultiply(currentSwap.expected, slippageFactor),
            3
        );

        // Update UI
        UIManager.updateSwapDisplay(currentSwap);
        
        // Validate and enable/disable swap button
        validateSwapButton();

        return currentSwap;
    }

    /**
     * Toggle "No Minimum" mode (ported from uswapapp's noMemoCheck checkbox).
     * When enabled, executeSwap() sends memo "0" instead of the computed
     * minimum-receive amount, so the bridge accepts any output amount.
     */
    function setNoMinimum(enabled) {
        currentSwap.noMinimum = !!enabled;
        // Re-validate in case this flips the button between enabled/disabled
        validateSwapButton();
    }

    /**
     * Reverse swap direction
     */
    function reverseSwap() {
        const temp = currentSwap.from;
        currentSwap.from = currentSwap.to;
        currentSwap.to = temp;

        // Update UI selects
        const inputSelect = document.getElementById("input");
        const outputSelect = document.getElementById("output");
        if (inputSelect) {
            inputSelect.value = currentSwap.from;
            inputSelect.dispatchEvent(new Event('change'));
        }
        if (outputSelect) {
            outputSelect.value = currentSwap.to;
            outputSelect.dispatchEvent(new Event('change'));
        }

        // Recalculate if amount exists
        if (Utils.isPositiveNumber(currentSwap.amount)) {
            updateSwapCalculation(
                currentSwap.amount, 
                currentSwap.from, 
                currentSwap.to, 
                currentSwap.slippage
            );
        }

        // Update fee ticker labels
        const feeTicker = document.getElementById("feeticker");
        const minReceiveSymbol = document.getElementById("minreceivesymbol");
        if (feeTicker) feeTicker.textContent = currentSwap.from;
        if (minReceiveSymbol) minReceiveSymbol.textContent = currentSwap.to;
    }

    /**
     * Validate if swap button should be enabled
     * Can be called with parameters or will use currentSwap values
     */
    function validateSwapButton(inputAmount = null, inputFrom = null, inputTo = null) {
        const amount = inputAmount !== null ? inputAmount : currentSwap.amount;
        const fromToken = inputFrom || currentSwap.from;
        const toToken = inputTo || currentSwap.to;
        
        // Check if amount is valid and positive
        if (!amount || !Utils.isPositiveNumber(amount) || amount <= 0) {
            UIManager.disableSwapButton();
            return false;
        }

        // Check if amount meets minimum requirement
        if (amount < CONFIG.MINIMUM_SWAP) {
            UIManager.disableSwapButton();
            return false;
        }

        // Check if user has sufficient balance
        const balances = WalletManager.getBalances();
        const availableBalance = Utils.parseNumber(balances[fromToken], 0);
        
        if (availableBalance < amount) {
            UIManager.disableSwapButton();
            return false;
        }

        // Check if bridge has sufficient liquidity for the output token
        const liquidity = MarketManager.getLiquidity();
        const expectedOutput = calculateExpectedOutput(amount, fromToken, toToken).expected;
        
        // Map token to liquidity key
        const liquidityKey = toToken === "HIVE" ? "hive" : "swapHive";
        const availableLiquidity = Utils.parseNumber(liquidity[liquidityKey], 0);
        
        if (expectedOutput > availableLiquidity) {
            UIManager.disableSwapButton();
            return false;
        }

        // All validations passed - enable button
        UIManager.enableSwapButton();
        return true;
    }

    /**
     * Validate swap (returns validation result)
     */
    function validateSwap() {
        const username = WalletManager.getCurrentUser();
        if (!username) {
            throw new Utils.ValidationError("Please load your wallet first");
        }

        const balance = WalletManager.getBalance(currentSwap.from);
        const validation = Utils.validateSwapAmount(
            currentSwap.amount,
            balance,
            CONFIG.MINIMUM_SWAP
        );

        if (!validation.valid) {
            throw new Utils.ValidationError(validation.errors.join('. '));
        }

        return true;
    }

    /**
     * Execute HIVE to SWAP.HIVE swap with Keychain
     */
    async function executeHiveToSwapHive(amount, username, memo) {
        return new Promise((resolve, reject) => {
            if (!window.hive_keychain) {
                reject(new Utils.TransactionError("Hive Keychain extension not found. Please install it."));
                return;
            }

            const transferAmount = Utils.roundTo(amount, 3).toFixed(3) + " HIVE";

            hive_keychain.requestTransfer(
                username,
                CONFIG.BRIDGE_USER,
                Utils.roundTo(amount, 3).toFixed(3),
                memo,
                "HIVE",
                (response) => {
                    if (response.success) {
                        // Extract transaction ID from response
                        const txId = response.result?.id || response.result?.transaction_id || response.result || null;
                        resolve({ 
                            success: true, 
                            transactionId: txId,
                            response: response 
                        });
                    } else {
                        reject(new Utils.TransactionError(
                            response.message || "Transaction rejected",
                            null
                        ));
                    }
                }
            );
        });
    }

    /**
     * Execute SWAP.HIVE to HIVE swap with Keychain
     */
    async function executeSwapHiveToHive(amount, username, memo) {
        return new Promise((resolve, reject) => {
            if (!window.hive_keychain) {
                reject(new Utils.TransactionError("Hive Keychain extension not found. Please install it."));
                return;
            }

            const json = JSON.stringify({
                contractName: "tokens",
                contractAction: "transfer",
                contractPayload: {
                    symbol: "SWAP.HIVE",
                    to: CONFIG.BRIDGE_USER,
                    quantity: Utils.roundTo(amount, 3).toFixed(3),
                    memo: memo
                }
            });

            hive_keychain.requestCustomJson(
                username,
                "ssc-mainnet-hive",
                "Active",
                json,
                "SWAP.HIVE Transfer",
                (response) => {
                    if (response.success) {
                        // Extract transaction ID from response
                        const txId = response.result?.id || response.result?.transaction_id || response.result || null;
                        resolve({ 
                            success: true, 
                            transactionId: txId,
                            response: response 
                        });
                    } else {
                        reject(new Utils.TransactionError(
                            response.message || "Transaction rejected",
                            null
                        ));
                    }
                }
            );
        });
    }

    /**
     * Execute HIVE or SWAP.HIVE transfer to the bridge via Hive Auth (HAS)
     */
    async function executeSwapViaHiveAuth(amount, username, memo, fromToken) {
        if (!HiveAuthManager.isSupported()) {
            throw new Utils.TransactionError("Hive Auth is not supported in this browser.");
        }
        const formattedAmount = Utils.roundTo(amount, 3).toFixed(3);
        return await HiveAuthManager.requestTransfer(username, formattedAmount, fromToken, memo);
    }

    /**
     * Execute swap with comprehensive error handling
     */
    async function executeSwap() {
        try {
            // Validate swap
            validateSwap();

            UIManager.showLoading("Processing swap...");
            UIManager.disableSwapButton();

            const username = WalletManager.getCurrentUser();
            const minReceiveFormatted = Utils.roundTo(currentSwap.minReceive, 3).toFixed(3);
            // "No Minimum" mode sends memo "0" so the bridge accepts any output amount
            const memo = currentSwap.noMinimum ? "0" : minReceiveFormatted;

            const authMethodEl = document.querySelector('input[name="txtype"]:checked');
            const authMethod = authMethodEl ? authMethodEl.value : "Hive Keychain";

            let result;
            if (authMethod === "Hive Auth") {
                UIManager.showLoading(`Confirm the transaction through Hive Auth.`);
                result = await executeSwapViaHiveAuth(currentSwap.amount, username, memo, currentSwap.from);
            } else if (currentSwap.from === "HIVE") {
                result = await executeHiveToSwapHive(currentSwap.amount, username, memo);
            } else {
                result = await executeSwapHiveToHive(currentSwap.amount, username, memo);
            }

            const fromToken = currentSwap.from;
            const toToken = currentSwap.to;

            // Record it as pending straight away so it survives a page reload
            if (result.transactionId) {
                addSwapToHistory(result.transactionId, currentSwap.amount, fromToken, username);
            }

            UIManager.clearSwapInputs();

            // Without a transaction id we cannot match the bridge's reply, so be
            // honest rather than claiming the swap went through.
            if (!result.transactionId) {
                UIManager.hideLoading();
                UIManager.showSuccess("Transaction submitted. Check 'My Recent Swaps' for the result.");
                setTimeout(() => WalletManager.refreshBalance(), 10000);
                return true;
            }

            // Submitted != swapped. The bridge credits the user in a separate
            // transaction, so wait for that before reporting success.
            const reply = await waitForSwapCompletion(
                result.transactionId, username, fromToken, toToken
            );

            UIManager.hideLoading();

            if (reply.found) {
                markSwapResolved(result.transactionId, username, reply);

                if (reply.outcome === 'refunded') {
                    UIManager.showError(
                        `Swap could not be filled - ${reply.amount} was refunded to your wallet.`
                    );
                } else {
                    const detail = reply.swappedQty && reply.swappedPrice
                        ? ` (swapped ${reply.swappedQty} at ${reply.swappedPrice})`
                        : "";
                    UIManager.showSuccess(`Swap complete! Received ${reply.amount}${detail}.`);
                }
            } else if (reply.outcome === 'engine-error') {
                // The bridge's payout was rejected by Hive-Engine itself (layer 2),
                // not just "not confirmed yet" - retrying will not fix this.
                UIManager.showError(
                    `Your ${fromToken} was received, but Hive-Engine rejected the payout ` +
                    `(${reply.engineError}). Check 'My Recent Swaps' - a refund may follow.`
                );
            } else {
                // Still not visible on chain - do not claim success
                UIManager.showError(
                    "Transaction sent, but the bridge has not replied yet. " +
                    "Check 'My Recent Swaps' in a few minutes."
                );
            }

            await WalletManager.refreshBalance();
            UIManager.updateSwapHistory();

            return true;

        } catch (error) {
            const handled = Utils.handleError(error, 'SwapManager.executeSwap');
            UIManager.hideLoading();
            UIManager.showError(handled.message);
            // Re-validate button after error
            validateSwapButton();
            return false;
        }
    }

    /**
     * Get current swap details
     */
    function getCurrentSwap() {
        return currentSwap;
    }

    /**
     * Initialize swap module
     */
    async function initialize() {
        await fetchFeeConfig();
        console.log("Swap Manager initialized");
    }

    // Public API
    return {
        initialize,
        updateSwapCalculation,
        reverseSwap,
        executeSwap,
        getCurrentSwap,
        calculateExpectedOutput,
        validateButton: validateSwapButton,
        loadSwapHistory,
        setNoMinimum,
        getBackendVersion: () => backendVersion
    };
})();
