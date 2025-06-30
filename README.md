# 🎨 Printify Service MalicknND

Microservice Node.js/Express pour gérer l'impression d'images générées par IA via l'API Printify avec **enregistrement automatique en base de données**.

## 🚀 Fonctionnalités

### 🎯 Cycle complet d'impression IA
- **Upload d'images IA** depuis Supabase vers Printify
- **Création de produits personnalisés** (T-shirts, mugs, etc.)
- **Enregistrement automatique** en base de données par utilisateur
- **Calcul automatique des prix** avec marge configurable
- **Gestion des commandes** avec livraison automatique
- **Prévisualisation** avant création réelle

### 🔐 Sécurité & Auth
- Authentification **Clerk JWT** sécurisée
- Rate limiting intelligent
- Validation des données robuste
- CORS configuré pour production

### 💰 Gestion des prix
- Application automatique de marges (50% par défaut)
- Conversion EUR/USD
- Calcul des profits en temps réel
- Simulation de prix avant création

### 💾 Intégration Base de Données (NOUVEAU)
- **Enregistrement automatique** de chaque produit créé
- **Liaison par utilisateur** via Clerk ID
- **Relations complètes** (variants, images, métadonnées)
- **Résilience** : Le service fonctionne même si la BDD est indisponible

## 📦 Installation

```bash
# Cloner le repository
git clone https://github.com/your-username/printify-service-malicknnd.git
cd printify-service-malicknnd

# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp env.example .env
# Éditer .env avec vos clés API
```

## ⚙️ Configuration

### Variables d'environnement requises

```bash
# Printify (OBLIGATOIRE)
PRINTIFY_API_KEY=your_printify_api_key
PRINTIFY_SHOP_ID=your_shop_id

# Clerk (optionnel en dev)
CLERK_JWKS_URL=https://your-domain.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=https://your-domain.clerk.accounts.dev

# Service BDD (NOUVEAU)
BDD_SERVICE_URL=http://localhost:9002

# Configuration
PORT=3004
NODE_ENV=development
DEFAULT_MARGIN_PERCENT=50
```

### Obtenir vos clés Printify

1. Créez un compte sur [Printify](https://printify.com)
2. Allez dans **My Profile → Connections**
3. Générez un **Personal Access Token**
4. Trouvez votre **Shop ID** dans l'URL de votre boutique

## 🏃‍♂️ Démarrage

### Prérequis
```bash
# 1. Démarrer le service BDD
cd bdd-services-MalicknND
npx prisma migrate dev --name add_product_tables
npm run dev

# 2. Démarrer le service Printify
cd printify-service-MalicknND
npm run dev
```

### Services disponibles
- **Service BDD** : http://localhost:9002
- **Service Printify** : http://localhost:3004

## 📚 Documentation API

### 🌐 Endpoints publics

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/printify/health` | État du service |
| `GET` | `/api/printify/blueprints` | Liste des modèles de produits |
| `GET` | `/api/printify/blueprints/:id` | Détails d'un modèle |
| `GET` | `/api/printify/variants` | Variants (couleurs/tailles) |

### 🔒 Endpoints protégés (Auth Clerk requis)

#### Upload d'images
```bash
POST /api/printify/upload
Authorization: Bearer YOUR_CLERK_JWT

{
  "imageUrl": "https://your-supabase.com/storage/v1/object/public/images/ai-image.png",
  "fileName": "mon-design-ia.png"
}
```

#### Création de produit (avec enregistrement automatique en BDD)
```bash
POST /api/printify/product/create
Authorization: Bearer YOUR_CLERK_JWT

{
  "title": "T-shirt Design IA",
  "description": "T-shirt avec design généré par IA",
  "blueprintId": 5,
  "printProviderId": 1,
  "variants": [
    {
      "id": 17887,
      "price": 2000,
      "is_enabled": true,
      "is_default": true
    }
  ],
  "printAreas": [
    {
      "variant_ids": [17887],
      "placeholders": [
        {
          "position": "front",
          "images": [
            {
              "id": "YOUR_UPLOADED_IMAGE_ID",
              "x": 0.5,
              "y": 0.5,
              "scale": 1,
              "angle": 0
            }
          ]
        }
      ]
    }
  ],
  "margin": 50
}
```

**Réponse avec statut BDD :**
```json
{
  "success": true,
  "data": {
    "id": "6862a2e379a2a4e66f05b610",
    "title": "T-shirt Design IA",
    "variants": [...],
    "images": [...]
  },
  "message": "Produit créé avec succès dans Printify",
  "savedToDatabase": true
}
```

#### Création de commande
```bash
POST /api/printify/order/create
Authorization: Bearer YOUR_CLERK_JWT

{
  "externalId": "order-123",
  "lineItems": [
    {
      "product_id": "YOUR_PRODUCT_ID",
      "variant_id": 17887,
      "quantity": 1
    }
  ],
  "shippingMethod": 1,
  "addressTo": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "country": "US",
    "address1": "123 Main St",
    "city": "New York",
    "zip": "10001"
  }
}
```

## 🔗 Intégration avec le Service BDD

### Workflow automatique
1. **Création produit** → Service Printify
2. **Enregistrement automatique** → Service BDD
3. **Récupération par utilisateur** → Service BDD

### Logs d'intégration
```
📤 [PRODUCT] Création produit pour utilisateur: user_123
✅ [PRODUCT] Produit créé avec succès: 6862a2e379a2a4e66f05b610
💾 [BDD] Enregistrement du produit 6862a2e379a2a4e66f05b610 pour l'utilisateur user_123
✅ [BDD] Produit enregistré avec succès en base de données
✅ [PRODUCT] Produit enregistré en base de données
```

### Récupération des produits par utilisateur
```bash
# Via le service BDD
GET http://localhost:9002/api/products?userId=user_123&page=1&limit=10
```

## 🛠 Flux d'utilisation typique

### 1. Upload d'une image IA
```javascript
const uploadResponse = await fetch('/api/printify/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clerkToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageUrl: 'https://your-supabase-bucket.com/ai-image.png',
    fileName: 'design-unique.png'
  })
});

const { data: uploadedImage } = await uploadResponse.json();
console.log('Image ID:', uploadedImage.id);
```

### 2. Création de produit (avec enregistrement automatique)
```javascript
const productResponse = await fetch('/api/printify/product/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clerkToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Mon T-shirt IA',
    description: 'Design unique généré par IA',
    blueprintId: 5,
    printProviderId: 1,
    variants: [{
      id: 17887,
      price: 2500,
      is_enabled: true,
      is_default: true
    }],
    printAreas: [{
      variant_ids: [17887],
      placeholders: [{
        position: 'front',
        images: [{
          id: uploadedImage.id,
          x: 0.5,
          y: 0.5,
          scale: 1,
          angle: 0
        }]
      }]
    }],
    margin: 50
  })
});

const result = await productResponse.json();
console.log('✅ Produit créé:', result.data.id);
console.log('💾 Enregistré en base:', result.savedToDatabase);
```

### 3. Récupération des produits de l'utilisateur
```javascript
// Récupérer depuis le service BDD
const productsResponse = await fetch(
  `http://localhost:9002/api/products?userId=${userId}&page=1&limit=10`
);
const { data: { products } } = await productsResponse.json();

console.log('Produits de l\'utilisateur:', products);
```

## 🔧 Calculs de prix

### Marge automatique
Le service applique automatiquement une marge configurable :

```javascript
// Coût Printify: 8.00€
// Marge: 50%
// Prix de vente: 12.00€
// Profit: 4.00€

GET /api/printify/price/with-margin?variantId=17887&margin=50&currency=EUR
```

### Simulation de produit complet
```javascript
POST /api/printify/price/simulate
{
  "blueprintId": 5,
  "providerId": 1,
  "variantIds": [17887, 17888],
  "quantity": 1,
  "margin": 60,
  "currency": "EUR",
  "includeShipping": true
}
```

## 🏗 Architecture

```
printify-service-malicknnd/
├── src/
│   ├── app.js                 # 🚀 Serveur Express principal
│   ├── config/
│   │   └── printify.js        # ⚙️ Configuration Printify + Axios
│   ├── middleware/
│   │   └── auth.js            # 🔐 Authentification Clerk JWT
│   ├── controllers/
│   │   ├── uploadController.js    # 📤 Upload d'images
│   │   ├── productController.js   # 👕 Gestion des produits + BDD
│   │   ├── orderController.js     # 📦 Gestion des commandes
│   │   ├── catalogController.js   # 📚 Catalogue Printify
│   │   ├── priceController.js     # 💰 Calculs de prix
│   │   └── shopController.js      # 🏪 Gestion du shop
│   └── routes/
│       └── printify.js        # 🛣️ Routes API centralisées
├── env.example                # 🔑 Variables d'environnement
├── INTEGRATION-GUIDE.md       # 📖 Guide d'intégration BDD
├── package.json
└── README.md
```

## 🧪 Tests et débogage

### Health check
```bash
curl http://localhost:3004/api/printify/health
```

### Test d'authentification
```bash
curl -H "Authorization: Bearer YOUR_CLERK_JWT" \
     http://localhost:3004/api/printify/shop/info
```

### Test d'intégration complète
```bash
# 1. Créer un produit
curl -X POST http://localhost:3004/api/printify/product/create \
  -H "Authorization: Bearer YOUR_CLERK_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product",
    "blueprintId": 5,
    "printProviderId": 1,
    "variants": [{"id": 17887, "price": 2000}],
    "printAreas": [{"variant_ids": [17887], "placeholders": []}]
  }'

# 2. Vérifier l'enregistrement en base
curl "http://localhost:9002/api/products?userId=YOUR_USER_ID"
```

### Logs de débogage
Le service affiche des logs détaillés en mode développement :
```
🔥 [UPLOAD] Nouvel upload pour utilisateur: user_123
📤 [PRINTIFY API] POST /uploads/images.json
✅ [UPLOAD] Image uploadée avec succès
🆔 [UPLOAD] ID Printify: 5f7d8e9a1b2c3d4e5f6g7h8i
💾 [BDD] Enregistrement du produit 6862a2e379a2a4e66f05b610 pour l'utilisateur user_123
✅ [BDD] Produit enregistré avec succès en base de données
```

## 🚨 Gestion des erreurs

Le service retourne des erreurs structurées :

```javascript
{
  "success": false,
  "error": "Description de l'erreur",
  "code": "ERROR_CODE",
  "details": "Détails supplémentaires (dev uniquement)"
}
```

### Codes d'erreur courants
- `MISSING_TOKEN` : Token d'authentification manquant
- `INVALID_PRODUCT_DATA` : Données de produit invalides
- `PRINTIFY_UPLOAD_ERROR` : Erreur lors de l'upload Printify
- `BDD_CONNECTION_ERROR` : Erreur de connexion au service BDD
- `RATE_LIMIT_EXCEEDED` : Limite de requêtes atteinte

### Stratégie de résilience
- ✅ **Création Printify prioritaire** : Le produit est créé même si la BDD échoue
- ✅ **Logs détaillés** : Toutes les erreurs sont tracées
- ✅ **Timeout configurable** : 10 secondes pour l'enregistrement BDD
- ✅ **Retry possible** : Architecture extensible pour les retry

## 🌍 Déploiement

### Docker (recommandé)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3004
CMD ["npm", "start"]
```

### Variables d'environnement production
```bash
NODE_ENV=production
PRINTIFY_API_KEY=your_production_key
PRINTIFY_SHOP_ID=your_production_shop
CLERK_JWKS_URL=your_production_clerk_url
BDD_SERVICE_URL=http://your-bdd-service:9002
```

## 🤝 Intégration avec votre SaaS

### Frontend React/Next.js
```javascript
// hooks/usePrintifyService.js
export const usePrintifyService = () => {
  const { getToken } = useAuth(); // Clerk
  
  const createProduct = async (productData) => {
    const token = await getToken();
    const response = await fetch('/api/printify/product/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Produit créé et enregistré en base');
    }
    
    return result;
  };
  
  return { createProduct };
};
```

### Intégration Supabase
```javascript
// Récupérer l'URL publique d'une image IA stockée dans Supabase
const { data } = supabase.storage
  .from('ai-images')
  .getPublicUrl('user-123/design.png');

// L'uploader vers Printify et créer le produit
const uploadResult = await uploadImage(data.publicUrl);
const productResult = await createProduct({
  // ... configuration produit
  printAreas: [{
    variant_ids: [17887],
    placeholders: [{
      position: 'front',
      images: [{ id: uploadResult.data.imageId }]
    }]
  }]
});
```

## 📞 Support

- **Issues GitHub** : [Créer une issue](https://github.com/your-username/printify-service-malicknnd/issues)
- **Documentation Printify** : [API Docs](https://developers.printify.com/)
- **Documentation Clerk** : [Auth Docs](https://clerk.com/docs)
- **Guide d'intégration BDD** : [INTEGRATION-GUIDE.md](INTEGRATION-GUIDE.md)

## 📄 Licence

MIT © 2024 MalicknND

---

**🎨 Transformez vos créations IA en produits physiques avec ce microservice prêt pour la production et intégré à votre base de données !**