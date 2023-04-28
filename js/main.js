$(window).bind("load", function () {
    // remove unnessary parameters from url

    var rpc_nodes = [
        "https://api.deathwing.me",
        "https://hive.roelandp.nl",
        "https://api.openhive.network",
        "https://rpc.ausbit.dev",
        "https://hived.emre.sh",
        "https://hive-api.arcange.eu",
        "https://api.hive.blog",
        "https://api.c0ff33a.uk",
        "https://rpc.ecency.com",
        "https://anyx.io",
        "https://techcoderx.com",
        "https://hived.privex.io",
        "https://api.followbtcnews.com/",
        "https://api.hive.blue"
    ];

    hive.api.setOptions({ url: 'https://anyx.io' });
    hive.config.set('alternative_api_endpoints', rpc_nodes);

    window.history.replaceState({}, document.title, "/" + "");

    const ssc = new SSC("https://engine.rishipanthee.com/");

    var DECIMAL = 1000;
    DECIMAL = parseInt(DECIMAL) || 0.0;

    var user = null, bal = { HIVE: 0, "SWAP.HIVE": 0, VAULT: 0 }, bridgebal;
    let stablereqHive = 0;
    let stablereqSwapHive = 0;

    function dec(val) {
        return Math.floor(val * 1000) / 1000;
    }

    async function getBalances(account) {
        const res = await hive.api.getAccountsAsync([account]);
        if (res.length > 0) {
            const res2 = await ssc.find("tokens", "balances", { account, symbol: { "$in": ["SWAP.HIVE", "VAULT"] } }, 1000, 0, []);
            var swaphive = res2.find(el => el.symbol === "SWAP.HIVE");
            var vault = res2.find(el => el.symbol === "VAULT");
            return {
                HIVE: dec(parseFloat(res[0].balance.split(" ")[0])),
                "SWAP.HIVE": dec(parseFloat((swaphive) ? swaphive.balance : 0)),
                VAULT: dec(parseFloat((vault) ? vault.balance : 0))
            }

        } else return { HIVE: 0, "SWAP.HIVE": 0, VAULT: 0 };
    }

    async function getExtBridge () {

        const res = await hive.api.getAccountsAsync(['kswap']);
        var hiveLiq = res[0].balance.split(" ")[0];
        hiveLiq = Math.floor(hiveLiq * DECIMAL) / DECIMAL;

        const res2 = await ssc.findOne("tokens", "balances", { account: 'kswap', symbol: 'SWAP.HIVE' });
        var swaphiveLiq = parseFloat(res2.balance) || 0.0;
        swaphiveLiq = Math.floor(swaphiveLiq * DECIMAL) / DECIMAL;

        $("#hive_liq").text(hiveLiq);

        $("#swap_liq").text(swaphiveLiq);

        $("#bridge").removeClass("d-none");

    }   

    getExtBridge();

    async function refresh() {
        updateMin();
        bridgebal = await getBalances("uswap");
        $("#hiveliquidity").text(bridgebal.HIVE.toFixed(3));
        $("#swaphiveliquidity").text(bridgebal["SWAP.HIVE"].toFixed(3));
        console.log("");
        console.log(
            'Update Hive Liquidity: ' + bridgebal.HIVE.toFixed(3) + ' HIVE',
        );

        console.log(
            'Update SWAP.HIVE Liquidity: ' + bridgebal["SWAP.HIVE"].toFixed(3) + ' SWAP.HIVE',
        );

        const total = bridgebal.HIVE + bridgebal["SWAP.HIVE"];
        const stablereq = total * 0.15;

        if (bridgebal.HIVE < stablereq) {
            stablereqHive = Math.floor((stablereq - bridgebal.HIVE) * 1000) / 1000;
            $("#reqhive").text(stablereqHive.toFixed(3));
        }

        if (bridgebal["SWAP.HIVE"] < stablereq) {
            stablereqSwapHive = Math.floor((stablereq - bridgebal["SWAP.HIVE"]) * 1000) / 1000;
            $("#reqswaphive").text(stablereqSwapHive.toFixed(3));
        }

        try {
            if (hive_keychain) {
                $("#txtype").removeAttr("disabled");
                $("#txtype").attr("checked", true);
            }
        }
        catch (e) {
            $("#txtype").attr("disabled", true);
            $("#txtype").removeAttr("checked");
        }

        $("input[name=txtype]").change();
    };

    $("#refresh").click(async function () {
        $(this).attr("disabled", true);
        await refresh();
        $(this).removeAttr("disabled");
    });

    function updateMin() {
        const insymbol = $("#input").val();
        $("#minimum").text(`1 ${insymbol}`);
    }

    function updateSwap(r) {
        try {
            updateMin();
            const insymbol = $("#input").val();
            var outsymbol = $("#output").val();
            const val = $("#inputquantity").val();
            let fee = (insymbol === "VAULT") ? 0 : Math.ceil((val * 0.001) * 1000) / 1000;
            let reward = 0;
            let vaultReward = (insymbol === "VAULT") ? 0 : Math.floor((val * 0.001) * 1000) / 1000;

            if (insymbol === "HIVE" && stablereqHive > 0) {
                if (val <= stablereqHive) {
                    fee = 0;
                    reward = Math.floor((val * 0.00075) * 1000) / 1000;
                }

                else if (val > stablereqHive) {
                    reward = Math.floor((stablereqHive * 0.00075) * 1000) / 1000
                    let overflow = val - stablereqHive;
                    fee = Math.ceil((overflow * 0.001) * 1000) / 1000;
                }
            }

            else if (insymbol === "SWAP.HIVE" && stablereqSwapHive > 0) {
                if (val <= stablereqSwapHive) {
                    fee = 0;
                    reward = Math.floor((val * 0.00075) * 1000) / 1000;
                }

                else if (val > stablereqSwapHive) {
                    reward = Math.floor((stablereqSwapHive * 0.00075) * 1000) / 1000
                    let overflow = val - stablereqSwapHive;
                    fee = Math.ceil((overflow * 0.001) * 1000) / 1000;
                }
            }

            $("#fee").text(fee.toFixed(3));
            $("#vaultreward").text(vaultReward.toFixed(3));

            if (reward > 0) {
                $("#reward").text(reward.toFixed(3));
                $("#rewarddiv").removeClass("d-none");
                $("#rewarddiv").addClass("d-inline");
            } 
            else {
                $("#rewarddiv").removeClass("d-inline");
                $("#rewarddiv").addClass("d-none");
            }

            $("#feeticker").text(insymbol);
            $("rewardticker").text(insymbol);

            const output = (insymbol === "VAULT") ? (val / 10) : (val - fee);

            $("#outputquantity").val(output.toFixed(3));

            if (insymbol === outsymbol) {
                var othersymbol;

                $("#output option").each(function () {
                    if ($(this).val() !== insymbol) {
                        othersymbol = $(this).val();
                        return
                    }
                });

                outsymbol = othersymbol;
                $("#output").val(othersymbol);
            }

            if (bridgebal[outsymbol] >= output
                && bal[insymbol] >= val
                && insymbol !== outsymbol
                && val >= 1) {
                $("#swap").removeAttr("disabled");
                if (r) r(true, parseFloat(val).toFixed(3), insymbol, `Swapping to ${(outsymbol === 'SWAP.HIVE') ? 'Swap.Hive' : 'Hive'}`);
            } 
            else {
                $("#swap").attr("disabled", "true");
                if (r) r(false);
            }
        } 
        catch (e) { console.log(e); }
    }

    var modal = new bootstrap.Modal(document.getElementById('authqr'), {
        focus: true,
        backdrop: 'static',
    });

    $(".s").click(function () {
        $("#input").val($(this).find(".sym").text());
        $("#inputquantity").val($(this).find(".qt").text());
        updateSwap();
    });

    $("#inputquantity").keyup(() => { updateSwap(); });

    $("#input, #output").change(() => { updateSwap(); });

    $("#reverse").click(function () {
        var input = $("#input").val();
        $("#input").val($("#output").val());
        $("#output").val(input);
        updateSwap();
    });

    async function updateBalance() {
        bal = await getBalances(user);
        console.log("");
        console.log(
            `Update Hive Balance: @${user} ` + bal.HIVE.toFixed(3) + ' HIVE',
        );

        console.log(
            `Update SWAP.HIVE Balance: @${user} ` + bal["SWAP.HIVE"].toFixed(3) + ' SWAP.HIVE',
        );

        console.log(
            `Update VAULT Balance: @${user} ` + bal.VAULT.toFixed(3) + ' VAULT',
        );

        $("#hive").text(bal.HIVE.toFixed(3));
        $("#swaphive").text(bal["SWAP.HIVE"].toFixed(3));
        $("#vault").text(bal.VAULT.toFixed(3));
    }

    $("#checkbalance").click(async function () {
        user = $.trim($("#username").val().toLowerCase());

        if (user.length >= 3) {
            $(this).attr("disabled", "true");
            await updateBalance();
            updateSwap();
            $(this).removeAttr("disabled");
            localStorage['user'] = user;
        }
    });

    if (localStorage['user']) {
        $("#username").val(localStorage['user']);
        user = localStorage['user'];
        updateBalance();
    }

    // HAS implementation
    const HAS_SERVER = "wss://hive-auth.arcange.eu";
    const HAS_APP_DATA = {
        name: "UPMESWAP",
        description: "Discounted Bridge",
        icon: "https://uswap.app/assets/hiveupme.png",
    };

    const app_key = uuidv4();

    var token
    var expire
    var auth_key
    var ws = undefined;

    if ("WebSocket" in window) {
        $("#txtype1").removeAttr("disabled");

        if ($("#txtype").attr("checked") !== "true") {
            $("#txtype").removeAttr("checked");
            $("#txtype1").attr("checked", true);
        }

        $("input[name=txtype]").change();

        ws = new WebSocket(HAS_SERVER)

        ws.onopen = function () {
            console.log("Connection Established");
            // Web Socket is connected
        }
    } 
    else {
        $("#txtype1").attr("disabled", true);
        $("#txtype1").removeAttr("checked");
    }

    function isTimeAvailable(ex) {
        const timestamp = new Date().getTime();
        if (ex > timestamp)
            return true;
        else
            return false;
    }

    $("#swap").click(async function () {
        $("#swap").attr("disabled", "true");
        $("#loading").removeClass("d-none");
        $("#status").text("Please Wait...");
        await refresh();
        await updateBalance();

        updateSwap(function (canSwap, amount, currency, memo) {
            if (canSwap) {
                const txtype = $("input[type='radio'][name='txtype']:checked").val();
                $("#swap").attr("disabled", "true");
                $("#loading").addClass("d-none");
                $("#status").text(`Confirm the transaction through ${txtype}.`);

                if (txtype === "Hive Keychain") {
                    if (currency !== "HIVE") {
                        hive_keychain.requestSendToken(
                            user,
                            "uswap",
                            amount,
                            memo,
                            currency,
                            async function (res) {
                                if (res.success === true) {
                                    $("#status").text("Swaping Done Successfully!");
                                    $("#status").addClass("text-success");
                                    await updateBalance();
                                    updateSwap();

                                    //Added Here
                                    await setSwapAmounts();
                                } 
                                else {
                                    $("#status").text("Transaction failed, Please try again.");
                                    updateSwap();
                                }

                                console.log(res);
                            }
                        );
                    } 
                    else {
                        hive_keychain.requestTransfer(
                            user,
                            "uswap",
                            amount,
                            memo,
                            currency,
                            async function (res) {
                                if (res.success === true) {
                                    $("#status").text("Swaping Done Successfully!");
                                    $("#status").addClass("text-success");
                                    await updateBalance();
                                    updateSwap();

                                    //Added Here
                                    await setSwapAmounts();
                                } 
                                else {
                                    $("#status").text("Transaction failed, Please try again.");
                                    updateSwap();
                                }

                                console.log(res);
                            }
                        );
                    }
                } 
                else if (txtype === "Hive Auth") {
                    ws.onmessage = function (event) {
                        const message = typeof (event.data) == "string" ? JSON.parse(event.data) : event.data;

                        if (message.cmd) {
                            switch (message.cmd) {
                                case "auth_wait":
                                    // Update QRCode
                                    const json = JSON.stringify({
                                        account: user,
                                        uuid: message.uuid,
                                        key: auth_key,
                                        host: HAS_SERVER
                                    });

                                    const URI = `has://auth_req/${btoa(json)}`
                                    var url = "https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=" + URI;
                                    $("#qr-code").attr("src", url);
                                    $("#qr-link").attr("href", URI);

                                    $("#qr-div").addClass("d-flex");
                                    $("#qr-div").removeClass("d-none");
                                    $("#approve-div").addClass("d-none");
                                    $("#approve-div").removeClass("d-flex");

                                    modal.show();
                                    break;

                                    case "auth_ack":
                                    try {
                                        // Try to decrypt and parse payload data
                                        message.data = JSON.parse(CryptoJS.AES.decrypt(message.data, auth_key).toString(CryptoJS.enc.Utf8))
                                        token = message.data.token
                                        expire = message.data.expire
                                        localStorage['token'] = token;
                                        localStorage['expire'] = expire;
                                        localStorage['auth_key'] = auth_key;

                                        $("#qr-div").removeClass("d-flex");
                                        $("#qr-div").addClass("d-none");
                                        $("#approve-div").addClass("d-flex");
                                        $("#approve-div").removeClass("d-none");

                                        modal.show();
                                        $("#approve").click(function () {
                                            modal.hide();
                                            const json = JSON.stringify({
                                                "contractName": "tokens",
                                                "contractAction": "transfer",
                                                "contractPayload": {
                                                    "symbol": currency,
                                                    "to": "uswap",
                                                    "quantity": amount,
                                                    "memo": memo
                                                }
                                            });

                                            if (currency !== "HIVE") {
                                                const op = [
                                                    "custom_json",
                                                    {
                                                        id: "ssc-mainnet-hive",
                                                        json: json,
                                                        required_auths: [user],
                                                        required_posting_auths: [],
                                                    }
                                                ]

                                                const sign_data = {
                                                    key_type: "active",
                                                    ops: [op],
                                                    broadcast: true
                                                };

                                                const data = CryptoJS.AES.encrypt(JSON.stringify(sign_data), auth_key).toString();
                                                const payload = { cmd: "sign_req", account: user, token: token, data: data };
                                                ws.send(JSON.stringify(payload));
                                            } 
                                            else {
                                                const op = [
                                                    "transfer",
                                                    {
                                                        from: user,
                                                        to: 'uswap',
                                                        amount: `${amount} HIVE`,
                                                        memo,
                                                    }
                                                ]

                                                const sign_data = {
                                                    key_type: "active",
                                                    ops: [op],
                                                    broadcast: true
                                                };

                                                const data = CryptoJS.AES.encrypt(JSON.stringify(sign_data), auth_key).toString();
                                                const payload = { cmd: "sign_req", account: user, token: token, data: data };
                                                ws.send(JSON.stringify(payload));
                                            }
                                        });
                                    } 
                                    catch (e) {
                                        // Decryption failed - ignore message
                                        modal.hide();
                                        console.error("decryption failed", e.message)
                                        $("#loading").addClass("d-none");
                                        $("#status").text("Failed to Establish connection with HAS. Try Again!");
                                        updateSwap();
                                    }
                                    break;

                                case "auth_nack":
                                    modal.hide();
                                    $("#loading").addClass("d-none");
                                    $("#status").text("Failed to Establish connection with HAS. Try Again!");
                                    updateSwap();
                                    break;

                                case "sign_wait":
                                    $("#loading").removeClass("d-none");
                                    $("#status").text("Waiting for approval from Hive Auth App.");
                                    break;

                                case "sign_ack":
                                    $("#loading").addClass("d-none");
                                    $("#status").text("Swaping Done Successfully!");
                                    $("#status").addClass("text-success");
                                    updateSwap();

                                    //Added Here
                                    setSwapAmounts();
                                    break;

                                case "sign_nack":
                                    $("#loading").addClass("d-none");
                                    $("#status").text("Transaction was declined through HiveAuth.");
                                    updateSwap();
                                    break;

                                case "sign_err":
                                    $("#loading").addClass("d-none");
                                    $("#status").text("Transaction was unsuccessfull through HiveAuth.");
                                    updateSwap();
                                    break;
                            }
                        }
                    }

                    const auth_data = {
                        app: HAS_APP_DATA,
                        token: undefined,
                        challenge: undefined
                    };

                    auth_key = uuidv4();

                    if (localStorage['token']
                        && localStorage['auth_key']
                        && isTimeAvailable(localStorage['expire'])) {

                        token = localStorage['token'];
                        auth_key = localStorage['auth_key'];
                        auth_data.token = token;
                    }

                    const data = CryptoJS.AES.encrypt(JSON.stringify(auth_data), auth_key).toString();
                    const payload = { cmd: "auth_req", account: user, data: data, token: token };
                    ws.send(JSON.stringify(payload));
                } 
                else {
                    $("#loading").addClass("d-none");
                    $("#status").text("No method of transaction available.");
                    updateSwap();
                }
            } 
            else {
                $("#loading").addClass("d-none");
                $("#status").text("Balance or Liquidity is changed, Please try again.");
            }
        });
    });

    $("input[name=txtype]").change(function () {
        const el = $("input[type='radio'][name='txtype']");
        el.each(function () {
            if ($(this).prop("checked") == true) {
                $(this).parent("div").addClass("bg-primary");
            } 
            else {
                $(this).parent("div").removeClass("bg-primary");
            }
        });
    });

    refresh();

    $(".refreshHistory").click(function () {
        historyReader();
    });

    // update every 15 seconds
    /*
    (async function autoRefresh() {
        await refresh();
        await updateBalance();
        updateSwap();
        setTimeout(autoRefresh, 15000);
    })();
    */

    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    // dont need any await here
    // function awaitFunction () 
    // {
    //     return new Promise(function (resolve, reject) {
    //         setTimeout(function () {
    //             resolve();
    //         }, 1000);
    //     });
    // };

    const intervalBalances = async function () {
        var TIMEOUT = 1000 * 10;
        try {
            console.log("");
            console.warn("Here Refreshing");
            //const _await = await awaitFunction(); 
            // await timeout(TIMEOUT);   
            await refresh();
            await updateBalance();
            updateSwap();
            getExtBridge();
            historyReader();
            console.log("");
            console.warn("Refresh ended");
            // setting timeout for 30 secs
            setTimeout(intervalBalances, 30000);
        }
        catch (error) {
            console.log("Error @ Refreshing : ", error);
            setTimeout(intervalBalances, 30000);
        }
    };

    setTimeout(intervalBalances, 30000);

    async function setSwapAmounts() {
        var TIMEOUT = 1000 * 10;
        try {
            await timeout(TIMEOUT);
            console.log("Restting to Zero");
            $("#inputquantity").val("0.000");
            $("#outputquantity").val("0.000");
            $("#status").text("");
            $("#status").removeClass("text-success");
            $("#fee").text("0.000");            
            $("#swap").attr("disabled", "true");

            $("#vaultreward").text("0.000");
            $("#reward").text("0.000");
            $("#rewarddiv").removeClass("d-inline");
            $("#rewarddiv").addClass("d-none");
        }
        catch (error) {
            console.log("setSwapAmounts : ", error);
        }
    };

    //End of refresh
});


const historyReader = async () => {
    try {
        var historyFinal = await finalHistory();
        if (historyFinal.length > 0) {
            $("#historycard").removeClass("d-none");
            $("#historycard").addClass("d-flex");
            console.log(historyFinal);
            let tbHive = $("#historyHive");
            let tbSwapHive = $("#historySwapHive");
            tbHive.html("");
            tbSwapHive.html("");

            historyFinal.forEach((item, index) => {
                time = new Date(item.time).toLocaleString();
                let tr = $("<tr></tr>");
                tr.append(`<td><a class="link-info" target="_blank" href="https://peakd.com/@${item.to}">@${item.to}</a></td>`);
                tr.append(`<td>${item.amount}</td>`);
                tr.append(`<td>${item.type}</td>`);
                tr.append(`<td>${time}</td>`);
                tr.append(`<td><a class="link-info" target="_blank" href="${item.type === 'Hive' ? 'https://hiveblocks.com/tx/' : 'https://he.dtools.dev/tx/'}${item.trx}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">
                        <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
                        <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
                    </svg>
                </td>`);

                if (item.type === 'Hive') {
                    tbHive.append(tr);
                } 
                else {
                    tbSwapHive.append(tr);
                }
            });
        }
    }
    catch (error) {
        console.log("Error At historyReader : ", error);
    }
};

const finalHistory = async () => {
    var finalArray = [];
    try {
        var sortData = await sortHistory();
        if (sortData.length > 0) {
            var hiveArray = [];
            var swaphiveArray = [];
            for (let i = 0; i < sortData.length; i += 1) {
                var trx = sortData[i].trx;
                var to = sortData[i].to;
                var amount = sortData[i].amount;
                var time = sortData[i].time;
                var timeStamp = sortData[i].timeStamp;
                var type = sortData[i].type;

                if (type == "Hive") {
                    var ddata = {
                        "trx": trx,
                        "to": to,
                        "amount": amount,
                        "time": time,
                        "timeStamp": timeStamp,
                        "type": type
                    };
                    hiveArray.push(ddata);
                }

                if (type == "Swap.Hive") {
                    var ddata = {
                        "trx": trx,
                        "to": to,
                        "amount": amount,
                        "time": time,
                        "timeStamp": timeStamp,
                        "type": type
                    };
                    swaphiveArray.push(ddata);
                }
            }

            if (hiveArray.length > 0) {
                for (let i = 0; i < 3; i += 1) {
                    var ddata = {
                        "trx": hiveArray[i].trx,
                        "to": hiveArray[i].to,
                        "amount": hiveArray[i].amount,
                        "time": hiveArray[i].time,
                        "timeStamp": hiveArray[i].timeStamp,
                        "type": hiveArray[i].type
                    };
                    finalArray.push(ddata);
                }
            }

            if (swaphiveArray.length > 0) {
                for (let i = 0; i < 3; i += 1) {
                    var ddata = {
                        "trx": swaphiveArray[i].trx,
                        "to": swaphiveArray[i].to,
                        "amount": swaphiveArray[i].amount,
                        "time": swaphiveArray[i].time,
                        "timeStamp": swaphiveArray[i].timeStamp,
                        "type": swaphiveArray[i].type
                    };
                    finalArray.push(ddata);
                }
            }
        }
        return finalArray;
    }
    catch (error) {
        console.log("Error At finalHistory : ", error);
        return finalArray;
    }
};

const sortHistory = async () => {
    var sortArray = [];
    try {
        var processData = await processHistory();
        if (processData.length > 0) {
            processData.sort(function (a, b) {
                return parseFloat(b.timeStamp) - parseFloat(a.timeStamp);
            });
            sortArray = processData;
        }
        return sortArray;
    }
    catch (error) {
        console.log("Error At sortHistory : ", error);
        return sortArray;
    }
};

const processHistory = async () => {
    var historyArray = [];
    try {
        var historyData = await getHistory();
        if (historyData.length > 0) {
            for (let i = 0; i < historyData.length; i += 1) {
                var trx = historyData[i].trx;
                var to = historyData[i].to;
                var amount = historyData[i].amount;
                var time = historyData[i].time;
                var timeStamp = await setTimeStamp(time);
                var type = historyData[i].type;

                var ddata = {
                    "trx": trx,
                    "to": to,
                    "amount": amount,
                    "time": time,
                    "timeStamp": timeStamp,
                    "type": type
                };
                historyArray.push(ddata);
            }
        }
        return historyArray;
    }
    catch (error) {
        console.log("Error At processHistory : ", error);
        return historyArray;
    }
};

const getHistory = async () => {
    var trxArray = [];
    try {
        var resultData = await hive.api.getAccountHistoryAsync("uswap", -1, 50);
        if (resultData.length > 0) {
            resultData.forEach(function (tx) {
                var op = tx[1].op;
                var op_type = op[0];
                var op_value = op[1];
                var time = tx[1].timestamp;
                var trx_id = tx[1].trx_id;

                if (op_type == "transfer") {
                    if (op_value.from == "uswap" && op_value.to != "uswap.app") {
                        var trxTo = op_value.to;
                        var trxAmount = parseFloat(op_value.amount.replace("HIVE", "").trim());
                        var type = "Hive";
                        var ddata = {
                            "trx": trx_id,
                            "to": trxTo,
                            "amount": trxAmount,
                            "time": time,
                            "type": type
                        };
                        trxArray.push(ddata);
                    }
                }

                if (op_type == "custom_json") {
                    if (op_value.id == "ssc-mainnet-hive") {
                        var jsonParse = JSON.parse(op_value.json);
                        if (jsonParse.contractName == "tokens"
                            && jsonParse.contractAction == "transfer"
                            && jsonParse.contractPayload.symbol == "SWAP.HIVE"
                            && jsonParse.contractPayload.to != "uswap.app") {
                            var trxTo = jsonParse.contractPayload.to;
                            var trxAmount = parseFloat(jsonParse.contractPayload.quantity) || 0.0;
                            var type = "Swap.Hive";
                            var ddata = {
                                "trx": trx_id,
                                "to": trxTo,
                                "amount": trxAmount,
                                "time": time,
                                "type": type
                            };
                            trxArray.push(ddata);
                        }
                    }
                }
            });
        }
        return trxArray;
    }
    catch (error) {
        console.log("Error At getHistory : ", error);
        return trxArray;
    }
};

const setTimeStamp = async (time) => {
    try {
        var timeISO = time + '.000Z';
        var timeISODate = new Date(timeISO);
        var timeISOMilSec = timeISODate.getTime();
        var timeStamp = parseInt(timeISOMilSec);
        return timeStamp;
    }
    catch (error) {
        console.log("Error at setTimeStamp() : ", error);
    }
};

historyReader();