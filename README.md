# Décorateur @Identifier pour JsonDatabase

Ce projet implémente un décorateur TypeScript `@Identifier()` qui permet de marquer automatiquement les champs identifiants dans vos modèles de données pour une utilisation avec JsonDatabase.

## Fonctionnalités

- **Décorateur automatique** : Marque un champ comme identifiant unique
- **Parsing JSON intelligent** : Convertit automatiquement les objets JSON en instances de modèles avec identifiants
- **Type-safe** : Support complet TypeScript avec vérification de types
- **Métadonnées** : Utilise reflect-metadata pour stocker les informations d'identifiant
- **Flexibilité** : Supporte différents types d'identifiants (string, number, etc.)

## Installation

```bash
npm install reflect-metadata
```

## Utilisation de base

### 1. Définition d'un modèle avec décorateur

```typescript
import 'reflect-metadata';
import { JsonModel, Identifier } from './JsonDatabase';

class User extends JsonModel {
    @Identifier()
    id: string;
    name: string;
    email: string;
    
    constructor(id: string, name: string, email: string) {
        super();
        this.id = id;
        this.name = name;
        this.email = email;
        // Important : synchroniser l'identifiant après initialisation
        this.identifier = this.id;
    }
}
```

### 2. Création d'une base de données

```typescript
import { JsonDatabase } from './JsonDatabase';

const userDb = new JsonDatabase<User>('users.json', User);
```

### 3. Opérations CRUD

```typescript
// Création et sauvegarde
const user = new User('user001', 'Alice Dupont', 'alice@example.com');
userDb.save(user);

// Récupération par identifiant
const retrievedUser = userDb.findById('user001');
console.log(retrievedUser?.name); // Alice Dupont

// Mise à jour
if (retrievedUser) {
    retrievedUser.email = 'alice.new@example.com';
    userDb.update(retrievedUser);
}

// Suppression
userDb.delete('user001');

// Récupération de tous les enregistrements
const allUsers = userDb.findAll();
```

### 4. Parsing de données JSON

```typescript
// Données JSON brutes
const jsonData = [
    { id: 'user002', name: 'Bob Martin', email: 'bob@example.com' },
    { id: 'user003', name: 'Claire Bernard', email: 'claire@example.com' }
];

// Conversion en instances de modèles
jsonData.forEach(userData => {
    const user = User.fromJson(userData);
    userDb.save(user);
    console.log(`Utilisateur: ${user.name}, ID: ${user.identifier}`);
});
```

## Exemples avec différents types d'identifiants

### Modèle Product avec SKU

```typescript
class Product extends JsonModel {
    @Identifier()
    sku: string;
    name: string;
    price: number;
    
    constructor(sku: string, name: string, price: number) {
        super();
        this.sku = sku;
        this.name = name;
        this.price = price;
        this.identifier = this.sku;
    }
}

const product = new Product('PROD001', 'Ordinateur portable', 1299.99);
console.log(product.identifier); // PROD001
console.log(product.identifierFieldName); // sku
```

### Modèle Order avec numéro de commande

```typescript
class Order extends JsonModel {
    @Identifier()
    orderNumber: string;
    userId: string;
    total: number;
    
    constructor(orderNumber: string, userId: string, total: number) {
        super();
        this.orderNumber = orderNumber;
        this.userId = userId;
        this.total = total;
        this.identifier = this.orderNumber;
    }
}
```

## Propriétés et méthodes disponibles

### Classe JsonModel

- `identifier: any` - Valeur de l'identifiant
- `identifierFieldName: string` - Nom du champ marqué comme identifiant
- `getIdentifierFieldName(): string` - Récupère le nom du champ identifiant
- `getIdentifierValue(): any` - Récupère la valeur de l'identifiant
- `static fromJson<T>(jsonObj: any): T` - Crée une instance depuis un objet JSON

### Classe JsonDatabase

- `save(model: T): void` - Sauvegarde un modèle
- `findById(id: any): T | null` - Trouve un modèle par son identifiant
- `findAll(): T[]` - Récupère tous les modèles
- `update(model: T): void` - Met à jour un modèle existant
- `delete(id: any): void` - Supprime un modèle par son identifiant

## Fonctionnalités avancées

### Extension avec méthodes personnalisées

```typescript
// Extension de JsonDatabase avec une méthode de recherche
declare module './JsonDatabase' {
    interface JsonDatabase<T> {
        findWhere(predicate: (item: T) => boolean): T[];
    }
}

(JsonDatabase.prototype as any).findWhere = function<T>(predicate: (item: T) => boolean): T[] {
    return this.findAll().filter(predicate);
};

// Utilisation
const expensiveProducts = productDb.findWhere(p => p.price > 500);
const usersWithGmail = userDb.findWhere(u => u.email.includes('@gmail.com'));
```

## Points importants

1. **Import reflect-metadata** : Toujours importer `'reflect-metadata'` en premier
2. **Synchronisation manuelle** : Après création, synchroniser `this.identifier = this.fieldValue`
3. **Constructeur obligatoire** : Passer le constructeur de modèle à JsonDatabase
4. **Type safety** : Utiliser les génériques TypeScript pour la sécurité des types

## Structure de fichier recommandée

```
project/
├── src/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   └── Order.ts
│   ├── database/
│   │   └── JsonDatabase.ts
│   └── data/
│       ├── users.json
│       ├── products.json
│       └── orders.json
```

## Exemple complet

Voir les fichiers `demo.ts` et `examples.ts` pour des exemples complets d'utilisation avec différents types de modèles et opérations avancées.