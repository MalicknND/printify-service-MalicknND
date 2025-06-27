const { verifyClerkToken } = require("../utils/verifyClerkToken");

const authenticateClerk = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid",
      });
    }
    const token = authHeader.substring(7);

    // Vérification du token Clerk via JWKS
    const payload = await verifyClerkToken(token);

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
