'use client'

import { updateMovieStatusAction } from './actions'

const STATUSES = ['scheduled', 'released', 'cancelled'] as const

export function MovieStatusSelect({
  movieId,
  currentStatus,
}: {
  movieId: string
  currentStatus: string
}) {
  return (
    <div className="flex gap-1">
      {STATUSES.map((s) => {
        const isCurrent = s === currentStatus
        return (
          <form key={s} action={updateMovieStatusAction.bind(null, movieId)}>
            <input type="hidden" name="status" value={s} />
            <button
              type="submit"
              disabled={isCurrent}
              className={`text-xs px-2 py-1 rounded border ${
                isCurrent
                  ? 'bg-blue-100 border-blue-400 cursor-default text-blue-900'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          </form>
        )
      })}
    </div>
  )
}