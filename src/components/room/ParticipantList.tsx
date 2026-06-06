import type { Participant } from '@/types/domain'

const ROLE_LABELS: Record<Participant['role'], string> = {
  host: 'ホスト',
  representative: '代表者',
  voter: '参加者',
}

const ROLE_COLORS: Record<Participant['role'], string> = {
  host: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  representative: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  voter: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
}

interface Props {
  participants: Participant[]
  currentParticipantId?: string | null
}

export function ParticipantList({ participants, currentParticipantId }: Props) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="参加者一覧">
      {participants.map((p) => (
        <li
          key={p.id}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border text-sm
            ${p.id === currentParticipantId ? 'ring-2 ring-amber-500/50' : ''}`}
        >
          <span className="text-slate-200 font-medium">{p.nickname}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-md border ${ROLE_COLORS[p.role]}`}>
            {ROLE_LABELS[p.role]}
          </span>
        </li>
      ))}
    </ul>
  )
}
