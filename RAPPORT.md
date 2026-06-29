# Rapport Technique — BadWallet Dashboard

**Module :** Développement Web Avancé
**Projet :** BadWallet Dashboard — Interface Angular pour la gestion de portefeuilles mobiles
**Étudiant :** Fily Thiaw
**Dépôt frontend :** https://github.com/Fily12/Examen-Angular
**Dépôt backend :** https://github.com/Fily12/BadWallet-Microservices

---

## 1. Présentation du projet

L'objectif de ce projet était de concevoir et développer une interface web moderne (SPA) consommant deux microservices Spring Boot déjà existants. Le frontend devait permettre à deux types d'utilisateurs — un **client** et un **agent** — d'interagir avec un système de portefeuilles mobiles inspiré des solutions de mobile money répandues en Afrique de l'Ouest.

Le client peut consulter son solde, effectuer des transferts d'argent et régler ses factures auprès de fournisseurs comme WOYAFAL, ISM ou SENELEC. L'agent, de son côté, dispose d'un tableau de bord pour créer des portefeuilles, effectuer des dépôts et des retraits, et surveiller l'ensemble du parc de wallets.

---

## 2. Choix d'architecture

### Angular Standalone Components

Le choix d'utiliser les **Standalone Components** d'Angular 17 était délibéré. Cette approche élimine les NgModules et permet à chaque composant de déclarer explicitement ses dépendances. Cela rend le code plus lisible, facilite le découpage en modules chargés à la demande (*lazy loading*), et améliore les performances au démarrage de l'application.

### Angular Signals pour le solde en temps réel

Le solde du portefeuille est géré via un **Signal Angular** dans un service dédié (`BalanceStore`). Contrairement à un `BehaviorSubject` RxJS classique, le Signal propage automatiquement la mise à jour à tous les composants qui le consomment — le header et le dashboard — sans nécessiter d'abonnement manuel ni de `async` pipe. Après chaque transfert ou paiement de facture, un simple appel à `balanceStore.refresh()` met à jour l'affichage instantanément.

### Séparation stricte des deux microservices

Deux services Angular distincts ont été créés : `WalletApiService` pour le port 8080 et `BillingApiService` pour le port 8081. Cette séparation reflète l'architecture microservices du backend et permet à l'intercepteur HTTP de distinguer l'origine des erreurs réseau pour afficher des messages précis à l'utilisateur.

### Lazy Loading sur toutes les routes

Chaque page est chargée à la demande via `loadComponent()`. Le bundle initial de l'application ne dépasse pas 85 Ko compressés, ce qui garantit un premier affichage rapide même sur une connexion modeste.

---

## 3. Difficultés rencontrées

### Le problème CORS

La première difficulté concrète est apparue dès les premiers tests : le navigateur bloquait toutes les requêtes HTTP vers `localhost:8080` et `localhost:8081` en raison de la politique CORS. La solution standard en développement Angular est d'utiliser un proxy (`proxy.conf.json`) qui redirige les appels relatifs vers les bons ports. Cependant, une erreur subtile persistait : les services utilisaient des URLs absolues (`http://localhost:8080/api/wallets`) au lieu de chemins relatifs (`/api/wallets`). Une URL absolue contourne le proxy — le navigateur envoie la requête directement et le CORS bloque. Corriger toutes les URLs en chemins relatifs a immédiatement résolu le problème.

### La synchronisation entre les DTOs du backend et le frontend

Le backend réel présentait plusieurs différences avec la documentation initiale. Le champ `phone` s'appelait en réalité `phoneNumber`, le transfert utilisait `senderPhone`/`receiverPhone` au lieu de `sourcePhone`/`destinationPhone`, et la réponse du solde était un objet `{ phoneNumber, balance }` et non un simple nombre. Ces écarts n'ont été détectés qu'en lisant directement le code source Java du backend sur GitHub, ce qui souligne l'importance de toujours confronter la documentation aux sources réelles.

### La gestion différenciée des erreurs HTTP 409

L'intercepteur HTTP initial mappait systématiquement le code HTTP 409 au message "Fonds insuffisants". Or le backend retourne également un 409 lorsqu'un numéro de téléphone ou un code wallet est déjà utilisé lors d'une création. Il a fallu lire le champ `message` de la réponse d'erreur pour distinguer les deux cas et afficher un message pertinent.

### La validation asynchrone du destinataire

Le formulaire de transfert intègre un validator asynchrone qui vérifie l'existence du numéro destinataire via une requête API, avec un délai de 400 ms (*debounce*) pour ne pas surcharger le serveur à chaque frappe. La difficulté était de gérer correctement les états `pending`, `valid` et `invalid` du formulaire pour désactiver le bouton de soumission pendant la vérification et afficher les bons messages à l'utilisateur.

---

## 4. Améliorations envisageables

Plusieurs axes d'amélioration ont été identifiés mais non implémentés faute de temps :

- **Authentification JWT** : remplacer le stockage en `localStorage` par un vrai mécanisme d'authentification avec token, refresh token et déconnexion automatique à l'expiration.
- **WebSocket pour le solde live** : plutôt que de rafraîchir le solde après chaque opération, une connexion WebSocket permettrait de recevoir les mises à jour en temps réel depuis le backend.
- **Tests unitaires et d'intégration** : couvrir les services, les validators et les composants critiques avec Jest ou Jasmine, et les parcours utilisateurs avec Cypress.
- **Mode PWA** : transformer l'application en Progressive Web App pour permettre un accès hors-ligne aux dernières données consultées.

---

## 5. Conclusion

Ce projet a permis de mettre en pratique les concepts avancés d'Angular dans un contexte proche d'une application réelle : consommation de microservices, gestion d'état réactive, sécurisation des routes et validation de formulaires complexes. Les difficultés rencontrées — notamment le CORS et la divergence entre documentation et implémentation — ont été des occasions d'approfondir la compréhension du cycle de vie d'une requête HTTP dans une application Angular et de l'importance de toujours confronter ses hypothèses au code source réel.
