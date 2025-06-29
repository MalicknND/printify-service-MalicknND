const { jwtVerify, createRemoteJWKSet } = require("jose");

const CLERK_JWKS_URL = process.env.CLERK_JWKS_URL;
const CLERK_ISSUER = process.env.CLERK_ISSUER;

// Créer le JWKS pour vérifier les tokens
const JWKS = CLERK_JWKS_URL
  ? createRemoteJWKSet(new URL(CLERK_JWKS_URL))
  : null;

/**
 * Middleware d'authentification Clerk
 */
const authenticateClerk = async (req, res, next) => {
  try {
    // Mode développement sans Clerk
    if (!JWKS || !CLERK_ISSUER) {
      console.log("🔓 [AUTH] Mode développement - Auth désactivée");
      req.user = {
        id: "dev-user-123",
        email: "dev@malicknnd.com",
        firstName: "Dev",
        lastName: "User",
      };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token d'authentification requis",
        code: "MISSING_TOKEN",
      });
    }

    const token = authHeader.substring(7);

    console.log("🔐 [AUTH] Vérification du token Clerk...");

    // Vérifier le JWT
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: CLERK_ISSUER,
    });

    console.log("✅ [AUTH] Token valide pour:", payload.sub);

    // Extraire les infos utilisateur
    req.user = {
      id: payload.sub,
      email: payload.email || payload.email_addresses?.[0]?.email_address,
      firstName: payload.given_name || payload.first_name,
      lastName: payload.family_name || payload.last_name,
    };

    next();
  } catch (error) {
    console.error("❌ [AUTH] Erreur d'authentification:", error.message);

    return res.status(401).json({
      success: false,
      error: "Token invalide",
      code: "INVALID_TOKEN",
    });
  }
};

module.exports = {
  authenticateClerk,
};
