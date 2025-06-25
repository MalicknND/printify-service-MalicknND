# 🖨️ Printify Service - Guide de Démarrage Rapide

## 📋 Prérequis

- Node.js 18+
- Token API Printify
- Configuration Clerk pour l'authentification

## 🚀 Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer l'environnement**
```bash
cp env.example .env
```

3. **Remplir les variables d'environnement dans `.env`**
```env
# Printify API Configuration
PRINTIFY_API_TOKEN=your_printify_api_token_here
PRINTIFY_API_URL=https://api.printify.com/v1

# Server Configuration
PORT=3004
NODE_ENV=development

# Clerk Authentication
CLERK_JWT_KEY=your_clerk_jwt_key_here
CLERK_ISSUER_URL=https://your-clerk-instance.clerk.accounts.dev
```

## 🏃‍♂️ Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le service sera accessible sur `http://localhost:3004`

## 📡 API Endpoints

### Health Check
```bash
GET /api/printify/health
```

### Upload d'Image
```bash
POST /api/printify/upload-image
Content-Type: application/json
Authorization: Bearer <clerk_token>

{
  "imageUrl": "https://your-supabase-url.com/image.png"
}
```

**Réponse réussie :**
```json
{
  "success": true,
  "message": "Image uploaded successfully to Printify",
  "data": {
    "printifyImageId": "printify_image_id_here",
    "userId": "user_id_from_clerk",
    "originalImageUrl": "https://your-supabase-url.com/image.png",
    "uploadedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🧪 Tests

### Test de santé
```bash
node test-upload.js
```

### Test manuel avec curl
```bash
# Health check
curl http://localhost:3004/api/printify/health

# Upload d'image (remplacez le token et l'URL)
curl -X POST http://localhost:3004/api/printify/upload-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_clerk_token" \
  -d '{"imageUrl": "https://example.com/image.png"}'
```

## 🔧 Configuration Printify

1. Créez un compte sur [Printify](https://printify.com)
2. Générez un token API dans les paramètres de votre compte
3. Ajoutez le token dans votre fichier `.env`

## 🔐 Configuration Clerk

1. Créez un projet sur [Clerk](https://clerk.com)
2. Récupérez votre JWT Key et Issuer URL
3. Ajoutez-les dans votre fichier `.env`

## 📝 Logs

Les logs sont affichés dans la console et incluent :
- Démarrage du service
- Uploads d'images
- Erreurs d'authentification
- Erreurs d'API Printify

## 🚨 Dépannage

### Erreur "PRINTIFY_API_TOKEN is required"
- Vérifiez que votre fichier `.env` contient `PRINTIFY_API_TOKEN`

### Erreur "Invalid or expired token"
- Vérifiez votre configuration Clerk
- Assurez-vous que le token est valide

### Erreur "Failed to upload image to Printify"
- Vérifiez votre token Printify
- Assurez-vous que l'URL de l'image est accessible publiquement 