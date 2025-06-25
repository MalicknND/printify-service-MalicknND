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
   * Vérifier la santé du service
   */
  async healthCheck() {
    try {
      const response = await this.client.get("/shops.json");
      return {
        success: true,
        message: "Printify service is healthy",
        shops: response.data.data,
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
}

module.exports = PrintifyService;
