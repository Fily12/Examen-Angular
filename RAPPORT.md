# Rapport Technique — BadWallet Dashboard

## 1. Choix d'architecture

**Standalone Components** ont été choisis pour éliminer les NgModules et réduire le boilerplate. Chaque composant déclare ses propres imports, ce qui améliore le tree-shaking et la lisibilité.

**Angular Signals** sont utilisés pour le solde (`BalanceStore`) : le signal `balance()` se propage automatiquement dans tous les composants qui le consomment (Header, Dashboard) sans subscription manuelle ni `async` pipe, garantissant une mise à jour réactive après chaque opération.

**Deux services API distincts** (`WalletApiService` → port 8080, `BillingApiService` → port 8081) respectent la séparation des responsabilités et permettent à l'intercepteur d'identifier l'origine des erreurs pour des messages différenciés.

**Lazy loading** sur toutes les routes réduit le bundle initial et accélère le premier chargement.

## 2. Difficultés rencontrées

**CORS** : En développement, les appels directs vers `localhost:8080/8081` déclenchent des erreurs CORS. Le proxy Angular (`proxy.conf.json`) résout ce problème en routant `/api/wallets` et `/api/external` vers les bons backends.

**Synchronisation du solde** : Le signal Angular dans `BalanceStore` garantit que le solde affiché dans le header et le dashboard se met à jour immédiatement après un transfert ou un paiement, sans émettre d'événements ou utiliser un BehaviorSubject.

**Validation asynchrone** : Le validator `asyncPhoneExistsValidator` avec debounce 400ms évite de spammer l'API à chaque frappe, tout en vérifiant l'existence du destinataire avant soumission.

**Deux base URLs** : La cohabitation de `environment.walletApiUrl` (8080) et `environment.paymentApiUrl` (8081) dans des services séparés, avec l'intercepteur distinguant les deux origines, permet des messages d'erreur précis.

## 3. Améliorations possibles

- **JWT Authentication** : Remplacer le stockage `localStorage` par un vrai flux d'authentification JWT avec refresh token et intercepteur d'ajout du header `Authorization`.
- **Tests unitaires & E2E** : Ajouter des specs avec Jest/Jasmine pour les services et des tests E2E avec Cypress ou Playwright.
- **PWA** : Transformer l'application en Progressive Web App avec `@angular/pwa` pour un fonctionnement hors-ligne et des notifications push.
- **WebSocket pour le solde live** : Remplacer le polling par une connexion WebSocket (STOMP/SockJS) pour recevoir les mises à jour de solde en temps réel depuis le backend.
- **Pagination côté serveur** : Améliorer la page transactions avec une pagination infinie ou des curseurs.
