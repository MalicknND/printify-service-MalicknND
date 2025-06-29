const { printifyAPI } = require("../config/printify");

/**
 * Upload une image depuis Supabase vers Printify
 * POST /upload
 */
const uploadImage = async (req, res) => {
  try {
    const { imageUrl, fileName } = req.body;
    const userId = req.user?.id;

    console.log(`📤 [UPLOAD] Upload image pour utilisateur: ${userId}`);
    console.log(`🖼️ [UPLOAD] URL source: ${imageUrl}`);

    // Validation
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "imageUrl est requis",
        code: "MISSING_IMAGE_URL",
      });
    }

    // Valider que l'URL est bien formée
    try {
      new URL(imageUrl);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "URL de l'image invalide",
        code: "INVALID_IMAGE_URL",
      });
    }

    // Générer un nom de fichier si non fourni
    const finalFileName = fileName || `ai-image-${userId}-${Date.now()}.png`;

    console.log(`📋 [UPLOAD] Nom de fichier: ${finalFileName}`);

    // Upload vers Printify
    const uploadData = {
      file_name: finalFileName,
      url: imageUrl,
    };

    const response = await printifyAPI.post("/uploads/images.json", uploadData);

    console.log(`✅ [UPLOAD] Image uploadée avec succès: ${response.data.id}`);

    // Structurer la réponse
    const uploadResult = {
      success: true,
      data: {
        imageId: response.data.id,
        fileName: response.data.file_name,
        width: response.data.width,
        height: response.data.height,
        size: response.data.size,
        mimeType: response.data.mime_type,
        previewUrl: response.data.preview_url,
        uploadTime: response.data.upload_time,
        originalUrl: imageUrl,
      },
      message: "Image uploadée avec succès sur Printify",
    };

    res.status(201).json(uploadResult);
  } catch (error) {
    console.error("❌ [UPLOAD] Erreur lors de l'upload:", error.message);

    // Gestion des erreurs spécifiques Printify
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      return res.status(400).json({
        success: false,
        error: "Erreur lors de l'upload de l'image",
        code: "PRINTIFY_UPLOAD_ERROR",
        details:
          errorData.message ||
          errorData.errors ||
          "Image invalide ou inaccessible",
      });
    }

    if (error.response?.status === 413) {
      return res.status(413).json({
        success: false,
        error: "Image trop volumineuse",
        code: "IMAGE_TOO_LARGE",
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur interne lors de l'upload",
      code: "INTERNAL_UPLOAD_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Lister les images uploadées
 * GET /uploads
 */
const getUploadedImages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?.id;

    console.log(`📋 [UPLOADS] Liste des images pour: ${userId}`);

    const response = await printifyAPI.get("/uploads.json", {
      params: {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
      },
    });

    console.log(`✅ [UPLOADS] ${response.data.data.length} images récupérées`);

    const result = {
      success: true,
      data: response.data.data.map((image) => ({
        imageId: image.id,
        fileName: image.file_name,
        width: image.width,
        height: image.height,
        size: image.size,
        mimeType: image.mime_type,
        previewUrl: image.preview_url,
        uploadTime: image.upload_time,
      })),
      pagination: {
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalItems: response.data.total,
        perPage: response.data.per_page,
      },
    };

    res.json(result);
  } catch (error) {
    console.error(
      "❌ [UPLOADS] Erreur lors de la récupération:",
      error.message
    );

    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des images",
      code: "FETCH_UPLOADS_ERROR",
    });
  }
};

module.exports = {
  uploadImage,
  getUploadedImages,
};
