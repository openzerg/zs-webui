'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
}

export function Button({ variant = 'primary', size = 'md', className, children, isLoading, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center',
        {
          'px-4 py-2': size === 'md',
          'px-2 py-1 text-sm': size === 'sm',
          'px-6 py-3 text-lg': size === 'lg',
        },
        {
          'bg-primary text-dark hover:bg-primary-dark': variant === 'primary',
          'bg-blue-500 text-white hover:bg-blue-600': variant === 'secondary',
          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
          'bg-yellow-500 text-dark hover:bg-yellow-600': variant === 'warning',
        },
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="animate-spin mr-2">⏳</span> : null}
      {children}
    </button>
  )
}