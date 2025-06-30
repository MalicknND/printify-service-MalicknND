# 🔗 Guide d'Intégration - Service Printify + BDD

## 📋 Vue d'ensemble

Ce guide explique comment le **Service Printify** s'intègre automatiquement avec le **Service BDD** pour enregistrer chaque produit créé par utilisateur dans la base de données Supabase.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Service Printify │    │  Service BDD    │
│   (Next.js)     │───▶│   (Port 3004)     │───▶│  (Port 9002)    │
│                 │    │                  │    │                 │
│ - Créer produit │    │ - Upload image   │    │ - Enregistrer   │
│ - Lister produits│   │ - Créer produit  │    │   produit       │
│                 │    │ - Enregistrer DB │    │ - Lister par    │
└─────────────────┘    └──────────────────┘    │   utilisateur   │
                                               └─────────────────┘
```

## 🔄 Workflow complet

### 1. **Création d'un produit**
```javascript
// Frontend → Service Printify
POST /api/printify/product/create
{
  "title": "T-shirt IA Génial",
  "blueprintId": 5,
  "printProviderId": 1,
  "variants": [...],
  "printAreas": [...]
}
```

### 2. **Traitement par le Service Printify**
- ✅ Validation des données
- ✅ Upload de l'image vers Printify
- ✅ Création du produit dans Printify
- ✅ **Enregistrement automatique en base de données**

### 3. **Enregistrement en BDD**
```javascript
// Service Printify → Service BDD
POST /api/products
{
  "userId": "user_2ta6NRH0kZxG51Gcn6gCaVzJQPe",
  "printifyId": "6862a2e379a2a4e66f05b610",
  "title": "T-shirt IA Génial",
  "variants": [...],
  "images": [...]
}
```

### 4. **Récupération des produits**
```javascript
// Frontend → Service BDD
GET /api/products?userId=user_2ta6NRH0kZxG51Gcn6gCaVzJQPe
```

## ⚙️ Configuration

### Variables d'environnement

#### Service Printify (`.env`)
```bash
# Configuration Printify
PRINTIFY_API_KEY=your_printify_api_key
PRINTIFY_SHOP_ID=your_shop_id

# Service BDD (NOUVEAU)
BDD_SERVICE_URL=http://localhost:9002

# Autres configurations
PORT=3004
NODE_ENV=development
DEFAULT_MARGIN_PERCENT=50
```

#### Service BDD (`.env`)
```bash
# Base de données
DATABASE_URL="postgresql://user:password@host:port/database"

# Serveur
PORT=9002
```

## 🚀 Démarrage des services

### 1. **Service BDD**
```bash
cd bdd-services-MalicknND

# Migration de la base de données
npx prisma migrate dev --name add_product_tables

# Démarrer le service
npm run dev
# Service disponible sur http://localhost:9002
```

### 2. **Service Printify**
```bash
cd printify-service-MalicknND

# Installer les dépendances
npm install

# Démarrer le service
npm run dev
# Service disponible sur http://localhost:3004
```

## 📊 Fonctionnalités intégrées

### ✅ **Création automatique**
- Chaque produit créé dans Printify est automatiquement enregistré en base
- Lien automatique avec l'utilisateur connecté
- Gestion des erreurs sans impact sur la création Printify

### ✅ **Récupération par utilisateur**
- API dédiée pour lister les produits d'un utilisateur
- Pagination intégrée
- Relations complètes (variants, images)

### ✅ **Logs détaillés**
```
📤 [PRODUCT] Création produit pour utilisateur: user_123
✅ [PRODUCT] Produit créé avec succès: 6862a2e379a2a4e66f05b610
💾 [BDD] Enregistrement du produit 6862a2e379a2a4e66f05b610 pour l'utilisateur user_123
✅ [BDD] Produit enregistré avec succès en base de données
✅ [PRODUCT] Produit enregistré en base de données
```

## 🔧 Utilisation dans le Frontend

### Service API unifié
```typescript
// services/printifyService.ts
export const printifyService = {
  // Créer un produit (enregistre automatiquement en BDD)
  async createProduct(productData: any) {
    const response = await fetch('/api/printify/product/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    return response.json();
  },

  // Récupérer les produits d'un utilisateur (depuis la BDD)
  async getUserProducts(userId: string) {
    const response = await fetch(
      `http://localhost:9002/api/products?userId=${userId}`
    );
    return response.json();
  }
};
```

### Composant React
```tsx
// components/ProductCreator.tsx
import { useState } from 'react';
import { printifyService } from '../services/printifyService';

export function ProductCreator({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleCreateProduct = async (productData: any) => {
    setLoading(true);
    try {
      const result = await printifyService.createProduct(productData);
      
      if (result.success) {
        console.log('✅ Produit créé:', result.data);
        console.log('💾 Enregistré en base:', result.savedToDatabase);
      }
    } catch (error) {
      console.error('❌ Erreur création:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Formulaire de création */}
    </div>
  );
}
```

## 🧪 Tests d'intégration

### Test complet du workflow
```bash
# 1. Démarrer les services
cd bdd-services-MalicknND && npm run dev
cd printify-service-MalicknND && npm run dev

# 2. Tester la création de produit
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

# 3. Vérifier l'enregistrement en base
curl "http://localhost:9002/api/products?userId=YOUR_USER_ID"
```

## 🔍 Monitoring et débogage

### Logs du Service Printify
```bash
# Suivre les logs en temps réel
tail -f printify-service-MalicknND/logs/app.log
```

### Logs du Service BDD
```bash
# Suivre les logs en temps réel
tail -f bdd-services-MalicknND/logs/app.log
```

### Vérification de la base de données
```bash
# Ouvrir Prisma Studio
cd bdd-services-MalicknND
npx prisma studio
```

## 🚨 Gestion des erreurs

### Erreurs courantes

#### Service BDD indisponible
```
❌ [BDD] Erreur lors de l'enregistrement en base: connect ECONNREFUSED
⚠️ [PRODUCT] Échec de l'enregistrement en base de données
```
**Solution :** Vérifier que le service BDD est démarré sur le port 9002

#### Erreur de validation
```
❌ [BDD] Erreur lors de l'enregistrement en base: Request failed with status code 400
```
**Solution :** Vérifier les données envoyées au service BDD

#### Timeout
```
❌ [BDD] Erreur lors de l'enregistrement en base: timeout of 10000ms exceeded
```
**Solution :** Augmenter le timeout ou vérifier la performance du service BDD

### Stratégie de résilience
- ✅ La création Printify ne dépend pas de l'enregistrement en base
- ✅ Les erreurs BDD sont loggées mais n'empêchent pas la création
- ✅ Retry automatique possible en implémentant une queue

## 📈 Performance

### Optimisations
- **Timeout configurable** : 10 secondes pour l'enregistrement BDD
- **Logs optimisés** : Pas de spam en cas d'erreur
- **Validation côté service** : Réduction des appels inutiles

### Métriques à surveiller
- Temps de création de produit (Printify + BDD)
- Taux de succès d'enregistrement en base
- Latence du service BDD

## 🔄 Évolutions futures

### Fonctionnalités possibles
- **Queue de retry** : Réessayer les échecs d'enregistrement
- **Synchronisation bidirectionnelle** : Mettre à jour Printify depuis la BDD
- **Cache Redis** : Optimiser les lectures fréquentes
- **Webhooks** : Notifications en temps réel

### Monitoring avancé
- **Prometheus metrics** : Métriques de performance
- **Health checks** : Vérification de la connectivité entre services
- **Alerting** : Notifications en cas d'erreur

## 📝 Notes importantes

- ✅ **Séparation des responsabilités** : Chaque service a son rôle
- ✅ **Résilience** : Le service Printify fonctionne même si la BDD est indisponible
- ✅ **Traçabilité** : Logs détaillés pour le débogage
- ✅ **Extensibilité** : Architecture modulaire pour les évolutions futures

---

**🎯 Cette intégration permet d'avoir un système complet où chaque produit créé est automatiquement enregistré et peut être consulté par utilisateur !** 