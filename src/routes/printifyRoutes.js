const express = require("express");
const PrintifyController = require("../controllers/printifyController");
const { authenticateClerk } = require("../middleware/auth");

const router = express.Router();
const printifyController = new PrintifyController();

// Route d'upload d'image (sans authentification pour les tests)
router.post(
  "/upload-image",
  printifyController.uploadImage.bind(printifyController)
);

// Route de création de produit (sans authentification pour les tests)
router.post(
  "/create-product",
  printifyController.createProduct.bind(printifyController)
);

// Route pour récupérer les blueprints (sans authentification)
router.get(
  "/blueprints",
  printifyController.getBlueprints.bind(printifyController)
);

// Route pour récupérer les fournisseurs d'impression (sans authentification)
router.get(
  "/blueprints/:blueprintId/print-providers",
  printifyController.getPrintProviders.bind(printifyController)
);

// Route pour récupérer les variants (sans authentification)
router.get(
  "/blueprints/:blueprintId/print-providers/:printProviderId/variants",
  printifyController.getVariants.bind(printifyController)
);

// Route de health check (sans authentification)
router.get("/health", printifyController.healthCheck.bind(printifyController));

// Route pour récupérer tous les blueprints disponibles
router.get(
  "/blueprints",
  authenticateClerk,
  printifyController.getBlueprints.bind(printifyController)
);

// Route pour récupérer les print providers d'un blueprint
router.get(
  "/blueprints/:blueprintId/print-providers",
  authenticateClerk,
  printifyController.getPrintProviders.bind(printifyController)
);

// Route pour récupérer les variants d'un blueprint et print provider
router.get(
  "/blueprints/:blueprintId/print-providers/:printProviderId/variants",
  authenticateClerk,
  printifyController.getVariants.bind(printifyController)
);

// Route pour récupérer les shops disponibles
router.get(
  "/shops",
  authenticateClerk,
  printifyController.getShops.bind(printifyController)
);

// Route pour uploader une image
router.post(
  "/upload-image",
  authenticateClerk,
  printifyController.uploadImage.bind(printifyController)
);

// Route pour créer un produit
router.post(
  "/create-product",
  authenticateClerk,
  printifyController.createProduct.bind(printifyController)
);

// Route de santé
router.get("/health", printifyController.healthCheck.bind(printifyController));

module.exports = router;
