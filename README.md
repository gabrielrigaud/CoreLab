# CoreLab LMS

> Learning Management.

## Prérequis

- **Node.js** v18+ 
- **MongoDB** (local ou Atlas)
- **npm** v9+

## Installation

```bash
# Cloner le dépôt
git clone

# Installer les dépendances (serveur + client)
npm install
```

## Variables d'environnement

Créez un fichier `.env` à la racine du projet à partir du fichier `.env.example` :

```bash
cp .env.example .env
```

## Démarrage

```bash
# Démarrer le serveur API et le client React simultanément
npm run dev:all

# Ou séparément :
npm run dev:back   # API sur http://localhost:4242
npm run dev:front  # Client sur http://localhost:3000
```

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm start` | Démarre le serveur en production |
| `npm run dev` | Démarre le serveur avec nodemon (hot-reload) |
| `npm run dev:all` | Démarre API + Client simultanément |
| `npm run dev:back` | Démarre uniquement l'API |
| `npm run dev:front` | Démarre uniquement le client React |

## Architecture

```
Corelab-back/
├── client/              # Application React (Vite)
│   └── src/
│       ├── components/  # Composants réutilisables
│       ├── pages/       # Pages (Student & Admin)
│       └── api/         # Configuration Axios
├── server/              # Point d'entrée Express
├── controllers/         # Logique métier
├── models/              # Schémas Mongoose
├── routes/              # Définition des routes API
├── middlewares/         # Auth, validation, upload
├── validators/          # Schémas Zod
├── config/              # Configuration DB
└── uploads/             # Fichiers uploadés (leçons HTML, CSV)
```

## Fonctionnalités

### Administration
- Import d'étudiants via CSV
- Gestion des cohortes (création, ajout d'étudiants)
- Création et gestion de cours
- Import de leçons HTML et de QCM (JSON/CSV)
- Assignation de cours à des cohortes avec planification
- Consultation des notes et export CSV

### Étudiant
- Première connexion avec changement de mot de passe obligatoire
- Tableau de bord avec progression
- Accès aux leçons et QCM
- Notifications automatiques (leçons débloquées)
- Visualisation des résultats d'examens

## Sécurité

- Mots de passe hachés avec **bcrypt** (cost factor ≥ 10)
- Authentification par **JWT** avec expiration (24h)
- Routes protégées avec vérification de rôle (401/403)
- Validation des entrées avec **Zod**
- Variables sensibles dans `.env` (non versionné)