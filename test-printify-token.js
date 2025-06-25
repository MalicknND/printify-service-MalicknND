require("dotenv").config();
const axios = require("axios");

const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_API_URL =
  process.env.PRINTIFY_API_URL || "https://api.printify.com/v1";

async function testPrintifyToken() {
  try {
    console.log("🔑 Test du token Printify...\n");
    console.log(
      `Token: ${
        PRINTIFY_API_TOKEN
          ? PRINTIFY_API_TOKEN.substring(0, 50) + "..."
          : "Non défini"
      }\n`
    );

    // Test simple - récupérer les shops
    const response = await axios.get(`${PRINTIFY_API_URL}/shops.json`, {
      headers: {
        Authorization: `Bearer ${PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Token valide !");
    console.log(
      "📋 Shops disponibles:",
      JSON.stringify(response.data, null, 2)
    );
  } catch (error) {
    console.error("❌ Token invalide ou erreur :");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.error("\n🔧 Solutions :");
        console.error("1. Vérifiez que votre token Printify est correct");
        console.error("2. Le token peut avoir expiré - générez-en un nouveau");
        console.error(
          "3. Allez sur printify.com → Settings → API → Generate new token"
        );
      }
    } else {
      console.error("Error:", error.message);
    }
  }
}

async function testUploadDirectly() {
  try {
    console.log("\n🖼️  Test d'upload direct vers Printify...\n");

    const testImageUrl =
      "https://abccglloojrvzstkkevv.supabase.co/storage/v1/object/public/images/user_2ta6NRH0kZxG51Gcn6gCaVzJQPe/1750357207001_generated_1750357207001.png";

    const response = await axios.post(
      `${PRINTIFY_API_URL}/uploads/images.json`,
      {
        file_name: `test_image_${Date.now()}.png`,
        url: testImageUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${PRINTIFY_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Upload direct réussi !");
    console.log("📋 Réponse:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Upload direct échoué :");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

async function runTests() {
  console.log("🚀 Test de validation du token Printify\n");
  console.log("=".repeat(60));

  await testPrintifyToken();

  console.log("\n" + "=".repeat(60));

  await testUploadDirectly();

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Tests terminés !");
}

if (require.main === module) {
  runTests();
}
