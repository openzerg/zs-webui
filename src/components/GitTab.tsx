'use client'

import { useState } from 'react'
import { Agent } from '@/lib/types'
import { GitAccountsTab } from '@/components/GitAccountsTab'
import { GitReposTab } from '@/components/GitReposTab'
import { GitOrgsTab } from '@/components/GitOrgsTab'
import { Users, GitBranch, Building } from 'lucide-react'

interface GitTabProps {
  agents: Agent[]
}

type GitSubTab = 'accounts' | 'repos' | 'orgs'

export function GitTab({ agents }: GitTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<GitSubTab>('accounts')

  const subTabs: { id: GitSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'accounts', label: 'Accounts', icon: <Users className="w-4 h-4" /> },
    { id: 'repos', label: 'Repos', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'orgs', label: 'Orgs', icon: <Building className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t transition ${
              activeSubTab === tab.id
                ? 'bg-dark-light text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'accounts' && <GitAccountsTab agents={agents} />}
      {activeSubTab === 'repos' && <GitReposTab />}
      {activeSubTab === 'orgs' && <GitOrgsTab />}
    </div>
  )
}