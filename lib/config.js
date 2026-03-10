const DEFAULT_NETWORKS = {
  "algorand-mainnet": {
    chain: "algorand",
    algodUrl: "https://mainnet-api.4160.nodely.dev",
    algodToken: "",
    indexerUrl: "https://mainnet-idx.4160.nodely.dev",
    indexerToken: "",
  },
  "voi-mainnet": {
    chain: "algorand",
    algodUrl: "https://mainnet-api.voi.nodely.dev",
    algodToken: "",
    indexerUrl: "https://mainnet-idx.voi.nodely.dev",
    indexerToken: "",
  },
};

function loadConfig() {
  let networks = { ...DEFAULT_NETWORKS };

  const envConfig = process.env.ULU_CORE_NETWORKS;
  if (envConfig) {
    try {
      const parsed = JSON.parse(envConfig);
      networks = { ...networks, ...parsed };
    } catch {
      console.error("Failed to parse ULU_CORE_NETWORKS env var");
    }
  }

  return { networks };
}

const config = loadConfig();

export default config;
