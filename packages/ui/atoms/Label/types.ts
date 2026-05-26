import type React from 'react'

export type LabelSize = 'sm' | 'md' | 'lg'

export type LabelProps = React.ComponentPropsWithoutRef<'label'> & {
  size?: LabelSize
  required?: boolean
}
