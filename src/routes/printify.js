const express = require("express");
const { authenticateClerk } = require("../middleware/auth");
const productController = require("../controllers/productController");
const uploadController = require("../controllers/uploadController");

const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
  console.log(
    `🌐 [API] ${req.method} ${req.originalUrl} - User: ${
      req.user?.id || "anonymous"
    }`
  );
  next();
});

// Route de santé (publique)
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "printify-service-malicknnd",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Routes du catalogue (publiques pour permettre la sélection)
router.get("/blueprints", productController.getBlueprints);
router.get(
  "/blueprints/:blueprintId/providers",
  productController.getProviders
);
router.get(
  "/blueprints/:blueprintId/providers/:providerId/variants",
  productController.getVariants
);

// Routes protégées (authentification Clerk requise)
router.use(authenticateClerk);

// Upload d'images (protégé)
router.post("/upload", uploadController.uploadImage);
router.get("/uploads", uploadController.getUploadedImages);

// Création de produit (protégé)
router.post("/product/create", productController.createProduct);

// Gestion des erreurs 404
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint non trouvé",
    code: "ENDPOINT_NOT_FOUND",
    availableEndpoints: [
      "GET /health",
      "GET /blueprints",
      "GET /blueprints/:id/providers",
      "GET /blueprints/:blueprintId/providers/:providerId/variants",
      "POST /upload",
      "GET /uploads",
      "POST /product/create",
    ],
  });
});

// Gestion des erreurs globales
router.use((error, req, res, next) => {
  console.error("❌ [ROUTES] Erreur:", error.message);

  res.status(500).json({
    success: false,
    error: "Erreur interne du serveur",
    code: "INTERNAL_SERVER_ERROR",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = router;
