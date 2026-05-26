import type React from 'react'

export type DividerOrientation = 'horizontal' | 'vertical'

export type DividerProps = React.ComponentPropsWithoutRef<'hr'> & {
  orientation?: DividerOrientation
}
