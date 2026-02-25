'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function MonthSelector({
  year,
  month,
  onChange,
}: {
  year: number
  month: number // 1-12
  onChange: (year: number, month: number) => void
}) {
  const label = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))

  const goPrev = () => {
    const m = month - 1
    if (m < 1) onChange(year - 1, 12)
    else onChange(year, m)
  }

  const goNext = () => {
    const m = month + 1
    if (m > 12) onChange(year + 1, 1)
    else onChange(year, m)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={goPrev}
        aria-label="Mois précédent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-[140px] text-center text-sm font-medium capitalize">
        {label}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={goNext}
        aria-label="Mois suivant"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
