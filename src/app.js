const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { validateConfig } = require("./config/printify");
const printifyRoutes = require("./routes/printify");

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend.com"]
        : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎨 Printify Service MalicknND - Service de création de produits",
    version: "1.0.0",
    endpoints: {
      health: "/api/printify/health",
      blueprints: "/api/printify/blueprints",
      createProduct: "POST /api/printify/product/create",
    },
  });
});

// API Printify
app.use("/api/printify", printifyRoutes);

// Gestion des erreurs 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée",
    requestedPath: req.originalUrl,
  });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error("❌ [SERVER] Erreur globale:", error.message);

  res.status(500).json({
    success: false,
    error: "Erreur interne du serveur",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    console.log("🚀 [STARTUP] Démarrage du service Printify...");

    // Valider la configuration
    validateConfig();

    app.listen(PORT, () => {
      console.log("✅ [STARTUP] Serveur démarré avec succès!");
      console.log(`🌐 [STARTUP] URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ [STARTUP] Erreur de démarrage:", error.message);
    process.exit(1);
  }
};

startServer();
