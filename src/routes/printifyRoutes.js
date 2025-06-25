const express = require("express");
const PrintifyController = require("../controllers/printifyController");
const { authenticateClerk } = require("../middleware/auth");

const router = express.Router();
const printifyController = new PrintifyController();

// Route d'upload d'image (avec authentification Clerk)
router.post(
  "/upload-image",
  authenticateClerk,
  printifyController.uploadImage.bind(printifyController)
);

// Route de health check (sans authentification)
router.get("/health", printifyController.healthCheck.bind(printifyController));

module.exports = router;
