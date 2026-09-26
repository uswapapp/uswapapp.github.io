/**
 * Configuration and Constants
 * Contains all configuration values, RPC nodes, and constants
 */

const CONFIG = {
    // Version Information
    // FRONTEND_VERSION is the source of truth for this app: it is shown in the
    // footer and drives the service worker cache name (see sw.js), so bumping
    // it is what actually pushes a new build out to returning visitors.
    FRONTEND_VERSION: "2.1.0",
    // Fallback only. The live value is read from fee.json when the backend
    // publishes one, so this cannot silently drift out of date.
    BACKEND_VERSION: "1.6.5",

    // Fee Configuration
    DECIMAL: 1000,
    BASE_FEE: 0.002,
    MIN_BASE_FEE: 0.00075,
    DIFF_COEFFICIENT: 0.00575,
    BASE_PRICE_HIVE_TO_SHIVE: 1.00,
    
    // Pool Configuration
    HIVEPOOL: 24900,
    SHIVEPOOL: 24900,
    BRIDGE_USER: "uswap",
    
    // API URLs
    COINGECKO_HIVE_URL: "https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd",
    COINGECKO_HBD_URL: "https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&vs_currencies=usd",
    USWAP_FEE_JSON: "https://fee.uswap.app/fee.json",
    
    // Hive RPC Nodes
    HIVE_RPC_NODES: [
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
    ],
    
    // Hive Engine RPC Nodes
    ENGINE_RPC_NODES: [
        "https://api.primersion.com",
        "https://api2.hive-engine.com/rpc",
        "https://enginerpc.com",
        "https://api.hive-engine.com/rpc",
        "https://herpc.actifit.io",
        "https://herpc.dtools.dev"
    ],
    
    // Default Endpoints
    DEFAULT_HIVE_ENDPOINT: "https://anyx.io",
    DEFAULT_ENGINE_ENDPOINT: "https://enginerpc.com",

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
