# 🎨 Printify Service MalicknND

Microservice Node.js/Express pour gérer l'impression d'images générées par IA via l'API Printify.

## 🚀 Fonctionnalités

### 🎯 Cycle complet d'impression IA
- **Upload d'images IA** depuis Supabase vers Printify
- **Création de produits personnalisés** (T-shirts, mugs, etc.)
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

## 📦 Installation

```bash
# Cloner le repository
git clone https://github.com/your-username/printify-service-malicknnd.git
cd printify-service-malicknnd

# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp .env.example .env
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

# Configuration
PORT=3001
NODE_ENV=development
DEFAULT_MARGIN_PERCENT=50
```

### Obtenir vos clés Printify

1. Créez un compte sur [Printify](https://printify.com)
2. Allez dans **My Profile → Connections**
3. Générez un **Personal Access Token**
4. Trouvez votre **Shop ID** dans l'URL de votre boutique

## 🏃‍♂️ Démarrage

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start

# Le service sera disponible sur http://localhost:3001
```

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

#### Création de produit
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

### 2. Prévisualisation du produit
```javascript
const previewResponse = await fetch('/api/printify/product/preview', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clerkToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Mon T-shirt IA',
    blueprintId: 5,
    printProviderId: 1,
    variantIds: [17887],
    imageId: uploadedImage.id,
    margin: 60
  })
});

const { data: preview } = await previewResponse.json();
console.log('Prix calculé:', preview.pricing.averagePrice);
```

### 3. Création du produit
```javascript
const productResponse = await fetch('/api/printify/product/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clerkToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Mon T-shirt IA',
    description: 'Design unique généré par intelligence artificielle',
    blueprintId: 5,
    printProviderId: 1,
    variants: [
      { id: 17887, price: 2500, is_enabled: true, is_default: true }
    ],
    printAreas: [{
      variant_ids: [17887],
      placeholders: [{
        position: 'front',
        images: [{
          id: uploadedImage.id,
          x: 0.5, y: 0.5, scale: 1, angle: 0
        }]
      }]
    }],
    margin: 60
  })
});

const { data: product } = await productResponse.json();
```

### 4. Commande après paiement
```javascript
// Après validation du paiement Stripe par exemple
const orderResponse = await fetch('/api/printify/order/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clerkToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    externalId: `order-${Date.now()}`,
    lineItems: [{
      product_id: product.id,
      variant_id: 17887,
      quantity: 1
    }],
    shippingMethod: 1,
    addressTo: customerAddress
  })
});
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
│   │   ├── productController.js   # 👕 Gestion des produits
│   │   ├── orderController.js     # 📦 Gestion des commandes
│   │   ├── catalogController.js   # 📚 Catalogue Printify
│   │   ├── priceController.js     # 💰 Calculs de prix
│   │   └── shopController.js      # 🏪 Gestion du shop
│   └── routes/
│       └── printify.js        # 🛣️ Routes API centralisées
├── .env                       # 🔑 Variables d'environnement
├── package.json
└── README.md
```

## 🧪 Tests et débogage

### Health check
```bash
curl http://localhost:3001/api/printify/health
```

### Test d'authentification
```bash
curl -H "Authorization: Bearer YOUR_CLERK_JWT" \
     http://localhost:3001/api/printify/shop/info
```

### Logs de débogage
Le service affiche des logs détaillés en mode développement :
```
🔥 [UPLOAD] Nouvel upload pour utilisateur: user_123
📤 [PRINTIFY API] POST /uploads/images.json
✅ [UPLOAD] Image uploadée avec succès
🆔 [UPLOAD] ID Printify: 5f7d8e9a1b2c3d4e5f6g7h8i
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
- `RATE_LIMIT_EXCEEDED` : Limite de requêtes atteinte

## 🌍 Déploiement

### Docker (recommandé)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3001
CMD ["npm", "start"]
```

### Variables d'environnement production
```bash
NODE_ENV=production
PRINTIFY_API_KEY=your_production_key
PRINTIFY_SHOP_ID=your_production_shop
CLERK_JWKS_URL=your_production_clerk_url
```

## 🤝 Intégration avec votre SaaS

### Frontend React/Next.js
```javascript
// hooks/usePrintifyService.js
export const usePrintifyService = () => {
  const { getToken } = useAuth(); // Clerk
  
  const uploadImage = async (imageUrl) => {
    const token = await getToken();
    const response = await fetch('/api/printify/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl })
    });
    return response.json();
  };
  
  return { uploadImage };
};
```

### Intégration Supabase
```javascript
// Récupérer l'URL publique d'une image IA stockée dans Supabase
const { data } = supabase.storage
  .from('ai-images')
  .getPublicUrl('user-123/design.png');

// L'uploader vers Printify
await uploadImage(data.publicUrl);
```

## 📞 Support

- **Issues GitHub** : [Créer une issue](https://github.com/your-username/printify-service-malicknnd/issues)
- **Documentation Printify** : [API Docs](https://developers.printify.com/)
- **Documentation Clerk** : [Auth Docs](https://clerk.com/docs)

## 📄 Licence

MIT © 2024 MalicknND

---

**🎨 Transformez vos créations IA en produits physiques avec ce microservice prêt pour la production !**