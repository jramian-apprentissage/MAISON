import { useCurrency } from '@/lib/currency'
import Link from 'next/link'

export function HeroBudgetCard({
  budgetTotal,
  spent,
}: {
  budgetTotal: number
  spent: number
}) {
  const { format } = useCurrency()
  const hasBudget = budgetTotal > 0
  const remaining = budgetTotal - spent
  const percent = hasBudget ? Math.min(Math.max((spent / budgetTotal) * 100, 0), 100) : 0

  return (
    <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1A2C6B] via-[#2A3F9F] to-[#4169E1] p-8 text-white shadow-[0_8px_40px_rgba(65,105,225,0.25)] md:min-h-[420px] md:p-10">
      <div>
        {hasBudget ? (
          <>
            <p className="text-base text-white/80">Il vous reste</p>
            <p className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
              {format(Math.max(remaining, 0))}
            </p>
            <p className="mt-2 text-base text-white/80">avant votre limite de budget.</p>
          </>
        ) : (
          <>
            <p className="text-base text-white/80">Vous n&apos;avez pas encore defini de budget</p>
            <p className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {format(spent)} depenses ce mois-ci
            </p>
            <Link href="/dashboard/budget" className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
              Definir un budget
            </Link>
          </>
        )}
      </div>

      {hasBudget && (
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-[250ms] ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-sm text-white/80">{Math.round(percent)} % utilise</p>
        </div>
      )}
    </div>
  )
}
