# Barre · direction artistique « Tableau d'affichage »

Barre se lit comme le tableau des charges d'une salle : des chiffres énormes, lisibles
de loin, sur du blanc et du bleu nuit. Le chiffre est la vedette, le reste se tait.

Références : Basic-Fit (typo sportive épaisse, coupes en biais, blocs pleins),
BoursoBank (gros chiffre + petite unité), Les Stations (bleu nuit et bleu électrique,
prix aligné à droite).

## Typographie

| Rôle                         | Police                         | Réglages                                              | Pourquoi                                                                                                         |
| ---------------------------- | ------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Titres, chiffres, logo       | **Archivo**                    | largeur 125 %, graisse 800, italique pour les charges | Étendue et lourde comme les numéros de maillot et la signalétique de salle. L'italique donne l'élan.             |
| Texte, libellés, formulaires | **Atkinson Hyperlegible Next** | 400 et 700, jamais 600                                | Dessinée pour la lisibilité (Braille Institute) : 1/l/I et 0/O distincts, utile pour relire une charge en sueur. |

- Chargement : Google Fonts, `display=swap`, sous-ensembles latin découpés par `unicode-range`.
- Échelle typographique : quarte juste (ratio 1,333) sur une base de 17 px.

| Token          | Taille  | Usage                                          |
| -------------- | ------- | ---------------------------------------------- |
| `text-label`   | 13 px   | libellés, dates, méta                          |
| `text-body`    | 17 px   | texte courant                                  |
| `text-lead`    | 22,7 px | titres de section, nom d'exercice mis en avant |
| `text-title`   | 30,2 px | titres de page longs (noms d'exercices)        |
| `text-display` | 40,3 px | titres de page courts                          |
| `text-score`   | 53,7 px | charge dans une liste                          |
| `text-giant`   | 71,6 px | charge mise en avant, record                   |

Les tailles par défaut de Tailwind sont désactivées dans `src/index.css`.

## Couleurs

Seulement du bleu et du blanc. Pas de teinte intermédiaire « soft » ni de dégradé.

| Token      | Hex       | Usage                                                   |
| ---------- | --------- | ------------------------------------------------------- |
| `white`    | `#FFFFFF` | fond                                                    |
| `chalk`    | `#F4F5F8` | champs de saisie, zones de fond secondaires             |
| `night`    | `#0B1238` | texte, en-têtes, ligne du 1RM                           |
| `electric` | `#0A3DFF` | action, record de charge, ligne de charge, onglet actif |
| `steel`    | `#5C627A` | texte secondaire (6,0:1 sur blanc)                      |
| `rule`     | `#D5D8E3` | filets                                                  |
| `signal`   | `#E0242F` | erreurs et suppressions uniquement (4,7:1 sur blanc)    |

La palette Tailwind par défaut est désactivée (`--color-*: initial`) : une couleur hors de
ce tableau ne produit aucun style.

**Graphique** : la charge est un trait plein `electric` et le 1RM un pointillé `night`.
Le validateur de palette signale `night` comme trop sombre pour une palette
catégorielle ; c'est voulu, car le 1RM est une estimation dérivée de la charge, pas une
série équivalente. La séparation reste forte (ΔE 36 pour les daltoniens) et l'identité
est portée trois fois : pointillé, légende, étiquette directe.

## Mise en page

- **Pas de cartes.** Les éléments d'une liste sont des lignes pleine largeur séparées
  par un filet `rule` de 1 px.
- **Alignement à gauche.** Rien n'est centré, sauf les libellés de la barre d'onglets et la valeur d'un champ numérique.
- **Contraste d'échelle.** Un chiffre `giant` ou `score` côtoie un libellé de 13 px ;
  pas de taille moyenne entre les deux.
- **Asymétrie volontaire.** Le premier exercice de l'accueil (le plus récent) est mis
  en avant en `giant`, les suivants en `score`. Sur Progression, le record prend les
  deux tiers de la largeur, 1RM et nombre de séances s'empilent dans le dernier tiers.
- **Densité variable.** Serré dans les listes (12–16 px), large entre les sections
  (48–56 px). Jamais la même valeur partout.
- **Angles vifs** partout (rayon 0). **Aucune ombre.**

## Images

Les photos de free-exercise-db (studio aux murs rouges) passent en **bichromie bleu
nuit / blanc** (`grayscale` + `mix-blend-mode: screen` sur fond `night`). Elles
s'intègrent à la palette au lieu de la contredire. Sans photo : initiales en Archivo
italique blanc sur `night`.

## Signature

**La coupe.** Le bas de l'en-tête bleu nuit et le bouton principal sont coupés en
biais (`clip-path`), comme les bandes des affiches de salle. C'est la seule forme
« décorative » du site.

## Mouvement

Une seule animation : quand un record tombe, le chiffre entre en glissant en biais
(250 ms). Tout est désactivé avec `prefers-reduced-motion`. Les squelettes de
chargement pulsent (fonctionnel). Rien d'autre ne bouge.

## Texte

- Tutoiement, phrases courtes, vocabulaire de salle (« charge », « série », « reps »).
- Test de substitution : si la phrase marche pour une autre app, elle est réécrite.
- Pas de tiret cadratin dans les titres ; séparateur « · ».

## Interdits

- Cartes arrondies, ombres, pastilles, badges en forme de pilule.
- Surtitres au-dessus des titres.
- Icônes décoratives ou icônes dans des cercles. Seules restent les icônes
  fonctionnelles (loupe, retour, fermer).
- Couleurs Tailwind par défaut, dégradés, flou, verre dépoli.
- Graisse 600 sur du texte courant.
- Texte centré, sauf les onglets et la valeur d'un champ numérique.
- Toute animation autre que celle du record.
