import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  // Bouts carrés et angles vifs, comme le reste du site (voir DESIGN.md).
  strokeWidth: 2.5,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': true,
} as const

export const SearchIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
)

export const BackIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const CloseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export const CheckIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)
