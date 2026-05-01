export const config = {
  PORT: process.env.PORT || 8004,
  MONGO_URI: process.env.MONGO_URI || "mongodb://mongo:27017",
  MONGO_DB: process.env.MONGO_DB || "rentpi_chat",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CENTRAL_API_URL: process.env.CENTRAL_API_URL || "https://technocracy.brittoo.xyz",
  CENTRAL_API_TOKEN: process.env.CENTRAL_API_TOKEN,
  ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:8003",
  RENTAL_SERVICE_URL: process.env.RENTAL_SERVICE_URL || "http://rental-service:8002",
};
