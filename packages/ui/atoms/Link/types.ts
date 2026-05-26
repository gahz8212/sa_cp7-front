import type React from 'react'

export type LinkVariant = 'default' | 'underline' | 'muted'

export type LinkProps = React.ComponentPropsWithoutRef<'a'> & {
  href: string
  variant?: LinkVariant
  external?: boolean
}
