let SWAPACCOUNT = "uswap";

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
		"https://api.hive.blue",
		"https://rpc.mahdiyari.info"
    ];

    var he_rpc_nodes = [
        "https://engine.rishipanthee.com", 
		"https://ha.herpc.dtools.dev", 
		"https://api.hive-engine.com",
		"https://api.primersion.com",
		"https://herpc.actifit.io"
    ];
    
    let ssc;

    let TIERONESPLIT = 0.5;
    let TIERTWOSPLIT = 1 - TIERONESPLIT;
    let TIERTHREESPLIT = 0.0;

    let NORMALFEE = 0.0035;
    let SPECFEE = 0.000;
    let REWARD = 0.0025;
    let SECUREFEESTATUS = false;
    let SECUREFEE = 0.0005;
    let VAULTREWARD = 0.000;

    let KSWAPDYNFEE = 0.005;

    let DECIMAL = 1000;

    async function checkHiveNodeStatus(nodeUrl, statusElement) {
        try 
        {
            const response = await axios.get(nodeUrl);
            if (response.status === 200) 
            {
                statusElement.textContent = "Working";
                statusElement.classList.remove("fail"); // Remove "fail" class if present
                statusElement.classList.add("working");
            } 
            else 
            {
                statusElement.textContent = "Fail";
                statusElement.classList.remove("working"); // Remove "working" class if present
                statusElement.classList.add("fail");
            }
        } 
        catch (error) 
        {
          statusElement.textContent = "Fail";
          statusElement.classList.remove("working"); // Remove "working" class if present
          statusElement.classList.add("fail");
        }
    };
    
    async function addHiveNodes() {
        try 
        {
            var buttonHive = document.getElementById("popup-button-hive");
            var popupHive = document.getElementById("popup-container-hive");
            const tableBody = document.querySelector("#api-list-hive tbody");
            const workingNodes = [];
            const failedNodes = [];            

            // Function to enable the button
            function enableButton() 
            {
                buttonHive.disabled = false;
            }

            // Clear the existing table body content
            tableBody.innerHTML = "";
    
            for (let i = 0; i < rpc_nodes.length; i++) 
            {
                const nodeUrl = rpc_nodes[i];
                const row = document.createElement("tr");
                const urlCell = document.createElement("td");
                const statusCell = document.createElement("td");
    
                urlCell.textContent = nodeUrl;
                urlCell.classList.add("node-url"); // add new class to url cell
                statusCell.textContent = "Checking...";
    
                row.appendChild(urlCell);
                row.appendChild(statusCell);
    
                tableBody.appendChild(row);
    
                // Check node status
                checkHiveNodeStatus(nodeUrl, statusCell);
            }
    
            // Reorder the list of nodes based on their status
            setTimeout(() => {
                const rows = Array.from(tableBody.getElementsByTagName("tr"));
    
                rows.forEach((row) => {
                    if (row.lastChild.textContent === "Working") 
                    {
                        workingNodes.push(row);
                    } 
                    else 
                    {
                        failedNodes.push(row);
                    }
                });
    
                tableBody.innerHTML = "";
    
                // Append workingNodes first, then failedNodes
                workingNodes.forEach((row) => {
                    tableBody.appendChild(row);
                });
    
                failedNodes.forEach((row) => {
                    tableBody.appendChild(row);
                });
            }, 5000);
    
            // Add event listeners to the rows in the table body
            var rowsHive = tableBody.getElementsByTagName("tr");
            for (var i = 0; i < rowsHive.length; i++) 
            {
                rowsHive[i].addEventListener("click", function (event) {
                    // Prevent the default link behavior
                    event.preventDefault();
    
                    // Get the node URL from the first cell in the row
                    var nodeUrl = this.cells[0].textContent;
    
                    // Set the API endpoint to the selected node
                    hive.api.setOptions({ url: nodeUrl });
    
                    // Update the button text
                    buttonHive.value = nodeUrl;
                    buttonHive.innerHTML = nodeUrl;
    
                    // Save the selected endpoint to local storage
                    localStorage.setItem("selectedEndpoint", nodeUrl);
    
                    // Hide the popup
                    popupHive.style.display = "none";
                    
                    enableButton();
    
                    // Reload the page after 1 second (adjust the time as needed)
                    setTimeout(function () {
                        location.reload();
                    }, 1000);
                });
            }
        } 
        catch (error) 
        {
            console.log("Error at addHiveNodes(): ", error);
        }
    };

    async function checkEngineNodeStatus(nodeUrl, statusElement) {        
        try 
        {
            const response = await axios.get(nodeUrl);
            if (response.status === 200) 
            {
                statusElement.textContent = "Working";
                statusElement.classList.remove("fail"); // Remove "fail" class if present
                statusElement.classList.add("working");
            } 
            else 
            {
                statusElement.textContent = "Fail";
                statusElement.classList.remove("working"); // Remove "working" class if present
                statusElement.classList.add("fail");
            }
        } 
        catch (error) 
        {
          statusElement.textContent = "Fail";
          statusElement.classList.remove("working"); // Remove "working" class if present
          statusElement.classList.add("fail");
        }
    };

    async function addEngineNodes() {
        try {
            var buttonEngine = document.getElementById("popup-button-engine");
            var popupEngine = document.getElementById("popup-container-engine");
            const tableBody = document.querySelector("#api-list-engine tbody");
            const workingNodes = [];
            const failedNodes = [];
    
            // Function to enable the button
            function enableButton() {
                buttonEngine.disabled = false;
            }
    
            // Clear the existing table body content
            tableBody.innerHTML = "";
    
            for (let i = 0; i < he_rpc_nodes.length; i++) 
            {
                const nodeUrl = he_rpc_nodes[i];
                const row = document.createElement("tr");
                const urlCell = document.createElement("td");
                const statusCell = document.createElement("td");
    
                urlCell.textContent = nodeUrl;
                urlCell.classList.add("node-url"); // add new class to url cell
                statusCell.textContent = "Checking...";
    
                row.appendChild(urlCell);
                row.appendChild(statusCell);
    
                tableBody.appendChild(row);
    
                // Check node status
                checkEngineNodeStatus(nodeUrl, statusCell);
            }
    
            // Reorder the list of nodes based on their status
            setTimeout(() => {
                const rows = Array.from(tableBody.getElementsByTagName("tr"));
    
                rows.forEach((row) => {
                    if (row.lastChild.textContent === "Working") {
                        workingNodes.push(row);
                    } else {
                        failedNodes.push(row);
                    }
                });
    
                tableBody.innerHTML = "";
    
                // Append workingNodes first, then failedNodes
                workingNodes.forEach((row) => {
                    tableBody.appendChild(row);
                });
    
                failedNodes.forEach((row) => {
                    tableBody.appendChild(row);
                });
            }, 5000);
    
            // Add event listeners to the rows in the table body
            var rowsEngine = tableBody.getElementsByTagName("tr");
            for (var i = 0; i < rowsEngine.length; i++) 
            {
                rowsEngine[i].addEventListener("click", function (event) {
                    // Prevent the default link behavior
                    event.preventDefault();
    
                    // Get the node URL from the first cell in the row
                    var nodeUrl = this.cells[0].textContent;
    
                    // Set the API endpoint to the selected node
                    ssc = new SSC(nodeUrl);
    
                    // Update the button text
                    buttonEngine.value = nodeUrl;
                    buttonEngine.innerHTML = nodeUrl;
    
                    // Save the selected endpoint to local storage
                    localStorage.setItem("selectedEngEndpoint", nodeUrl);
    
                    // Hide the popup
                    popupEngine.style.display = "none";
    
                    enableButton();
    
                    // Reload the page after 1 second (adjust the time as needed)
                    setTimeout(function () {
                        location.reload();
                    }, 1000);
                });
            }
        } 
        catch (error) 
        {
            console.log("Error at addEngineNodes(): ", error);
        }
    };    

    async function initializeHiveAPI() {
        var selectedEndpoint = await getSelectedEndpoint();
        console.log("SELECTE HIVE API NODE : ", selectedEndpoint);
        hive.api.setOptions({ url: selectedEndpoint });

        var button = document.getElementById("popup-button-hive");
        button.value = selectedEndpoint;
        button.innerHTML = selectedEndpoint;
    }

    async function initializeEngineAPI() {
        var selectedEngEndpoint = await getSelectedEngEndpoint();
        console.log("SELECTE ENGINE API NODE : ", selectedEngEndpoint);
        ssc = new SSC(selectedEngEndpoint);

        var button = document.getElementById("popup-button-engine");
        button.value = selectedEngEndpoint;
        button.innerHTML = selectedEngEndpoint;
    }

    async function processAPIs() {
        try 
        {             
            await initializeHiveAPI();            
            await initializeEngineAPI();            
        } 
        catch (error) 
        {
            console.log("Error while processing APIs: ", error);
        }
    };
      
    processAPIs();   

    hive.config.set('alternative_api_endpoints', rpc_nodes);

    window.history.replaceState({}, document.title, "/" + "");

    //const ssc = new SSC("https://engine.rishipanthee.com/");    

    var user = null, bal = { HIVE: 0, "SWAP.HIVE": 0, VAULT: 0 }, bridgebal;
    
    function dec(val) {
        return Math.floor(val * 1000) / 1000;
    };

    async function setFeesNRewards () {
        try
        { 
            let tieronefillamt = TIERONESPLIT * 100;
            let tiertwofillamt = TIERTWOSPLIT * 100;
            let tierthreefillamt = TIERTHREESPLIT * 100;

            tieronefill.textContent = tieronefillamt + "%";
            tiertwofill.textContent = tiertwofillamt + "%";
            //tierthreefill.textContent = tierthreefillamt + "%";

            msgtieronesplit.textContent = tieronefillamt + "%";
            msgtierthreesplit.textContent = tierthreefillamt + "%";

            let kswapfeenreward = KSWAPDYNFEE * 100;
            kswapreward.textContent = kswapfeenreward + "%";
            kswapfee.textContent = kswapfeenreward + "%";

            infotieronesplit.textContent = tieronefillamt + "%";

            if(SECUREFEESTATUS == true)
            {                
                let msgfeebal = SECUREFEE * 100;
                let tieronefnr = Math.floor(((REWARD + SECUREFEE + VAULTREWARD) * 100) * DECIMAL) / DECIMAL; 
                let tiertwofnr = Math.round(((NORMALFEE - VAULTREWARD) * 100) * DECIMAL) / DECIMAL;
                let tierthreefnr = Math.round(((SPECFEE + SECUREFEE - VAULTREWARD) * 100) * DECIMAL) / DECIMAL;
                
                msghivefee.textContent = msgfeebal + "%";
                msghivereward.textContent = msgfeebal + "%";

                tieronefeenreward.textContent = tieronefnr + "%";
                tiertwofeenreward.textContent = tiertwofnr + "%";
                //tierthreefeenreward.textContent = tierthreefnr + "%";

                progressbartierone.textContent = tieronefnr + "%";
                progressbartiertwo.textContent = tiertwofnr + "%";
                progressbartierthree.textContent = tierthreefnr + "%";

                infotieronesplitreward.textContent = tieronefnr + "%";
            }
            else
            {                
                let tieronefnr = Math.round(((REWARD + VAULTREWARD) * 100) * DECIMAL) / DECIMAL; 
                let tiertwofnr = Math.round(((NORMALFEE - VAULTREWARD) * 100) * DECIMAL) / DECIMAL;
                let tierthreefnr = Math.round(((SPECFEE - VAULTREWARD) * 100) * DECIMAL) / DECIMAL;
                
                msghivefee.textContent = "0.0%";
                msghivereward.textContent = "0.0%";

                tieronefeenreward.textContent = tieronefnr + "%";
                tiertwofeenreward.textContent = tiertwofnr + "%";
                //tierthreefeenreward.textContent = tierthreefnr + "%";

                progressbartierone.textContent = tieronefnr + "%";
                progressbartiertwo.textContent = tiertwofnr + "%";
                progressbartierthree.textContent = tierthreefnr + "%";

                infotieronesplitreward.textContent = tieronefnr + "%";
            }
        }
        catch (error)
        {
            console.log("Error at setFeesNRewards () : ", error);
        }
    };

    setFeesNRewards();

    async function getBalances (account) {
        try
        {
            const res = await hive.api.getAccountsAsync([account]);
            if(res.length > 0)
            {
                const res2 = await ssc.find("tokens", "balances", { account: account, symbol: { "$in": ["SWAP.HIVE", "VAULT"] } }, 1000, 0, []);
                console.log("res2 : ", res2);
                var swaphive = res2.find(el => el.symbol === "SWAP.HIVE");
                var vault = res2.find(el => el.symbol === "VAULT");
                return {
                    HIVE: dec(parseFloat(res[0].balance.split(" ")[0])),
                    SHIVE: dec(parseFloat((swaphive) ? swaphive.balance : 0)),
                    VAULT: dec(parseFloat((vault) ? vault.balance : 0))
                }
            }
            else
            {
                return { HIVE: 0.0, SHIVE: 0.0, VAULT: 0.0 }
            }
        }
        catch (error)
        {
            console.log("Error at getBalances () : ", error);
            return { HIVE: 0.0, SHIVE: 0.0, VAULT: 0.0 }
        }
    };   
        
    async function getExtBridge () {
        try
        {
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
        catch (error)
        {
            console.log("Error at getExtBridge() : ", error);
        }
    };   

    async function refresh() {
        try
        {
            updateMin();
            bridgebal = await getBalances(SWAPACCOUNT);            
            $("#hiveliquidity").text(bridgebal.HIVE.toFixed(3));
            $("#swaphiveliquidity").text(bridgebal.SHIVE.toFixed(3));
            
            console.log("");
            console.log(
                'Update Hive Liquidity: ' + bridgebal.HIVE.toFixed(3) + ' HIVE',
            );
            console.log(
                'Update SWAP.HIVE Liquidity: ' + bridgebal.SHIVE.toFixed(3) + ' SWAP.HIVE',
            );

            let totalBridgeAmount = Math.floor(bridgebal.HIVE + bridgebal.SHIVE);
            console.log("BRIDGE TOTAL : ", totalBridgeAmount);            
            
            let stablereq = totalBridgeAmount * TIERONESPLIT;

            if (bridgebal.HIVE < stablereq) {
                let requiredHive = Math.floor((stablereq - bridgebal.HIVE) * 1000) / 1000;
                $("#reqhive").text(requiredHive.toFixed(3));
            }
            else {
                $("#reqhive").text("0"); 
            }

            if (bridgebal.SHIVE < stablereq) {
                let requiredSwapHive = Math.floor((stablereq - bridgebal.SHIVE) * 1000) / 1000;
                $("#reqswaphive").text(requiredSwapHive.toFixed(3));
            }
            else {
                $("#reqswaphive").text("0"); 
            }

            await progressBarProcess(bridgebal);

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
        }
        catch (error)
        {
            console.log("Error at refresh() : ", error);
        }
    };

    async function progressBarProcess (bridgebal) {
        try
        {
            // Get the width of the progress bar
            const progressBar = document.querySelector(".progress");
            const progressBarWidth = progressBar.offsetWidth;
            console.log("progressBarWidth : ", progressBarWidth);

            // Get the positions of each progress bar segment
            const progressSuccess = document.querySelector(".progress-bar-success");
            const progressWarning = document.querySelector(".progress-bar-warning");
            const progressDanger = document.querySelector(".progress-bar-danger");

            let totalBalance = Math.floor(bridgebal.HIVE + bridgebal.SHIVE);
            let hiveBalance = bridgebal.HIVE;
            let shiveBalance = bridgebal.SHIVE;

            // Calculate the widths of each progress bar segment
            let successWidth = (TIERONESPLIT) * 100;
            let warningWidth = (TIERTWOSPLIT) * 100;
            let dangerWidth = (TIERTHREESPLIT) * 100;

            // Set the widths of the progress bars
            progressSuccess.style.width = `${successWidth}%`;
            progressWarning.style.width = `${warningWidth}%`;
            progressDanger.style.width = `${dangerWidth}%`;

            // Calculate the positions of Hive and Swap.Hive line pointers
            const hivePosition = Math.round((hiveBalance / totalBalance) * progressBarWidth);
            const shivePosition = Math.round((shiveBalance / totalBalance) * progressBarWidth);

            console.log("hivePosition : ", hivePosition);
            console.log("shivePosition : ", shivePosition);

            // Set the left position for hive-line-point and shive-line-point
            document.querySelector(".hive-line-point").style.left = `${hivePosition}px`;
            document.querySelector(".shive-line-point").style.left = `${shivePosition}px`;

            // Set the text of the Hive and Swap.Hive balances
            //document.querySelector("#hivebalance").textContent = `${hiveBalance} Hive`;
            //document.querySelector("#shivebalance").textContent = `${shiveBalance} Swap.Hive`;
        }
        catch (error)
        {
            console.log("Error at progressBarProcess() : ", error);
        }
    };

    async function processCalcFeeNReward (tOneSplit, tTwoSplit, hiveQty, BRIDGEFILLED) {
        let calcResult = [];
        try
        {
            let SPECIFICFEE = 0.0;
            let SWAPREWARD = 0.0;
            if(SECUREFEESTATUS == true)
            {
                SPECIFICFEE = SPECFEE + SECUREFEE;
                console.log("SPECIFICFEE : ", SPECIFICFEE);
                SWAPREWARD = REWARD + SECUREFEE;
                console.log("SWAPREWARD : ", SWAPREWARD);
            }
            else
            {
                SPECIFICFEE = SPECFEE;
                SWAPREWARD = REWARD;
            }
            
            if(tOneSplit > BRIDGEFILLED)
            {
                let tOneSplitQty = Math.floor((tOneSplit - BRIDGEFILLED) * DECIMAL) / DECIMAL;
                console.log("tOneSplitQty : ", tOneSplitQty);
    
                if(hiveQty > tOneSplitQty)
                {
                    let addiHiveQty = hiveQty - tOneSplitQty;
                    console.log("addiHiveQty : ", addiHiveQty);
    
                    if(addiHiveQty > tTwoSplit)
                    {
                        let specHiveQty = Math.floor((hiveQty - (tOneSplitQty + tTwoSplit)) * DECIMAL) / DECIMAL;
                        console.log("specHiveQty : ", specHiveQty);
                        let addiHiveFee = Math.ceil((tTwoSplit * NORMALFEE) * DECIMAL) / DECIMAL;                    
                        let specHiveFee = Math.ceil((specHiveQty * SPECIFICFEE) * DECIMAL) / DECIMAL;
                        let hiveFee = addiHiveFee + specHiveFee;
                        let hiveReward = Math.floor(((hiveQty - addiHiveQty) * swapReward) * DECIMAL) / DECIMAL;
                        console.log("hiveFee : ", hiveFee, "&& hiveReward : ", hiveReward);
                        var ddata = {
                            hivefee: hiveFee,
                            hivereward: hiveReward
                        };
                        calcResult.push(ddata);
                    }
                    else
                    {
                        let addiHiveFee = Math.ceil((addiHiveQty * NORMALFEE) * DECIMAL) / DECIMAL;
                        let hiveReward = Math.floor(((hiveQty - addiHiveQty) * SWAPREWARD) * DECIMAL) / DECIMAL;
                        console.log("addiHiveFee : ", addiHiveFee, "&& hiveReward : ", hiveReward);
                        var ddata = {
                            hivefee: addiHiveFee,
                            hivereward: hiveReward
                        };
                        calcResult.push(ddata);
                    }
                }
                else
                {
                    let hiveReward = Math.floor((hiveQty * SWAPREWARD) * DECIMAL) / DECIMAL;
                    console.log("Hive Fee : 0.00 & Hive Reward : ", hiveReward);
                    var ddata = {
                        hivefee: 0.0,
                        hivereward: hiveReward
                    };
                    calcResult.push(ddata);
                }
            }
            else
            {
                let tOnetTwoSplit = tOneSplit + tTwoSplit;
                if(tOnetTwoSplit > BRIDGEFILLED)
                {
                    let tOnetTwoSplitQty = Math.floor((tOnetTwoSplit - BRIDGEFILLED) * DECIMAL) / DECIMAL;
                    console.log("tOnetTwoSplitQty : ", tOnetTwoSplitQty);
    
                    if(hiveQty > tOnetTwoSplitQty)
                    {
                        let specHiveQty = Math.floor((hiveQty - tOnetTwoSplitQty) * DECIMAL) / DECIMAL;
                        console.log("specHiveQty : ", specHiveQty);
                        let addiHiveFee = Math.ceil((tOnetTwoSplitQty * NORMALFEE) * DECIMAL) / DECIMAL;
                        console.log("addiHiveFee : ", addiHiveFee);
                        let specHiveFee = Math.ceil((specHiveQty * SPECIFICFEE) * DECIMAL) / DECIMAL;
                        console.log("specHiveFee : ", specHiveFee);
                        let hiveFee = addiHiveFee + specHiveFee;
                        console.log("hiveFee : ", hiveFee);
                        var ddata = {
                            hivefee: hiveFee,
                            hivereward: 0.0
                        };
                        calcResult.push(ddata);
                    }
                    else
                    {
                        let hiveFee = Math.ceil((hiveQty * NORMALFEE) * DECIMAL) / DECIMAL;
                        console.log("hiveFee : ", hiveFee);
                        var ddata = {
                            hivefee: hiveFee,
                            hivereward: 0.0
                        };
                        calcResult.push(ddata);
                    }
                }
                else
                {
                    let hiveFee = Math.ceil((hiveQty * SPECIFICFEE) * DECIMAL) / DECIMAL;
                    console.log("hiveFee : ", hiveFee);
                    var ddata = {
                        hivefee: hiveFee,
                        hivereward: 0.0
                    };
                    calcResult.push(ddata);
                }
            }
            return calcResult;
        }
        catch (error)
        {
            console.log("Error at processCalc() : ", error);
            return calcResult;
        }
    };

    $("#refresh").click(async function () {
        $(this).attr("disabled", true);
        await refresh();
        $(this).removeAttr("disabled");
    });

    async function updateMin() {
        const insymbol = $("#input").val();
        if(insymbol === "HIVE" || insymbol === "SWAP.HIVE")
        {
            $("#minimum").text(`1 ${insymbol}`);
        }
        if(insymbol == "VAULT")
        {
            $("#minimum").text(`10 ${insymbol}`);
        }
    }

    async function updateSwap(r) {
        try 
        {
            updateMin();
            bridgebal = await getBalances(SWAPACCOUNT);
            const insymbol = $("#input").val();
            var outsymbol = $("#output").val();
            const val = $("#inputquantity").val();
            let fee = (insymbol === "VAULT") ? 0 : Math.ceil((val * VAULTREWARD) * DECIMAL) / DECIMAL;
            let reward = 0;
            let vaultReward = (insymbol === "VAULT") ? 0 : Math.floor((val * VAULTREWARD) * DECIMAL) / DECIMAL;
            let swapVal = parseFloat(val) || 0.0;

            let totalBridgeAmount = Math.floor(bridgebal.HIVE + bridgebal.SHIVE);

            let tOneSplit = Math.floor((totalBridgeAmount * TIERONESPLIT) * DECIMAL) / DECIMAL;
			let tTwoSplit = Math.floor((totalBridgeAmount * TIERTWOSPLIT) * DECIMAL) / DECIMAL;
			let tThreeSplit = Math.floor((totalBridgeAmount * TIERTHREESPLIT) * DECIMAL) / DECIMAL;

            console.log("BRIDGE tOneSplit : ", tOneSplit);
			console.log("BRIDGE tTwoSplit : ", tTwoSplit);
			console.log("BRIDGE tThreeSplit : ", tThreeSplit);

            let actualQty = 0.0;
            if(insymbol == "HIVE")
            {
                let bridgeHive = parseFloat(bridgebal.HIVE) || 0.0;                             
                actualQty = Math.floor((bridgeHive) * DECIMAL) / DECIMAL;
            }

            if(insymbol == "SWAP.HIVE")
            {
                let bridgeSHive = parseFloat(bridgebal.SHIVE) || 0.0;
                actualQty = Math.floor((bridgeSHive) * DECIMAL) / DECIMAL;
            }

			console.log("BRIDGE", insymbol, "FILLED : ", actualQty);
			console.log("BRIDGE IN : ", swapVal);

            let getCalcNReward = await processCalcFeeNReward(tOneSplit, tTwoSplit, swapVal, actualQty);
            console.log("getCalcNReward : ", getCalcNReward);
            if(getCalcNReward.length > 0)
			{
                fee = parseFloat(getCalcNReward[0].hivefee) || 0.0;
                reward = parseFloat(getCalcNReward[0].hivereward) || 0.0;
            }
            else
            {
                fee = 0.0;
                reward = 0.0;
                val = 0.0;
            }            

            $("#fee").text(fee.toFixed(3));
            //$("#vaultreward").text(vaultReward.toFixed(3));

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
            //$("rewardticker").text(insymbol);
            rewardticker.textContent = outsymbol;

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
            
            let userbal = await getBalances(user);

            //let calcSlipage = await updateSlipageQty(swapVal, outsymbol);            
            
            if(outsymbol === "HIVE"
                && bridgebal.HIVE >= output
                && userbal.SHIVE >= val
                && insymbol !== outsymbol
                && val >= 1
                && insymbol === "SWAP.HIVE"
            )
            {
                $("#swap").removeAttr("disabled");
                if (r) r(true, parseFloat(val).toFixed(3), insymbol, output.toFixed(3));
            }
            else if(outsymbol === "SWAP.HIVE"
                && bridgebal.SHIVE >= output
                && userbal.HIVE >= val
                && insymbol !== outsymbol
                && val >= 1
                && insymbol === "HIVE"
            )
            {
                $("#swap").removeAttr("disabled");
                if (r) r(true, parseFloat(val).toFixed(3), insymbol, output.toFixed(3));
            }            
            else 
            {
                $("#swap").attr("disabled", "true");
                if (r) r(false);
            }
        } 
        catch (error) 
        { 
            console.log("Error at updateSwap () : ", error); 
        }
    };

    /*
    async function updateSlipageQty(inputVal, outSymbol) {
        let RADIOFEE = 0.0;        
        let selectedRadioElement = document.querySelector('input[name="my-radio-group"]:checked');
        let selectedRadioVal = selectedRadioElement ? parseFloat(selectedRadioElement.value) : 0;        
        RADIOFEE = selectedRadioVal / 100;
        if(SECUREFEESTATUS == true)
        {
            RADIOFEE = RADIOFEE + SECUREFEE;
            $("#securefeestatus").removeClass("d-none");
            $("#securefeestatus").addClass("secure-fee-info");
        }
        else
        {
            $("#securefeestatus").removeClass("secure-fee-info");
            $("#securefeestatus").addClass("d-none");
        }
        let calcSlipage = Math.floor((inputVal - (inputVal * RADIOFEE)) * DECIMAL) / DECIMAL;
        let slipageQty = document.getElementById('slipageqty');
        slipageQty.textContent = Math.floor((calcSlipage) * DECIMAL) / DECIMAL;
        minreceivesymbol.textContent = outSymbol;
        securefeeinfo.textContent = (SECUREFEE * 100) + "%";
        return calcSlipage;
    };
    */

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

    $("[name='my-radio-group']").change(() => { 
        updateSwap();
    });

    $("#reverse").click(function () {
        var input = $("#input").val();
        $("#input").val($("#output").val());
        $("#output").val(input);
        updateSwap();
    });

    async function updateBalance() {
        try
        {
            bal = await getBalances(user);
            console.log("bal HERE : ", bal);
            console.log("");
            console.log(
                `Update Hive Balance: @${user} ` + bal.HIVE.toFixed(3) + ' HIVE',
            );

            console.log(
                `Update SWAP.HIVE Balance: @${user} ` + bal.SHIVE.toFixed(3) + ' SWAP.HIVE',
            );

            $("#hive").text(bal.HIVE.toFixed(3));
            $("#swaphive").text(bal.SHIVE.toFixed(3));
            $("#vault").text(bal.VAULT.toFixed(3));
        }
        catch (error)
        {
            console.log("Error at updateBalance() : ", error);
        }
    };

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

    $(document).ready(function() {
        var css1 = document.querySelector("link[href='css/main-black.css']");
        var css2 = document.querySelector("link[href='css/main-brown.css']");
        
        // Check local storage for saved theme
        if (localStorage.getItem("theme") === "brown") {
          css1.disabled = true;
          css2.disabled = false;
        } else {
          css1.disabled = false;
          css2.disabled = true;
        }
        
        $("#logo").show();
        
        $("#changeThemeBlack").click(function() {
          css1.disabled = false;
          css2.disabled = true;
          localStorage.setItem("theme", "black"); // Save selected theme to local storage
          $("body").fadeOut(400, function() {
            $("body").fadeIn(400);
          });
        });
      
        $("#changeThemeBrown").click(function() {
          css1.disabled = true;
          css2.disabled = false;
          localStorage.setItem("theme", "brown"); // Save selected theme to local storage
          $("body").fadeOut(400, function() {
            $("body").fadeIn(400);
          });
        });
    
        loadHiveNode();
        loadEngineNode();
        loadSecureFeeMsg();
    }); 

    async function loadHiveNode() {
        try 
        {
            // Get a reference to the button and the popup container
            var buttonHive = document.getElementById("popup-button-hive");
            var popupHive = document.getElementById("popup-container-hive");          
    
            // Store the interval ID
            var addHiveNodesInterval;

            // Function to disable the button
            function disableButton() {
                buttonHive.disabled = true;
            }

            // Function to enable the button
            function enableButton() {
                buttonHive.disabled = false;
            }
    
            // Add an event listener to the button
            buttonHive.addEventListener("click", function () {
                // Show the popup
                popupHive.style.display = "block";
                disableButton();
                addHiveNodes();
                addHiveNodesInterval = setInterval(addHiveNodes, 60000);
            });
    
            // Get a reference to the API list table body
            var tableBodyHive = document.querySelector("#api-list-hive tbody");
    
            // Add an event listener to the close button
            var closeButtonHive = document.getElementById("close-button-hive");
            closeButtonHive.addEventListener("click", function () {
                // Hide the popup
                popupHive.style.display = "none";
                enableButton();
    
                // Clear the interval if it exists
                if (addHiveNodesInterval) 
                {
                    clearInterval(addHiveNodesInterval);
                }
    
                // Remove all rows from the table body
                tableBodyHive.innerHTML = "";
            });
    
            // Add an event listener to the table body
            tableBodyHive.addEventListener("click", function (event) {
                var target = event.target;
                if (target && target.nodeName === "TD") 
                {
                    // Get the node URL from the first cell in the row
                    var nodeUrl = target.parentNode.cells[0].textContent;
    
                    // Set the API endpoint to the selected node
                    hive.api.setOptions({ url: nodeUrl });
    
                    // Update the button text
                    buttonHive.value = nodeUrl;
                    buttonHive.innerHTML = nodeUrl;
    
                    // Save the selected endpoint to local storage
                    localStorage.setItem("selectedEndpoint", nodeUrl);
    
                    // Hide the popup
                    popupHive.style.display = "none";
                    enableButton();
    
                    // Remove all rows from the table body
                    tableBodyHive.innerHTML = "";
    
                    // Reload the page after 1 second (adjust the time as needed)
                    setTimeout(function () {
                        location.reload();
                    }, 1000);
                }
            });

            // Add an event listener to check if the popup is still open after 1 minute
            popupHive.addEventListener("transitionend", function () {
                if (popupHive.style.display === "block") 
                {
                    // Clear the interval if it exists
                    if (addHiveNodesInterval) {
                        clearInterval(addHiveNodesInterval);
                    }

                    // Update the current set of APIs
                    addHiveNodes();
                    addHiveNodesInterval = setInterval(addHiveNodes, 60000);
                }
            });
        } 
        catch (error) 
        {
            console.log("Error at loadHiveNode(): ", error);
        }
    };
    
    async function loadEngineNode() {
        try 
        {
            // Get a reference to the button and the popup container
            var buttonEngine = document.getElementById("popup-button-engine");
            var popupEngine = document.getElementById("popup-container-engine");

            // Store the interval ID
            var addEngineNodesInterval;

            // Function to disable the button
            function disableButton() 
            {
                buttonEngine.disabled = true;
            }

            // Function to enable the button
            function enableButton() 
            {
                buttonEngine.disabled = false;
            }

            // Add an event listener to the button
            buttonEngine.addEventListener("click", function () {
                // Show the popup
                popupEngine.style.display = "block";
                disableButton();
                addEngineNodes();
                addEngineNodesInterval = setInterval(addEngineNodes, 60000);
            });

            // Get a reference to the API list table body
            var tableBodyEngine = document.querySelector("#api-list-engine tbody");

            // Add an event listener to the close button
            var closeButtonEngine = document.getElementById("close-button-engine");
            closeButtonEngine.addEventListener("click", function () {
                // Hide the popup
                popupEngine.style.display = "none";
                enableButton();

                // Clear the interval if it exists
                if (addEngineNodesInterval) 
                {
                    clearInterval(addEngineNodesInterval);
                }

                // Remove all rows from the table body
                tableBodyEngine.innerHTML = "";
            });

            // Add an event listener to the table body
            tableBodyEngine.addEventListener("click", function (event) {
                var target = event.target;
                if (target && target.nodeName === "TD") 
                {
                    // Get the node URL from the first cell in the row
                    var nodeUrl = target.parentNode.cells[0].textContent;

                    // Set the API endpoint to the selected node
                    ssc = new SSC(nodeUrl);

                    // Update the button text
                    buttonEngine.value = nodeUrl;
                    buttonEngine.innerHTML = nodeUrl;

                    // Save the selected endpoint to local storage
                    localStorage.setItem("selectedEngEndpoint", nodeUrl);

                    // Hide the popup
                    popupEngine.style.display = "none";
                    enableButton();

                    // Remove all rows from the table body
                    tableBodyEngine.innerHTML = "";

                    // Reload the page after 1 second (adjust the time as needed)
                    setTimeout(function () {
                        location.reload();
                    }, 1000);
                }
            });

            // Add an event listener to check if the popup is still open after 1 minute
            popupEngine.addEventListener("transitionend", function () {
                if (popupEngine.style.display === "block") 
                {
                    // Clear the interval if it exists
                    if (addEngineNodesInterval) {
                        clearInterval(addEngineNodesInterval);
                    }

                    // Update the current set of APIs
                    addEngineNodes();
                    addEngineNodesInterval = setInterval(addEngineNodes, 60000);
                }
            });
        } 
        catch (error) 
        {
            console.log("Error at loadEngineNode(): ", error);
        }
    };
    
    async function loadSecureFeeMsg() {
        try 
        {
            if (SECUREFEESTATUS) {
                var popUpMsgBar = document.querySelector(".popup-msg-bar");
                popUpMsgBar.style.display = "block";
            }            
        } 
        catch (error) 
        {
            console.log("Error at loadSecureFeeMsg(): ", error);
        }
    };    

    $(window).scroll(function() {
        var scrollHeight = $(document).height() - $(window).height();
        if ($(this).scrollTop() >= scrollHeight - $('.bottom-bar').outerHeight()) {
          $('.bottom-bar').addClass('fixed');
        } else {
          $('.bottom-bar').removeClass('fixed');
        }
    });           

    if (localStorage['user']) {
        $("#username").val(localStorage['user']);
        user = localStorage['user'];
        updateBalance();
    };

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
                            SWAPACCOUNT,
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
                            SWAPACCOUNT,
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
                                                    "to": SWAPACCOUNT,
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
                                                        to: SWAPACCOUNT,
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

    $("#closepopupmsg").click (async function () {        
        var popupMsgBar = document.querySelector(".popup-msg-bar");
        popupMsgBar.style.display = "none";
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
        try 
        {
            await timeout(TIMEOUT);
            console.log("Restting to Zero");
            $("#inputquantity").val("0.000");
            $("#outputquantity").val("0.000");
            $("#status").text("");
            $("#status").removeClass("text-success");
            $("#fee").text("0.000"); 
            $("#slipageqty").text("0.000");           
            $("#swap").attr("disabled", "true");

            //$("#vaultreward").text("0.000");
            $("#reward").text("0.000");
            $("#rewarddiv").removeClass("d-inline");
            $("#rewarddiv").addClass("d-none");
            $("#securefeestatus").removeClass("secure-fee-info");
            $("#securefeestatus").addClass("d-none");
        }
        catch (error) {
            console.log("setSwapAmounts : ", error);
        }
    };
    
    refresh();
    getExtBridge();

    //End of refresh
});

async function getSelectedEndpoint() {
    var endpoint = await localStorage.getItem("selectedEndpoint");
    if (endpoint) 
    {
      return endpoint;
    } 
    else 
    {
      return "https://anyx.io";
    }
};

async function getSelectedEngEndpoint() {
    var endpoint = await localStorage.getItem("selectedEngEndpoint");
    if (endpoint) 
    {
      return endpoint;
    } 
    else 
    {
      return "https://engine.rishipanthee.com";
    }
};

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
        var resultData = await hive.api.getAccountHistoryAsync(SWAPACCOUNT, -1, 50);
        if (resultData.length > 0) {
            resultData.forEach(function (tx) {
                var op = tx[1].op;
                var op_type = op[0];
                var op_value = op[1];
                var time = tx[1].timestamp;
                var trx_id = tx[1].trx_id;

                if (op_type == "transfer") {
                    if (op_value.from == SWAPACCOUNT && op_value.to != "uswap.app") {
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
