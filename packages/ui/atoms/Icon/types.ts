import type React from 'react'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type IconProps = React.ComponentPropsWithoutRef<'svg'> & {
  size?: IconSize
}
