/** Classes partagées par les boutons et les liens-boutons (voir DESIGN.md). */

// Bouton principal : bleu électrique, bord droit coupé en biais (signature).
// Le focus est dessiné à l'intérieur, sinon la coupe le masquerait.
export const buttonPrimary =
  'display cut-edge inline-flex min-h-14 items-center gap-3 bg-electric pr-10 pl-5 text-lead text-white focus-visible:outline-white focus-visible:-outline-offset-[6px] active:bg-night disabled:bg-steel'

export const buttonSecondary =
  'inline-flex min-h-14 items-center gap-2 border-2 border-night bg-white px-5 font-bold text-night hover:bg-chalk active:bg-rule'

// Action discrète : lien souligné, pas de bouton encadré.
export const linkAction =
  'inline-flex min-h-11 items-center font-bold text-electric underline decoration-2 underline-offset-4 hover:text-night'

export const linkDanger =
  'inline-flex min-h-11 items-center font-bold text-signal underline decoration-2 underline-offset-4'

// Bouton plein destructif, pour la confirmation finale.
export const buttonDanger =
  'inline-flex min-h-11 items-center bg-signal px-4 font-bold text-white active:bg-night'
