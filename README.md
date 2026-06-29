# BadWallet Dashboard — Frontend Angular

Interface web complète pour la gestion de portefeuilles mobiles, développée avec Angular 17 en mode Standalone Components. Consomme deux microservices Spring Boot existants.

---

## Aperçu

BadWallet Dashboard permet à un **client** de consulter son solde, effectuer des transferts et payer ses factures. Un **agent** peut gérer l'ensemble des wallets (création, dépôt, retrait).

---

## Technologies utilisées

- **Angular 17** — Standalone Components, Signals, Lazy Loading
- **RxJS** — gestion des flux HTTP et validations asynchrones
- **Angular Signals** — synchronisation du solde en temps réel
- **Reactive Forms** — formulaires avec validators sync et async
- **CSS pur** — aucune librairie UI externe
- **Proxy Angular** — résolution du CORS en développement

---

## Prérequis

- Node.js 18+
- Angular CLI 17+
- Docker + Docker Compose
- Backend : [BadWallet-Microservices](https://github.com/Fily12/BadWallet-Microservices)

---

## Lancer le projet

### 1. Démarrer le backend

```bash
git clone https://github.com/Fily12/BadWallet-Microservices
cd BadWallet-Microservices
git checkout develop
docker-compose up --build
```

### 2. Alimenter la base avec des données de test

```bash
curl -X POST "http://localhost:8080/api/wallets/seed?numWallets=10&eventsPerWallet=50"
```

### 3. Lancer le frontend

```bash
npm install
ng serve
```

Application disponible sur **http://localhost:4200**

---

## Services backend consommés

| Service | Port | Rôle |
|---|---|---|
| badwallet-api | 8080 | Wallets, transactions, transferts, dépôts, retraits |
| payment-service | 8081 | Factures et paiements |

---

## Comptes de test

| Rôle | Numéro | Accès |
|---|---|---|
| 👤 Client | `+221770000001` | Dashboard, transactions, transfert, factures |
| 👤 Client | `+221770000006` | Solde plus élevé pour tester les transferts |
| 🏦 Agent | `+221780000000` | Gestion complète des wallets |

> Les numéros clients sont générés automatiquement par le seed du backend au format `+2217700000XX`

---

## Structure du projet

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          → client.guard.ts, agent.guard.ts
│   │   ├── interceptors/    → error.interceptor.ts (gestion globale des erreurs HTTP)
│   │   ├── interfaces/      → models.ts (DTOs alignés sur le backend réel)
│   │   └── validators/      → phone.validators.ts (sync + async avec debounce 400ms)
│   ├── shared/
│   │   ├── components/toast/ → notifications globales (Signal, max 3, auto-dismiss 4s)
│   │   └── pipes/            → xof.pipe.ts, phone-format.pipe.ts
│   ├── services/
│   │   ├── wallet-api.service.ts    → appels vers port 8080 (via proxy)
│   │   ├── billing-api.service.ts   → appels vers port 8081 (via proxy)
│   │   ├── balance-store.service.ts → Signal Angular pour le solde temps réel
│   │   ├── auth.service.ts          → persistance localStorage
│   │   └── toast.service.ts         → Signal pour les notifications
│   ├── layout/
│   │   ├── header/   → solde Signal + badges état des services
│   │   └── sidebar/  → navigation selon le rôle
│   └── features/
│       ├── auth/login/          → connexion sans API, validation format sénégalais
│       ├── client/
│       │   ├── dashboard/       → solde + graphiques SVG + raccourcis
│       │   ├── transactions/    → historique avec filtres type/date
│       │   ├── transfer/        → formulaire avec validation async du destinataire
│       │   └── bills/           → factures courantes + historique par période
│       └── agent/
│           └── wallets/         → tableau paginé, recherche, dépôt/retrait, création
├── environments/
│   ├── environment.ts       → dev  (walletApiUrl: 8080, paymentApiUrl: 8081)
│   └── environment.prod.ts  → prod
└── proxy.conf.json          → /api/wallets → 8080 | /api/factures → 8081
```

---

## Fonctionnalités

### Espace Client
- Tableau de bord avec solde en temps réel (Angular Signal)
- Graphiques SVG des revenus et dépenses sur 7 jours
- Transfert vers un autre wallet avec vérification d'existence en temps réel
- Paiement de factures avec sélection multiple et total affiché
- Historique des transactions avec filtres par type et période

### Espace Agent
- Liste paginée de tous les wallets
- Recherche par numéro de téléphone
- Création de nouveau wallet
- Dépôt et retrait sur n'importe quel wallet
- Seed de données de démonstration

---

## Proxy CORS (développement)

Le fichier `proxy.conf.json` redirige les appels relatifs :

```json
{
  "/api/wallets":  { "target": "http://localhost:8080" },
  "/api/factures": { "target": "http://localhost:8081" }
}
```

Tous les services Angular utilisent des chemins relatifs (`/api/wallets`) pour passer par ce proxy et éviter les erreurs CORS.

---

## Rapport technique

Voir [RAPPORT.md](./RAPPORT.md)
