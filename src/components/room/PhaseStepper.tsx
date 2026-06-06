import type { Phase } from '@/types/domain'

interface PhaseStep {
  key: Phase
  label: string
  emoji: string
}

const STEPS: PhaseStep[] = [
  { key: 'waiting', label: '集合', emoji: '👥' },
  { key: 'representatives', label: '代表', emoji: '⭐' },
  { key: 'restaurants', label: 'お店', emoji: '🍜' },
  { key: 'voting', label: '参加', emoji: '🙋' },
  { key: 'finished', label: '決定', emoji: '🎉' },
]

const PHASE_INDEX: Record<Phase, number> = {
  waiting: 0,
  representatives: 1,
  restaurants: 2,
  voting: 3,
  order: 3,
  finished: 4,
}

interface Props {
  phase: Phase
}

export function PhaseStepper({ phase }: Props) {
  const currentIndex = PHASE_INDEX[phase]

  return (
    <nav aria-label="進捗" className="flex items-center justify-between w-full">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex

        return (
          <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
                ${isCurrent ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' : ''}
                ${isDone ? 'bg-green-600/20 text-green-400' : ''}
                ${!isCurrent && !isDone ? 'bg-slate-800 text-slate-500' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isDone ? '✓' : step.emoji}
            </div>
            <span className={`text-[10px] hidden sm:block ${isCurrent ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
