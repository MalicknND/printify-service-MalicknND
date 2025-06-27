require("dotenv").config();
const axios = require("axios");

const PRINTIFY_SERVICE_URL = "http://localhost:3004";

async function testGetBlueprints() {
  try {
    console.log("🔍 Récupération des blueprints disponibles...\n");

    const response = await axios.get(
      `${PRINTIFY_SERVICE_URL}/api/printify/blueprints`
    );

    console.log("✅ Blueprints récupérés !");
    console.log("📋 Réponse:", JSON.stringify(response.data, null, 2));

    // Afficher quelques blueprints populaires
    if (response.data.data && response.data.data.length > 0) {
      console.log("\n🎯 Blueprints populaires :");
      const popularBlueprints = response.data.data.slice(0, 5);
      popularBlueprints.forEach((blueprint, index) => {
        console.log(
          `   ${index + 1}. ${blueprint.title} (ID: ${blueprint.id})`
        );
      });
    }

    return response.data.data;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des blueprints :");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }
}

async function testGetPrintProviders(blueprintId) {
  try {
    console.log(
      `🔍 Récupération des fournisseurs pour blueprint ${blueprintId}...\n`
    );

    const response = await axios.get(
      `${PRINTIFY_SERVICE_URL}/api/printify/blueprints/${blueprintId}/print-providers`
    );

    console.log("✅ Fournisseurs récupérés !");
    console.log("📋 Réponse:", JSON.stringify(response.data, null, 2));

    // Afficher les fournisseurs
    if (response.data.data && response.data.data.length > 0) {
      console.log("\n🏭 Fournisseurs disponibles :");
      response.data.data.forEach((provider, index) => {
        console.log(`   ${index + 1}. ${provider.title} (ID: ${provider.id})`);
      });
    }

    return response.data.data;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des fournisseurs :");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }
}

async function testCreateProduct() {
  try {
    console.log("🛍️  Test de création de produit...\n");

    // ID de l'image uploadée précédemment
    const imageId = "685c081149bd699251cc4740";

    const productData = {
      title: "T-shirt Personnalisé IA",
      description:
        "T-shirt avec une image générée par IA - Design unique et créatif",
      imageId: imageId,
      price: 25.99, // Prix en euros
      blueprint_id: 5, // Unisex Cotton Crew Tee
      print_provider_id: 3, // Marco Fine Arts
    };

    console.log(`📦 Création du produit: ${productData.title}`);
    console.log(`💰 Prix: ${productData.price}€`);
    console.log(`🖼️  Image ID: ${productData.imageId}`);

    const response = await axios.post(
      `${PRINTIFY_SERVICE_URL}/api/printify/create-product`,
      productData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Produit créé avec succès !");
    console.log("📋 Réponse:", JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error("❌ Erreur lors de la création du produit :");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }
}

async function runTests() {
  console.log("🚀 Test de création de produit Printify\n");
  console.log("=".repeat(60));

  // Test 1: Récupérer les blueprints
  const blueprints = await testGetBlueprints();

  console.log("\n" + "=".repeat(60));

  // Test 2: Récupérer les fournisseurs pour le premier blueprint
  if (blueprints && blueprints.length > 0) {
    await testGetPrintProviders(blueprints[0].id);
  }

  console.log("\n" + "=".repeat(60));

  // Test 3: Créer un produit
  const product = await testCreateProduct();

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Tests terminés !");

  if (product && product.success) {
    // Extraire l'ID du produit de la réponse
    const productId =
      product.data?.id || product.data?.printifyProductId || "Non disponible";
    const shopId =
      product.data?.shop_id || product.data?.shopId || "Non disponible";

    console.log(`🎉 Produit créé avec l'ID: ${productId}`);
    console.log(`🏪 Shop ID: ${shopId}`);

    // Afficher plus d'informations si disponibles
    if (product.data?.title) {
      console.log(`📦 Titre: ${product.data.title}`);
    }
    if (product.data?.description) {
      console.log(`📝 Description: ${product.data.description}`);
    }
  } else {
    console.log("❌ Échec de la création du produit");
  }
}

// Lancer les tests si le script est exécuté directement
if (require.main === module) {
  runTests();
}

module.exports = {
  testGetBlueprints,
  testGetPrintProviders,
  testCreateProduct,
};
