'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-dark-lighter rounded-xl p-6', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold text-primary">{children}</h3>
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}