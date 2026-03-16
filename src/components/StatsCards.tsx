'use client'

import { StatsSummary } from '@/lib/types'
import { Card } from './Card'
import { Activity, Box, Power, Coins } from 'lucide-react'

interface StatsCardsProps {
  stats: StatsSummary | null
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Agents',
      value: stats?.total_agents ?? 0,
      icon: Box,
      color: 'text-blue-400',
    },
    {
      title: 'Online',
      value: stats?.online_agents ?? 0,
      icon: Activity,
      color: 'text-primary',
    },
    {
      title: 'Enabled',
      value: stats?.enabled_agents ?? 0,
      icon: Power,
      color: 'text-yellow-400',
    },
    {
      title: 'Total Tokens',
      value: ((stats?.total_input_tokens ?? 0) + (stats?.total_output_tokens ?? 0)).toLocaleString(),
      icon: Coins,
      color: 'text-purple-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{card.title}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
            <card.icon className={`w-10 h-10 ${card.color}`} />
          </div>
        </Card>
      ))}
    </div>
  )
}