const axios = require("axios");

class PrintifyService {
  constructor() {
    this.apiToken = process.env.PRINTIFY_API_TOKEN;
    this.apiUrl = process.env.PRINTIFY_API_URL || "https://api.printify.com/v1";

    if (!this.apiToken) {
      throw new Error("PRINTIFY_API_TOKEN is required");
    }

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Upload une image sur Printify depuis une URL
   * @param {string} imageUrl - URL de l'image (Supabase)
   * @returns {Promise<Object>} - Réponse de Printify avec l'ID de l'image
   */
  async uploadImage(imageUrl) {
    try {
      console.log(`Uploading image from URL: ${imageUrl}`);

      const response = await this.client.post("/uploads/images.json", {
        file_name: `image_${Date.now()}.png`,
        url: imageUrl,
      });

      console.log("Image uploaded successfully to Printify:", response.data);
      return {
        success: true,
        data: response.data,
        printifyImageId: response.data.id,
      };
    } catch (error) {
      console.error(
        "Error uploading image to Printify:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to upload image to Printify: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Récupérer les variants disponibles pour un blueprint et print provider
   * @param {number} blueprintId - ID du blueprint
   * @param {number} printProviderId - ID du fournisseur d'impression
   * @returns {Promise<Object>} - Liste des variants
   */
  async getVariants(blueprintId, printProviderId) {
    try {
      const response = await this.client.get(
        `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
      );
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.variants)) {
        return response.data.variants;
      } else {
        return [];
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des variants:",
        error.message
      );
      return [];
    }
  }

  /**
   * Créer un produit sur Printify
   * @param {Object} productData - Données du produit
   * @param {string} productData.title - Titre du produit
   * @param {string} productData.description - Description du produit
   * @param {string} productData.printifyImageId - ID de l'image Printify
   * @param {number} productData.price - Prix du produit
   * @param {string} productData.blueprintId - ID du blueprint (type de produit)
   * @param {string} productData.printProviderId - ID du fournisseur d'impression
   * @returns {Promise<Object>} - Réponse de Printify avec l'ID du produit
   */
  async createProduct(shopId, productData) {
    try {
      console.log("🛍️  Création du produit sur Printify...");

      // D'abord récupérer les variants pour ce blueprint et print provider
      const variants = await this.getVariants(
        productData.blueprint_id,
        productData.print_provider_id
      );

      if (!variants || variants.length === 0) {
        throw new Error(
          "No variants found for this blueprint and print provider"
        );
      }

      // Utiliser les premiers variants disponibles (on peut améliorer la sélection plus tard)
      const selectedVariants = variants.slice(0, 3); // Prendre les 3 premiers variants
      const variantIds = selectedVariants.map((v) => v.id);

      // Construire le payload avec les vrais IDs de variants
      const payload = {
        title: productData.title,
        description: productData.description,
        blueprint_id: productData.blueprint_id,
        print_provider_id: productData.print_provider_id,
        variants: selectedVariants.map((variant) => ({
          id: variant.id,
          price: productData.price || 2599, // Prix en centimes
          is_enabled: true,
        })),
        print_areas: [
          {
            variant_ids: variantIds,
            placeholders: [
              {
                position: "front",
                images: [
                  {
                    id: productData.imageId,
                    x: 0.5,
                    y: 0.5,
                    scale: 1,
                    angle: 0,
                  },
                ],
              },
            ],
          },
        ],
      };

      console.log(
        "📦 Payload avec vrais variants:",
        JSON.stringify(payload, null, 2)
      );

      const response = await this.client.post(
        `/shops/${shopId}/products.json`,
        payload
      );

      console.log("✅ Produit créé avec succès !");
      return response.data;
    } catch (error) {
      console.error("❌ Erreur lors de la création du produit:", error.message);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }

      throw new Error(`Failed to create product on Printify: ${error.message}`);
    }
  }

  /**
   * Récupérer les blueprints disponibles (types de produits)
   * @returns {Promise<Object>} - Liste des blueprints
   */
  async getBlueprints() {
    try {
      const response = await this.client.get("/catalog/blueprints.json");
      // La réponse peut être un tableau ou un objet avec data
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des blueprints:",
        error.message
      );
      return [];
    }
  }

  /**
   * Récupérer les fournisseurs d'impression pour un blueprint
   * @param {number} blueprintId - ID du blueprint
   * @returns {Promise<Object>} - Liste des fournisseurs
   */
  async getPrintProviders(blueprintId) {
    try {
      const response = await this.client.get(
        `/catalog/blueprints/${blueprintId}/print_providers.json`
      );
      // La réponse peut être un tableau ou un objet avec data
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des print providers:",
        error.message
      );
      return [];
    }
  }

  /**
   * Vérifier la santé du service
   */
  async healthCheck() {
    try {
      const response = await this.client.get("/shops.json");
      return {
        success: true,
        message: "Printify service is healthy",
        shops: response.data,
      };
    } catch (error) {
      console.error(
        "Printify health check failed:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: "Printify service is not healthy",
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getShops() {
    try {
      const response = await this.client.get("/shops.json");
      // La réponse peut être un tableau ou un objet avec data
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des shops:",
        error.message
      );
      return [];
    }
  }
}

module.exports = PrintifyService;
