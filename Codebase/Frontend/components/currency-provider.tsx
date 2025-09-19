"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Currency = {
  code: string
  symbol: string
  name: string
  rate: number // Rate relative to INR
}

const currencies: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 1 },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 0.012 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.011 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.0095 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 1.8 },
]

type CurrencyContextType = {
  currentCurrency: Currency
  currencies: Currency[]
  setCurrency: (currency: Currency) => void
  convertFromINR: (amount: number) => number
  convertToINR: (amount: number) => number
  formatCurrency: (amount: number) => string
  getMinimumInvestment: () => number
  isReady: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(currencies[0]) // Default to INR
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved currency from localStorage
    const savedCurrency = localStorage.getItem("grip-invest-currency")
    if (savedCurrency) {
      const currency = currencies.find((c) => c.code === savedCurrency)
      if (currency) {
        setCurrentCurrency(currency)
      }
    }
  }, [])

  const setCurrency = (currency: Currency) => {
    setCurrentCurrency(currency)
    if (mounted) {
      localStorage.setItem("grip-invest-currency", currency.code)
    }
  }

  const convertFromINR = (amount: number): number => {
    return amount * currentCurrency.rate
  }

  const convertToINR = (amount: number): number => {
    return amount / currentCurrency.rate
  }

  const formatCurrency = (amount: number): string => {
    const convertedAmount = convertFromINR(amount)
    // Use consistent server+client formatting to avoid hydration mismatch
    const fractionDigits = currentCurrency.code === "JPY" ? 0 : 2
    return `${currentCurrency.symbol}${convertedAmount.toLocaleString("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`
  }

  const getMinimumInvestment = (): number => {
    // Minimum is always 100 INR equivalent
    return convertFromINR(100)
  }

  if (!mounted) {
    return (
      <CurrencyContext.Provider
        value={{
          currentCurrency: currencies[0], // Always default to INR during SSR
          currencies,
          setCurrency: () => {},
          convertFromINR: (amount: number) => amount,
          convertToINR: (amount: number) => amount,
          formatCurrency: (amount: number) => `₹${amount.toLocaleString("en-US")}`,
          getMinimumInvestment: () => 100,
          isReady: false,
        }}
      >
        {children}
      </CurrencyContext.Provider>
    )
  }

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        currencies,
        setCurrency,
        convertFromINR,
        convertToINR,
        formatCurrency,
        getMinimumInvestment,
        isReady: true,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
