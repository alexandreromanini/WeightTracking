# Barre

Entre deux séries, une seule question compte : combien j’ai mis la dernière fois ?
Barre s’ouvre sur la réponse, en très gros, pour chaque exercice. On reprend la même
charge en un tap, ou +2,5 kg si la séance précédente est passée facilement, et
l’app le signale le jour où le record tombe.

Démo : [weight-tracking-tau.vercel.app](https://weight-tracking-tau.vercel.app).
Aucun compte, tout reste dans le navigateur. Sur l’accueil vide, « Ou essayer avec
10 semaines fictives » remplit l’app d’un historique de démonstration.

<p align="center">
  <img src="docs/screenshots/accueil.png" width="200" alt="Accueil rangé par groupe musculaire, dernière charge en très gros chiffres" />
  <img src="docs/screenshots/seance.png" width="200" alt="Saisie d’une séance pré-remplie avec des boutons ±2,5 kg" />
  <img src="docs/screenshots/record.png" width="200" alt="Écran bleu nuit d’un nouveau record" />
</p>
<p align="center">
  <img src="docs/screenshots/progression.png" width="200" alt="Record, graphique de progression et historique" />
  <img src="docs/screenshots/recherche.png" width="200" alt="Recherche d’exercices en français" />
  <img src="docs/screenshots/groupes.png" width="200" alt="Un tap sur « Dos » : seuls les exercices de dos restent affichés" />
</p>

## Ce que fait l’app

On cherche un exercice en français (« développé couché », « rowing barre »,
« tractions ») parmi les 876 de free-exercise-db, fautes de frappe comprises, puis on
l’ajoute à sa liste. L’accueil affiche, pour chacun, la dernière charge, le record et
le 1RM estimé (formule d’Epley).
La liste est rangée par groupe musculaire (Pecs, Dos, Mollets…) : en séance
jambes, un tap sur « Mollets » ne montre plus que les mollets.

La saisie reprend les séries de la dernière fois. Les boutons font ±2,5 kg et ±1 rep,
la virgule est acceptée, une valeur invalide est soulignée en rouge. À
l’enregistrement, Barre compare avec l’historique : charge max battue, 1RM battu, ou
les deux.

L’écran Progression trace la charge max et le 1RM sur une vraie échelle de temps (deux
semaines sans séance se voient), et chaque séance de l’historique se corrige ou se
supprime. Les données s’exportent en JSON et se réimportent après vérification.

L’app s’installe sur l’écran d’accueil et marche hors ligne, au fond de la salle sans
réseau. Elle se navigue au clavier, annonce les records aux lecteurs d’écran et coupe
son unique animation si le système demande moins de mouvement.

## Stack

| Besoin     | Choix                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------- |
| UI         | React 19, TypeScript strict, Vite                                                                 |
| Style      | Tailwind CSS 4 (tokens dans `src/index.css`)                                                      |
| Données    | IndexedDB via Dexie.js + `useLiveQuery`                                                           |
| Recherche  | Fuse.js + dictionnaire de synonymes français                                                      |
| Graphiques | Recharts (chargé à la demande)                                                                    |
| Navigation | React Router                                                                                      |
| Hors ligne | vite-plugin-pwa (Workbox)                                                                         |
| Qualité    | Vitest, React Testing Library, fake-indexeddb, ESLint (`strictTypeChecked`, `jsx-a11y`), Prettier |

## Choix techniques

**IndexedDB comme source de vérité, sans store global.**
Pas de backend pour le MVP : les données vivent dans IndexedDB. `useLiveQuery` (Dexie)
rend les requêtes réactives, chaque écran relit la base et se met à jour seul après une
écriture. Pas de Redux/Zustand : il n’y aurait rien à y mettre.

**Les records sont calculés, jamais stockés.**
Dernière perf, record de charge et meilleur 1RM sont dérivés de l’historique par des
fonctions pures (`src/lib/performance.ts`). Modifier ou supprimer une séance ne peut donc
pas désynchroniser un record. Ces fonctions sont couvertes par des tests unitaires.

**Une interface pour la source d’exercices.**
`ExerciseProvider` isole free-exercise-db : le JSON est téléchargé une fois, normalisé
(validation de forme, URLs d’images absolues) puis mis en cache dans IndexedDB.
Brancher une autre API (wger…) revient à écrire un autre provider.

**Recherche en français sur une base anglaise.**
La requête est normalisée (accents, ponctuation), les expressions françaises sont
traduites (les plus longues d’abord : « rowing barre » avant « barre »), puis Fuse.js
cherche chaque mot en flou. Une courte liste de mouvements classiques remonte en tête,
sinon Fuse favorise les noms courts et le développé couché à la barre finit 18ᵉ.

**Saisie en texte, validée à l’enregistrement.**
Les champs gardent la saisie brute et `parseSet` la valide : `<input type="number">`
gère mal la virgule française et empêche de vider un champ pendant la frappe. Les pas de
±2,5 kg sont arrondis au centième pour éviter les `82,4999…` des flottants.

**Le nom et l’image de l’exercice sont copiés dans `UserExercise`.**
L’accueil s’affiche sans attendre le catalogue (~1 Mo), et un changement de provider ne
casse pas l’historique.

**Import défensif.**
Un fichier importé est une donnée non fiable : `parseBackup` vérifie chaque champ, les
références entre séances et exercices, et les doublons. La restauration se fait dans une
transaction : soit tout est remplacé, soit rien ne change.

**Hors ligne d’abord.**
Les données étant déjà locales (IndexedDB), il restait à rendre l’app elle-même
disponible sans réseau. Le service worker (Workbox via vite-plugin-pwa) précharge tout
le build, y compris l’écran Progression chargé à la demande, et met en cache les polices
et les photos d’exercices au fil de la navigation. Les photos sont demandées en CORS
(`crossOrigin="anonymous"`) : une réponse « opaque » serait comptée ~7 Mo chacune dans
le quota de stockage du navigateur. Les mises à jour sont **proposées** (bandeau
« Nouvelle version disponible ») plutôt qu’appliquées d’office : un rechargement
automatique effacerait une séance en cours de saisie.

**Poids toujours en kg.** Un futur choix kg/lbs ne sera qu’une conversion à l’affichage.

**Une direction artistique écrite, pas implicite.** Le design « Tableau
d’affichage » est décrit dans [`DESIGN.md`](DESIGN.md) : polices (Archivo étendu pour
les chiffres, Atkinson Hyperlegible Next pour le texte), sept couleurs bleu et blanc,
échelle typographique en quarte juste, interdits. Les valeurs par défaut de Tailwind
(couleurs, tailles, rayons, ombres) sont désactivées dans `src/index.css` : une classe
hors du système ne produit aucun style.

## Architecture

```
src/
├── components/      UI partagée (Stepper, ExerciseImage avec repli, états vides…)
├── db/              schéma Dexie et données de démo
├── features/
│   ├── exercises/   provider free-exercise-db, recherche, fiche exercice
│   ├── tracking/    mes exercices, saisie de séance, progression
│   └── settings/    sauvegarde, démo, à propos
├── hooks/           chargement et cache du catalogue
├── lib/             logique pure et testée : performance, recherche, saisie, sauvegarde, formats
└── types/           modèle de données
```

Modèle de données :

```ts
UserExercise { id, exerciseId, name, image?, addedAt, notes? }
WorkoutEntry { id, userExerciseId, date: 'YYYY-MM-DD', sets: { weight /* kg */, reps }[], note? }
```

## Lancer en local

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:5173
```

Pour explorer l’app sans saisir de données : **Réglages → Charger les données de démo**
(ou le bouton sur l’accueil vide).

| Script           | Rôle                                                             |
| ---------------- | ---------------------------------------------------------------- |
| `npm run dev`    | serveur de développement                                         |
| `npm run build`  | vérification TypeScript + build de production dans `dist/`       |
| `npm test`       | tests en mode watch                                              |
| `npm run check`  | TypeScript, ESLint et tous les tests (à lancer avant de pousser) |
| `npm run format` | Prettier                                                         |

## Déploiement

Site statique : `npm run build` produit `dist/`.

- **Vercel** : importer le dépôt, aucun réglage. `vercel.json` renvoie toutes les routes
  vers `index.html` pour que React Router fonctionne au rechargement.
- **Netlify** : commande `npm run build`, dossier `dist`, et ajouter un fichier
  `public/_redirects` contenant `/* /index.html 200`.

## Limites connues

- Les données restent dans le navigateur : penser à exporter une sauvegarde.
- Hors ligne, la recherche suppose que le catalogue ait été chargé une première fois en
  ligne ; seules les photos déjà affichées sont en cache (sinon, initiales en repli).
- Le bandeau « Hors ligne » repose sur `navigator.onLine` : il s’affiche en mode avion,
  pas avec un réseau présent mais inutilisable. L’app fonctionne dans les deux cas.
- Les exercices au poids du corps (0 kg) n’ont pas encore de record dédié (en répétitions).
- Les instructions des exercices sont en anglais (celles de la base source).

## Crédits

- Exercices et photos : [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  de yuhonas, dans le domaine public (Unlicense).
- Polices : [Barlow et Barlow Condensed](https://fonts.google.com/specimen/Barlow)
  de Jeremy Tribby (SIL Open Font License).
- 1RM estimé : formule d’Epley, `poids × (1 + reps / 30)`.
