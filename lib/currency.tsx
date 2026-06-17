'use client'

import { createContext, useContext, type ReactNode } from 'react'

const CURRENCY_SYMBOLS: Record<string, string> = {
  MGA: 'Ar',
  EUR: '€',
  USD: '$',
}

export function formatCurrency(amount: number, currency: string) {
  const n = Number.isFinite(amount) ? amount : 0
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  return (
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) +
    ' ' +
    symbol
  )
}

const CurrencyContext = createContext<string>('MGA')

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string
  children: ReactNode
}) {
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const currency = useContext(CurrencyContext)
  return {
    currency,
    format: (amount: number) => formatCurrency(amount, currency),
  }
}
