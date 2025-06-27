require("dotenv").config();
const express = require("express");
const printifyRoutes = require("./routes/printifyRoutes");

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware pour parser le JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Middleware CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.use("/api/printify", printifyRoutes);

// Route racine
app.get("/", (req, res) => {
  res.json({
    message: "Printify Service API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/printify/health",
      uploadImage: "POST /api/printify/upload-image",
      createProduct: "POST /api/printify/create-product",
      getBlueprints: "GET /api/printify/blueprints",
      getPrintProviders:
        "GET /api/printify/blueprints/:blueprintId/print-providers",
    },
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Route 404 - Express 4.x
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Printify Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/printify/health`);
  console.log(
    `🖼️  Upload endpoint: http://localhost:${PORT}/api/printify/upload-image`
  );
  console.log(
    `🛍️  Create product: http://localhost:${PORT}/api/printify/create-product`
  );
  console.log(
    `📋 Blueprints: http://localhost:${PORT}/api/printify/blueprints`
  );
});
