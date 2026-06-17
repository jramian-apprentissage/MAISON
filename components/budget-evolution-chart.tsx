'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/lib/currency'

export function BudgetEvolutionChart({
  data,
}: {
  data: { label: string; budget: number; expenses: number }[]
}) {
  const { format } = useCurrency()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Budget vs depenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid vertical={false} stroke="#1A2444" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#8896B3' }}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => format(value)}
                contentStyle={{ background: '#0E1628', border: '1px solid #1A2444', borderRadius: 10, color: '#E8EDF5' }}
              />
              <Legend
                formatter={(value) => (value === 'budget' ? 'Budget' : 'Depenses')}
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: '#8896B3' }}
              />
              <Bar dataKey="budget" fill="#4169E1" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expenses" fill="#D4AF37" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
