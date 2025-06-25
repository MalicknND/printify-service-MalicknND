const PrintifyService = require("../services/printifyService");

class PrintifyController {
  constructor() {
    this.printifyService = new PrintifyService();
  }

  /**
   * Upload une image sur Printify
   * POST /api/printify/upload-image
   */
  async uploadImage(req, res) {
    try {
      const { imageUrl } = req.body;
      const userId = req.user.id;

      // Validation
      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "imageUrl is required",
        });
      }

      if (!imageUrl.startsWith("http")) {
        return res.status(400).json({
          success: false,
          message: "imageUrl must be a valid HTTP URL",
        });
      }

      console.log(
        `User ${userId} requesting image upload to Printify: ${imageUrl}`
      );

      // Upload l'image sur Printify
      const result = await this.printifyService.uploadImage(imageUrl);

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully to Printify",
        data: {
          printifyImageId: result.printifyImageId,
          userId: userId,
          originalImageUrl: imageUrl,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error in uploadImage controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload image to Printify",
        error: error.message,
      });
    }
  }

  /**
   * Health check du service
   * GET /api/printify/health
   */
  async healthCheck(req, res) {
    try {
      const health = await this.printifyService.healthCheck();

      if (health.success) {
        res.status(200).json(health);
      } else {
        res.status(503).json(health);
      }
    } catch (error) {
      console.error("Health check error:", error);
      res.status(503).json({
        success: false,
        message: "Service unavailable",
        error: error.message,
      });
    }
  }
}

module.exports = PrintifyController;
