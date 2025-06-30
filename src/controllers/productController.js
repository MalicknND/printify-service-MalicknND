const { printifyAPI, printifyConfig } = require("../config/printify");
const axios = require("axios");

// Configuration du service BDD
const BDD_SERVICE_URL = process.env.BDD_SERVICE_URL || "http://localhost:9002";

/**
 * Enregistrer un produit dans la base de données
 */
const saveProductToDatabase = async (productData, userId) => {
  try {
    console.log(
      `💾 [BDD] Enregistrement du produit ${productData.id} pour l'utilisateur ${userId}`
    );

    const dbProductData = {
      userId: userId,
      printifyId: productData.id,
      title: productData.title,
      description: productData.description,
      blueprintId: productData.blueprintId,
      printProviderId: productData.printProviderId,
      marginApplied: Math.round(productData.marginApplied),
      originalImageUrl: productData.originalImageUrl,
      printifyImageId: productData.printifyImageId,
      variants: productData.variants,
      images: productData.images,
    };

    const response = await axios.post(
      `${BDD_SERVICE_URL}/api/products`,
      dbProductData,
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ [BDD] Produit enregistré avec succès en base de données`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ [BDD] Erreur lors de l'enregistrement en base:`,
      error.message
    );
    // On ne fait pas échouer la création du produit Printify si l'enregistrement en base échoue
    return null;
  }
};

/**
 * Créer un produit Printify
 * POST /product/create
 */
const createProduct = async (req, res) => {
  try {
    const userId = req.user?.id;

    const {
      title,
      description,
      imageUrl, // URL de l'image depuis Supabase
      blueprintId, // Type de produit (T-shirt, mug, etc.)
      printProviderId, // Fournisseur
      variantIds, // Tailles/couleurs sélectionnées
      margin = printifyConfig.defaultMargin,
    } = req.body;

    console.log(
      `🎨 [PRODUCT] Création produit "${title}" par utilisateur ${userId}`
    );

    // 1. Validation des données
    if (
      !title ||
      !description ||
      !imageUrl ||
      !blueprintId ||
      !printProviderId ||
      !variantIds?.length
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Champs requis: title, description, imageUrl, blueprintId, printProviderId, variantIds",
        code: "MISSING_FIELDS",
      });
    }

    // 2. Upload de l'image vers Printify
    console.log("📤 [PRODUCT] Upload image vers Printify...");
    const uploadData = {
      file_name: `ai-image-${userId}-${Date.now()}.png`,
      url: imageUrl,
    };

    const imageResponse = await printifyAPI.post(
      "/uploads/images.json",
      uploadData
    );
    const imageId = imageResponse.data.id;

    console.log(`✅ [PRODUCT] Image uploadée: ${imageId}`);

    // 3. Récupérer les variants avec leurs coûts
    console.log("📦 [PRODUCT] Récupération des variants...");
    const variantsResponse = await printifyAPI.get(
      `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
    );

    const allVariants = variantsResponse.data.variants;
    const selectedVariants = allVariants.filter((v) =>
      variantIds.includes(v.id)
    );

    if (selectedVariants.length !== variantIds.length) {
      return res.status(400).json({
        success: false,
        error: "Certains variantIds sont invalides",
        code: "INVALID_VARIANTS",
      });
    }

    // Calcul du prix avec marge
    const variantsWithPrices = selectedVariants.map((variant) => {
      const cost = variant.cost || 800;
      const price = Math.ceil(cost * (1 + margin / 100));

      console.log(
        `💰 [PRODUCT] Variant ${variant.id}: coût ${cost}¢ → prix ${price}¢ (marge ${margin}%)`
      );

      return {
        id: variant.id,
        price,
        is_enabled: true,
        is_default: selectedVariants[0].id === variant.id,
        sku: `AI-${userId}-${variant.id}-${Date.now()}`,
      };
    });

    // 5. Préparer les print_areas
    const printAreas = [
      {
        variant_ids: variantIds,
        placeholders: [
          {
            position: "front", // Position par défaut
            images: [
              {
                id: imageId,
                x: 0.5, // Centré horizontalement
                y: 0.5, // Centré verticalement
                scale: 1, // Taille normale
                angle: 0, // Pas de rotation
              },
            ],
          },
        ],
      },
    ];

    // 6. Créer le produit
    const productData = {
      title,
      description,
      blueprint_id: blueprintId,
      print_provider_id: printProviderId,
      variants: variantsWithPrices,
      print_areas: printAreas,
      visible: true,
      tags: ["IA", "Personnalisé"],
    };

    console.log("🚀 [PRODUCT] Création du produit dans Printify...");
    const productResponse = await printifyAPI.post(
      `/shops/${printifyConfig.shopId}/products.json`,
      productData
    );

    console.log(
      `✅ [PRODUCT] Produit créé avec succès: ${productResponse.data.id}`
    );

    // 7. Structurer la réponse
    const createdProduct = {
      id: productResponse.data.id,
      title: productResponse.data.title,
      description: productResponse.data.description,
      blueprintId: productResponse.data.blueprint_id,
      printProviderId: productResponse.data.print_provider_id,
      variants: productResponse.data.variants
        .filter((v) => variantIds.includes(v.id))
        .map((v) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          price: v.price,
          priceFormatted: `${(v.price / 100).toFixed(2)} €`,
          cost: selectedVariants.find((sv) => sv.id === v.id)?.cost || 0,
          profit:
            v.price -
            (selectedVariants.find((sv) => sv.id === v.id)?.cost || 0),
          isEnabled: v.is_enabled,
          isDefault: v.is_default,
          options: v.options,
        })),

      images: productResponse.data.images || [],
      createdAt: productResponse.data.created_at,
      marginApplied: margin,
      originalImageUrl: imageUrl,
      printifyImageId: imageId,
    };

    // 8. Enregistrer en base de données (si userId disponible)
    let dbResult = null;
    if (userId) {
      dbResult = await saveProductToDatabase(createdProduct, userId);
      if (dbResult) {
        console.log(`✅ [PRODUCT] Produit enregistré en base de données`);
      } else {
        console.log(
          `⚠️ [PRODUCT] Échec de l'enregistrement en base de données`
        );
      }
    } else {
      console.log(`⚠️ [PRODUCT] Pas d'userId, produit non enregistré en base`);
    }

    res.status(201).json({
      success: true,
      data: createdProduct,
      message: "Produit créé avec succès dans Printify",
      savedToDatabase: !!dbResult,
    });
  } catch (error) {
    console.error("❌ [PRODUCT] Erreur lors de la création:", error.message);

    // Gestion des erreurs spécifiques
    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        error: "Données invalides pour Printify",
        code: "PRINTIFY_VALIDATION_ERROR",
        details: error.response.data,
      });
    }

    if (error.response?.status === 422) {
      return res.status(422).json({
        success: false,
        error: "Erreur de validation Printify",
        code: "PRINTIFY_UNPROCESSABLE",
        details: error.response.data,
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur interne lors de la création du produit",
      code: "INTERNAL_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Récupérer les blueprints (types de produits)
 * GET /blueprints
 */
const getBlueprints = async (req, res) => {
  try {
    console.log("📦 [CATALOG] Récupération des blueprints...");

    const response = await printifyAPI.get("/catalog/blueprints.json");

    const blueprints = response.data.map((blueprint) => ({
      id: blueprint.id,
      title: blueprint.title,
      brand: blueprint.brand,
      model: blueprint.model,
      description: `${blueprint.brand} ${blueprint.model} - ${blueprint.title}`,
      images: blueprint.images,
    }));

    console.log(`✅ [CATALOG] ${blueprints.length} blueprints récupérés`);

    res.json({
      success: true,
      data: blueprints,
      message: "Types de produits récupérés",
    });
  } catch (error) {
    console.error("❌ [CATALOG] Erreur blueprints:", error.message);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des types de produits",
    });
  }
};

/**
 * Récupérer les fournisseurs pour un blueprint
 * GET /blueprints/:blueprintId/providers
 */
const getProviders = async (req, res) => {
  try {
    const { blueprintId } = req.params;

    console.log(
      `🏭 [CATALOG] Récupération des providers pour blueprint ${blueprintId}...`
    );

    const response = await printifyAPI.get(
      `/catalog/blueprints/${blueprintId}/print_providers.json`
    );

    const providers = response.data.map((provider) => ({
      id: provider.id,
      title: provider.title,
      location: provider.location,
      country: provider.location?.country,
      description: `${provider.title} (${provider.location?.country || "N/A"})`,
    }));

    console.log(`✅ [CATALOG] ${providers.length} providers récupérés`);

    res.json({
      success: true,
      data: providers,
      message: "Fournisseurs récupérés",
    });
  } catch (error) {
    console.error("❌ [CATALOG] Erreur providers:", error.message);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des fournisseurs",
    });
  }
};

/**
 * Récupérer les variants (tailles/couleurs) pour un blueprint + provider
 * GET /blueprints/:blueprintId/providers/:providerId/variants
 */
const getVariants = async (req, res) => {
  try {
    const { blueprintId, providerId } = req.params;

    console.log(
      `🎨 [CATALOG] Récupération des variants pour blueprint ${blueprintId} provider ${providerId}...`
    );

    const response = await printifyAPI.get(
      `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`
    );

    const variants = response.data.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      options: variant.options,
      cost: variant.cost,
      costFormatted: variant.cost
        ? `${(variant.cost / 100).toFixed(2)} €`
        : "N/A",
      color: variant.options?.color || "N/A",
      size: variant.options?.size || "N/A",
      isAvailable: variant.is_available !== false,
      displayName:
        `${variant.options?.color || ""} ${
          variant.options?.size || ""
        }`.trim() || variant.title,
    }));

    console.log(`✅ [CATALOG] ${variants.length} variants récupérés`);

    res.json({
      success: true,
      data: variants,
      message: "Variants récupérés",
    });
  } catch (error) {
    console.error("❌ [CATALOG] Erreur variants:", error.message);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des variants",
    });
  }
};

module.exports = {
  createProduct,
  getBlueprints,
  getProviders,
  getVariants,
};
