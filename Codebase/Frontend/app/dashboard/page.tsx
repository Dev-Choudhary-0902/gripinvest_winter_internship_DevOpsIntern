"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, PieChart, Lightbulb, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { PortfolioChart } from "@/components/portfolio-chart"
import { Navigation } from "@/components/navigation"
import { useCurrency } from "@/components/currency-provider"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/utils"

export default function DashboardPage() {
  const { formatCurrency, convertFromINR } = useCurrency()
  const [total, setTotal] = useState(0)
  const [count, setCount] = useState(0)
  const [series, setSeries] = useState<{ month: string; value: number }[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Demo User')

  useEffect(() => {
    (async () => {
      // Get user name from localStorage or profile
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('grip-invest-token') : null
        if (token) {
          const userRes = await fetch('http://localhost:4000/api/auth/me', { 
            headers: { Authorization: `Bearer ${token}` } 
          })
          if (userRes.ok) {
            const userData = await userRes.json()
            setUserName(`${userData.firstName || 'Demo'} ${userData.lastName || 'User'}`.trim())
          }
        }
      } catch (e) {
        console.log('Could not fetch user data, using demo name')
      }

      try {
        const p = await apiFetch('/api/investments/portfolio')
        const portfolio = await p.json()
        setTotal(portfolio.total || 0)
        setCount(portfolio.count || 0)
        // Build last 6 months cumulative series from real investments (values in INR)
        const now = new Date()
        const months: { key: string; label: string; end: Date }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`
          const label = d.toLocaleString('en-US', { month: 'short' })
          months.push({ key, label, end: d })
        }
        const investments = Array.isArray(portfolio.investments) ? portfolio.investments : []
        const cumulative: number[] = []
        let running = 0
        for (const m of months) {
          const added = investments
            .filter((inv: any) => new Date(inv.investedAt) <= m.end)
            .reduce((sum: number, inv: any) => sum + Number(inv.amount || 0), 0)
          running = added
          cumulative.push(running)
        }
        let data = months.map((m, idx) => ({ month: m.label, value: cumulative[idx] }))
        const final = data.length ? data[data.length - 1].value : 0
        const totalInr = Number(portfolio.total || 0)
        if (!data.length || Math.abs(final - totalInr) > 0.01) {
          // Fallback synthetic series to match total exactly
          const ratios = [0.15, 0.3, 0.5, 0.7, 0.85, 1]
          data = months.map((m, i) => ({ month: m.label, value: Math.max(0, totalInr * ratios[i]) }))
        }
        setSeries(data)
      } catch (e) {
        console.log('Portfolio API failed, using demo data:', e)
        // Demo data fallback
        setTotal(456500)
        setCount(3)
        const now = new Date()
        const months: { key: string; label: string; end: Date }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
          const label = d.toLocaleString('en-US', { month: 'short' })
          months.push({ key: '', label, end: d })
        }
        const demoValues = [68000, 125000, 198000, 267000, 342000, 456500]
        const data = months.map((m, i) => ({ month: m.label, value: demoValues[i] }))
        setSeries(data)
      }
      try {
        const l = await apiFetch('/api/logs/user/me')
        const logs = await l.json()
        setLogs(logs)
      } catch (e) {
        console.log('Logs API failed, using demo data:', e)
        // Demo logs fallback
        setLogs([
          { id: 1, action: 'Investment', description: 'Invested in Tech Growth Fund', amount: 207500, timestamp: new Date().toISOString() },
          { id: 2, action: 'Investment', description: 'Invested in Healthcare ETF', amount: 149400, timestamp: new Date(Date.now() - 86400000).toISOString() },
          { id: 3, action: 'Investment', description: 'Invested in Energy Sector Fund', amount: 99600, timestamp: new Date(Date.now() - 172800000).toISOString() }
        ])
      }
      setLoading(false)
    })()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">Here's your investment overview for today.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                {loading ? 'Loading...' : 'Portfolio'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <div className="flex items-center text-sm text-muted-foreground">{count === 0 ? 'No investments yet' : 'Active holdings'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Returns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count === 0 ? '—' : '+8.2%'}</div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                {count === 0 ? 'Add investments to see returns' : 'Above market average'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Portfolio Performance Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>Your investment growth over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioChart data={series.map(d => ({ month: d.month, value: convertFromINR(d.value) }))} />
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 text-accent mr-2" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>Personalized recommendations for your portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Portfolio Diversification</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your portfolio shows good diversification across sectors. Consider adding more international exposure
                  to reduce regional risk.
                </p>
                <Badge variant="secondary">Risk: Moderate</Badge>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Market Opportunity</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Based on your risk appetite, we've identified 3 new investment opportunities in the technology sector.
                </p>
                <Link href="/products">
                  <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    View Recommendations
                  </Button>
                </Link>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Rebalancing Suggestion</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your equity allocation is 5% above your target. Consider rebalancing to maintain optimal risk levels.
                </p>
                <Link href="/investments">
                  <Button size="sm" variant="outline">
                    Review Portfolio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest investment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Tech Growth Fund</p>
                    <p className="text-sm text-muted-foreground">Invested {formatCurrency(207500)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">+{formatCurrency(10417)}</p>
                  <p className="text-sm text-green-600">+5.02%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Healthcare ETF</p>
                    <p className="text-sm text-muted-foreground">Invested {formatCurrency(149400)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">+{formatCurrency(6001)}</p>
                  <p className="text-sm text-green-600">+4.02%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Energy Sector Fund</p>
                    <p className="text-sm text-muted-foreground">Invested {formatCurrency(99600)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">-{formatCurrency(2042)}</p>
                  <p className="text-sm text-red-600">-2.05%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
