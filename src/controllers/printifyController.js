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
      const userId = req.user?.id || "test_user"; // Fallback pour les tests

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
   * Créer un produit sur Printify
   * POST /api/printify/create-product
   */
  async createProduct(req, res) {
    try {
      const {
        title,
        description,
        imageId,
        price,
        blueprint_id = 5,
        print_provider_id = 3,
      } = req.body;

      if (!title || !description || !imageId) {
        return res.status(400).json({
          success: false,
          message: "Title, description, and imageId are required",
        });
      }

      console.log(`🛍️  Création du produit: ${title}`);
      console.log(`💰 Prix: ${price || 25.99}€`);
      console.log(`🖼️  Image ID: ${imageId}`);

      // D'abord récupérer les shops disponibles
      const shops = await this.printifyService.getShops();
      if (!shops || shops.length === 0) {
        return res.status(500).json({
          success: false,
          message: "No shops available",
        });
      }

      const shopId = shops[0].id;
      console.log(`🏪 Utilisation du shop ID: ${shopId}`);

      const productData = {
        title,
        description,
        imageId,
        price: price ? Math.round(price * 100) : 2599, // Convertir en centimes
        blueprint_id,
        print_provider_id,
      };

      const result = await this.printifyService.createProduct(
        shopId,
        productData
      );

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ Error in createProduct controller:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to create product on Printify",
        error: error.message,
      });
    }
  }

  /**
   * Récupérer les variants disponibles
   * GET /api/printify/blueprints/:blueprintId/print-providers/:printProviderId/variants
   */
  async getVariants(req, res) {
    try {
      const { blueprintId, printProviderId } = req.params;

      if (!blueprintId || !printProviderId) {
        return res.status(400).json({
          success: false,
          message: "blueprintId and printProviderId are required",
        });
      }

      console.log(
        `Fetching variants for blueprint ${blueprintId} and provider ${printProviderId}...`
      );

      const result = await this.printifyService.getVariants(
        blueprintId,
        printProviderId
      );

      res.status(200).json({
        success: true,
        message: "Variants retrieved successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error in getVariants controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch variants",
        error: error.message,
      });
    }
  }

  /**
   * Récupérer les blueprints disponibles
   * GET /api/printify/blueprints
   */
  async getBlueprints(req, res) {
    try {
      const blueprints = await this.printifyService.getBlueprints();
      res.status(200).json({
        success: true,
        message: "Blueprints retrieved successfully",
        data: blueprints,
      });
    } catch (error) {
      console.error("❌ Error in getBlueprints controller:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve blueprints",
        error: error.message,
      });
    }
  }

  /**
   * Récupérer les fournisseurs d'impression pour un blueprint
   * GET /api/printify/blueprints/:blueprintId/print-providers
   */
  async getPrintProviders(req, res) {
    try {
      const { blueprintId } = req.params;
      if (!blueprintId) {
        return res.status(400).json({
          success: false,
          message: "Blueprint ID is required",
        });
      }

      const providers = await this.printifyService.getPrintProviders(
        blueprintId
      );
      res.status(200).json({
        success: true,
        message: "Print providers retrieved successfully",
        data: providers,
      });
    } catch (error) {
      console.error("❌ Error in getPrintProviders controller:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve print providers",
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

  async getShops(req, res) {
    try {
      const shops = await this.printifyService.getShops();
      res.status(200).json({
        success: true,
        message: "Shops retrieved successfully",
        data: shops,
      });
    } catch (error) {
      console.error("❌ Error in getShops controller:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve shops",
        error: error.message,
      });
    }
  }
}

module.exports = PrintifyController;
