'use client'

import { createPortal } from 'react-dom'
import { Heading } from '../../../atoms/Heading'
import { Text } from '../../../atoms/Text'
import { cn } from '../../../lib/utils'
import type { AlertProps } from './types'

export function Alert({ title, message, className, actions, onDimClick }: AlertProps) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onDimClick}
    >
      <div
        className={cn('mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <Heading level={5} className="mb-2">
            {title}
          </Heading>
        )}
        <Text size="sm" className="text-gray-600">
          {message}
        </Text>
        {actions && <div className="mt-6 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>,
    document.body,
  )
}
