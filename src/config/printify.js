const axios = require("axios");

const printifyConfig = {
  apiKey: process.env.PRINTIFY_API_KEY,
  shopId: process.env.PRINTIFY_SHOP_ID,
  baseURL: "https://api.printify.com/v1",
  defaultMargin: parseFloat(process.env.DEFAULT_MARGIN_PERCENT) || 40,
};

// Instance axios configurée pour Printify
const printifyAPI = axios.create({
  baseURL: printifyConfig.baseURL,
  headers: {
    Authorization: `Bearer ${printifyConfig.apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "PrintifyService-MalicknND/1.0",
  },
  timeout: 30000,
});

// Intercepteur pour les logs
printifyAPI.interceptors.request.use(
  (config) => {
    console.log(`📤 [PRINTIFY] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ [PRINTIFY] Request error:", error.message);
    return Promise.reject(error);
  }
);

printifyAPI.interceptors.response.use(
  (response) => {
    console.log(`✅ [PRINTIFY] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      `❌ [PRINTIFY] Error ${error.response?.status || "NETWORK"} ${
        error.config?.url
      }`
    );
    if (error.response?.data) {
      console.error("📋 Error details:", error.response.data);
    }
    return Promise.reject(error);
  }
);

// Validation de la config
const validateConfig = () => {
  if (!printifyConfig.apiKey || !printifyConfig.shopId) {
    throw new Error(
      "❌ PRINTIFY_API_KEY et PRINTIFY_SHOP_ID sont requis dans .env"
    );
  }
  console.log("✅ Configuration Printify validée");
  console.log(`🏪 Shop ID: ${printifyConfig.shopId}`);
  console.log(`💰 Marge par défaut: ${printifyConfig.defaultMargin}%`);
};

module.exports = {
  printifyConfig,
  printifyAPI,
  validateConfig,
};
