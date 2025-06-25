const { verifyToken } = require("@clerk/backend");

/**
 * Middleware d'authentification Clerk
 */
const authenticateClerk = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Vérifier le token avec Clerk
    const payload = await verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY,
      issuer: process.env.CLERK_ISSUER_URL,
    });

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: payload.sub,
      email: payload.email,
      firstName: payload.first_name,
      lastName: payload.last_name,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { authenticateClerk };
