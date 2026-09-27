/**
 * Configuration and Constants
 * Contains all configuration values, RPC nodes, and constants
 */

const CONFIG = {
    // Version Information
    // FRONTEND_VERSION is the source of truth for this app: it is shown in the
    // footer and drives the service worker cache name (see sw.js), so bumping
    // it is what actually pushes a new build out to returning visitors.
    FRONTEND_VERSION: "2.1.2",
    // Fallback only: used when fee.json does not publish a version. fee.json
    // currently publishes none, so this IS what the footer shows - keep it in
    // step with the deployed backend script.
    BACKEND_VERSION: "1.6.5",

    // Fee Configuration
    DECIMAL: 1000,
    BASE_FEE: 0.002,
    MIN_BASE_FEE: 0.00075,
    DIFF_COEFFICIENT: 0.00575,
    BASE_PRICE_HIVE_TO_SHIVE: 1.00,
    
    // Bridge Configuration
    //
    // MINIMUM_LIQUIDITY: the bridge must hold at least this much combined
    // liquidity (HIVE + SWAP.HIVE) before swaps are allowed. fee.json
    // publishes this value; the number here is the fallback used when that
    // endpoint is unreachable. It also seeds the pool figures used for fee
    // estimation (split evenly) until the real @uswap balances load, which
    // is why the old hardcoded HIVEPOOL/SHIVEPOOL pair is no longer needed.
    MINIMUM_LIQUIDITY: 48000,

    // IS_STOPPED: operator kill switch. fee.json publishes this; the value
    // here is the fallback when that endpoint is unreachable. It fails OPEN
    // so a transient outage of fee.json does not take the bridge offline for
    // everyone - the live value from fee.json is what actually pauses swaps.
    IS_STOPPED: false,

    BRIDGE_USER: "uswap",
    
    // API URLs
    COINGECKO_HIVE_URL: "https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd",
    COINGECKO_HBD_URL: "https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&vs_currencies=usd",
    USWAP_FEE_JSON: "https://fee.uswap.app/fee.json",
    // Hive RPC Nodes - verified working 2026-09-27, fastest first.
    // Dead nodes removed: anyx.io (502), rpc.ausbit.dev (521), hived.emre.sh
    // (refused), hive-api.arcange.eu (timeout), rpc.ecency.com (DNS gone),
    // api.hive.blue (reset), hive.roelandp.nl (flaky, 2/5).
    HIVE_RPC_NODES: [
        "https://api.deathwing.me",  // 470ms
        "https://techcoderx.com",  // 636ms
        "https://api.hive.blog",  // 848ms
        "https://api.openhive.network",  // 918ms
        "https://api.c0ff33a.uk",  // 1027ms
        "https://rpc.mahdiyari.info"  // 1057ms
    ],

    // Hive Engine RPC Nodes - verified working 2026-09-27, fastest first.
    // Each was checked on BOTH endpoints the app uses (/contracts and
    // /blockchain). Removed: engine.rishipanthee.com (DNS no longer resolves).
    ENGINE_RPC_NODES: [
        "https://api.primersion.com",  // 568ms
        "https://enginerpc.com",  // 624ms
        "https://herpc.actifit.io",  // 625ms
        "https://herpc.dtools.dev",  // 642ms
        "https://api2.hive-engine.com/rpc",  // 655ms
        "https://api.hive-engine.com/rpc"  // 732ms
    ],
    
    // Default Endpoints
    DEFAULT_HIVE_ENDPOINT: "https://api.deathwing.me",
    DEFAULT_ENGINE_ENDPOINT: "https://api.primersion.com",

    // Minimum Swap Amount
    MINIMUM_SWAP: 1,

    // Swap completion verification.
    // A swap is only "done" once the bridge sends the funds back in a separate
    // transaction whose memo carries our original tx id, so the UI polls
    // @uswap's Hive + Hive Engine history instead of trusting the broadcast.
    SWAP_VERIFY_INITIAL_DELAY: 8000,   // let the chain settle before looking
    SWAP_VERIFY_INTERVAL: 8000,        // gap between checks
    SWAP_VERIFY_TIMEOUT: 180000,       // give up after 3 minutes (stays pending)

    // Hive Auth (HAS) Configuration - ported from uswapapp
    HIVE_AUTH_SERVER: "wss://hive-auth.arcange.eu",
    HIVE_AUTH_APP_DATA: {
        name: "SWAP HIVE",
        description: "Liquidity Bridge",
        // TODO: point this at the deployed uswapui icon once the domain is live
        icon: "https://uswap.app/assets/hiveupme.png"
    },
    // How long to wait for a Hive Auth round-trip before giving up
    HIVE_AUTH_TIMEOUT: 120000
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
