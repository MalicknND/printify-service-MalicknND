# Service Printify

Service Node.js pour interagir avec l'API Printify. Permet de gérer les shops, uploader des images, créer des produits et passer des commandes dans le cadre d'un workflow complet d'impression à la demande.

## 🚀 Installation

1. **Cloner le projet** (si pas déjà fait)
```bash
cd printify-service-MalicknND
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp env.example .env
```

4. **Éditer le fichier `.env`**
```env
PRINTIFY_API_TOKEN=TON_TOKEN_ICI
PRINTIFY_API_URL=https://api.printify.com/v1
```

> ⚠️ **Important** : Remplacez `TON_TOKEN_ICI` par votre véritable token d'API Printify

## 🔧 Configuration

### Obtenir un token d'API Printify

1. Connectez-vous à votre compte [Printify](https://printify.com)
2. Allez dans **Settings** → **API Keys**
3. Créez une nouvelle clé API
4. Copiez le token dans votre fichier `.env`

## 🧪 Test du service

### Test complet (scénario complet)
```bash
node src/test.js
```

### Test rapide
```bash
node src/test.js --quick
```

## 📋 Scénario Complet d'Intégration

Le service implémente le workflow complet suivant :

### 1️⃣ Génération d'image par IA
- Votre service IA génère une image
- L'image est stockée dans Supabase Storage
- L'URL de l'image est disponible dans votre galerie

### 2️⃣ Création de produit Printify
- **Upload de l'image** : L'image est uploadée dans la médiathèque Printify
- **Création du produit** : Un produit est créé avec l'image personnalisée
- **Publication** : Le produit est publié sur la boutique
- **Récupération des infos** : Mockups, prix, variantes disponibles

### 3️⃣ Affichage dans la galerie
- Le produit apparaît dans votre galerie avec :
  - Mockup du produit
  - Prix
  - Bouton "Commander"

### 4️⃣ Passage de commande
- L'utilisateur choisit les variantes
- Une commande est créée avec les informations de livraison
- La commande est envoyée à Printify pour production

## 🔌 Fonctionnalités

### PrintifyService

#### Méthodes principales

##### `getShops()`
Récupère la liste de tous vos shops Printify.

##### `uploadImageByUrl(url, fileName)`
Upload une image vers Printify depuis une URL (ex: URL Supabase).

**Paramètres :**
- `url` (string) : URL de l'image (ex: URL Supabase Storage)
- `fileName` (string) : Nom du fichier

##### `createProduct(shopId, blueprintId, printProviderId, variantIds, imageId, title, description)`
Crée un produit avec une image personnalisée.

**Paramètres :**
- `shopId` (string) : ID du shop
- `blueprintId` (number) : Type de produit (ex: 9 = T-shirt)
- `printProviderId` (number) : Fournisseur d'impression
- `variantIds` (Array) : IDs des variantes (tailles, couleurs)
- `imageId` (string) : ID de l'image uploadée
- `title` (string) : Titre du produit
- `description` (string) : Description du produit

##### `publishProduct(shopId, productId)`
Publie un produit sur la boutique Printify.

##### `createOrderWithProductId(shopId, productId, variantId, customerInfo)`
Crée une commande avec un produit existant.

**Paramètres :**
- `shopId` (string) : ID du shop
- `productId` (string) : ID du produit Printify
- `variantId` (number) : ID de la variante
- `customerInfo` (Object) : Informations du client (optionnel)

#### Méthodes utilitaires

##### `getBlueprints()`
Récupère tous les types de produits disponibles.

##### `getPrintProviders(blueprintId)`
Récupère les fournisseurs d'impression pour un type de produit.

##### `getVariants(blueprintId, printProviderId)`
Récupère les variantes disponibles (tailles, couleurs).

##### `getProduct(shopId, productId)`
Récupère les informations détaillées d'un produit (mockups, prix, etc.).

## 🛠️ Utilisation dans votre code

### Exemple d'intégration complète

```javascript
const PrintifyService = require('./src/printifyService');

const printify = new PrintifyService();

async function createProductFromImage(imageUrl, fileName) {
    try {
        // 1. Récupérer le shop
        const shops = await printify.getShops();
        const shopId = shops[0].id;
        
        // 2. Uploader l'image
        const image = await printify.uploadImageByUrl(imageUrl, fileName);
        
        // 3. Récupérer les informations de produit
        const blueprints = await printify.getBlueprints();
        const tshirtBlueprint = blueprints.find(bp => bp.id === 9); // T-shirt
        
        const providers = await printify.getPrintProviders(tshirtBlueprint.id);
        const provider = providers[0];
        
        const variants = await printify.getVariants(tshirtBlueprint.id, provider.id);
        const variantIds = variants.variants.slice(0, 3).map(v => v.id);
        
        // 4. Créer le produit
        const product = await printify.createProduct(
            shopId,
            tshirtBlueprint.id,
            provider.id,
            variantIds,
            image.id,
            "Mon Design IA",
            "Design unique généré par IA"
        );
        
        // 5. Publier le produit
        await printify.publishProduct(shopId, product.id);
        
        // 6. Récupérer les informations finales
        const productInfo = await printify.getProduct(shopId, product.id);
        
        return {
            productId: product.id,
            mockupUrl: productInfo.images?.[0]?.src,
            price: productInfo.variants?.[0]?.price,
            variants: productInfo.variants
        };
        
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
}

// Utilisation
createProductFromImage(
    'https://votre-supabase-storage.com/image.png',
    'design-ia.png'
).then(result => {
    console.log('Produit créé:', result);
});
```

### Exemple de création de commande

```javascript
async function createOrder(productId, variantId, customerInfo) {
    const shops = await printify.getShops();
    const shopId = shops[0].id;
    
    const order = await printify.createOrderWithProductId(
        shopId,
        productId,
        variantId,
        customerInfo
    );
    
    return order;
}

// Utilisation
const customerInfo = {
    first_name: "Marie",
    last_name: "Martin",
    email: "marie@example.com",
    phone: "0123456789",
    country: "FR",
    city: "Lyon",
    zip: "69001",
    address1: "456 Rue de la République"
};

createOrder("product_123", 12345, customerInfo)
    .then(order => console.log('Commande créée:', order.id));
```

## 📁 Structure du projet

```
printify-service-MalicknND/
├── logs/                    # Logs du service
├── src/
│   ├── printifyService.js   # Service principal avec toutes les fonctions
│   └── test.js             # Script de test complet
├── .env                     # Variables d'environnement
├── .gitignore              # Fichiers ignorés par Git
├── package.json            # Dépendances et scripts
└── README.md               # Documentation
```

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- Compte Printify avec token d'API
- Au moins un shop créé dans votre compte Printify
- Images stockées dans un service de stockage (Supabase, AWS S3, etc.)

## 🔍 Dépannage

### Erreur "401 Unauthorized"
- Vérifiez que votre token d'API est correct dans le fichier `.env`
- Assurez-vous que le token n'a pas expiré

### Erreur "No shops found"
- Créez un shop dans votre compte Printify
- Vérifiez que votre token a les bonnes permissions

### Erreur lors de l'upload d'image
- Vérifiez que l'URL de l'image est accessible publiquement
- Assurez-vous que l'image est au format supporté (PNG, JPG, etc.)
- Vérifiez que l'URL n'est pas protégée par authentification

### Erreur lors de la création de produit
- Vérifiez que les IDs de blueprint, fournisseur et variantes sont valides
- Utilisez les méthodes `getBlueprints()`, `getPrintProviders()`, `getVariants()` pour obtenir les bons IDs

## 📚 Documentation API Printify

Pour plus d'informations sur l'API Printify :
- [Documentation officielle](https://printify.com/docs/)
- [Référence API](https://printify.com/docs/api/)
- [Catalogue des produits](https://printify.com/docs/api/catalog/)

## 🤝 Contribution

Ce service fait partie du projet micro-services. Pour contribuer :
1. Créez une branche pour votre fonctionnalité
2. Testez vos modifications avec `node src/test.js`
3. Soumettez une pull request

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails. 