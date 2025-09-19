"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useCurrency } from "./currency-provider"

const data = [
  { month: "Jan", value: 18500 },
  { month: "Feb", value: 19200 },
  { month: "Mar", value: 20100 },
  { month: "Apr", value: 21800 },
  { month: "May", value: 23200 },
  { month: "Jun", value: 24580 },
]

type Point = { month: string; value: number }

export function PortfolioChart({ data: customData }: { data?: Point[] }) {
  const { currentCurrency } = useCurrency()

  const formatSelected = (value: number) => {
    const fractionDigits = currentCurrency.code === "JPY" ? 0 : 2
    return `${currentCurrency.symbol}${Number(value).toLocaleString("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={customData ?? data}>
        <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
        <YAxis
          axisLine={false}
          tickLine={false}
          className="text-xs"
          tickFormatter={(value) => {
            return formatSelected(Number(value))
          }}
        />
        <Tooltip
          formatter={(value) => [formatSelected(Number(value)), "Portfolio Value"]}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--accent))"
          strokeWidth={3}
          dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "hsl(var(--accent))", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
