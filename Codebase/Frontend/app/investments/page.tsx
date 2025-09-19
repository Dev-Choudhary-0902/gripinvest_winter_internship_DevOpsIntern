"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Lightbulb } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { PortfolioAllocationChart } from "@/components/portfolio-allocation-chart"
import { useCurrency } from "@/components/currency-provider"
import { BackButton } from "@/components/back-button"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/utils"

type Inv = { id: string; amount: number; product: { name: string; riskLevel: string } }

export default function InvestmentsPage() {
  const { formatCurrency } = useCurrency()
  const [portfolio, setPortfolio] = useState<{ total: number; count: number; investments: Inv[]; breakdown: Record<string, number> }>({ total: 0, count: 0, investments: [], breakdown: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const p = await apiFetch('/api/investments/portfolio')
        const portfolio = await p.json()
        setPortfolio(portfolio)
      } catch (e: any) {
        console.log('Portfolio API failed, using demo data:', e.message)
        // Demo data fallback
        setPortfolio({
          total: 456500,
          count: 3,
          investments: [
            { id: '1', amount: 207500, product: { name: 'Tech Growth Fund', riskLevel: 'high' } },
            { id: '2', amount: 149400, product: { name: 'Healthcare ETF', riskLevel: 'moderate' } },
            { id: '3', amount: 99600, product: { name: 'Energy Sector Fund', riskLevel: 'high' } }
          ],
          breakdown: {
            'Tech Growth Fund': 207500,
            'Healthcare ETF': 149400,
            'Energy Sector Fund': 99600
          }
        })
        setError(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const totalInvested = portfolio.total
  const totalCurrentValue = portfolio.total
  const totalReturn = 0
  const totalReturnPercent = 0

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">My Portfolio</h1>
          <p className="text-muted-foreground">Track and manage your investment portfolio with detailed insights.</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalReturn)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Return %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center">
                <ArrowUpRight className="h-5 w-5 mr-1" />+{totalReturnPercent.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Portfolio Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Portfolio Allocation
              </CardTitle>
              <CardDescription>Your investment distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioAllocationChart data={Object.entries(portfolio.breakdown).map(([k, v]) => ({ name: k.toUpperCase(), value: Number(v) }))} />
            </CardContent>
          </Card>

          {/* AI Portfolio Summary (live, based on portfolio.breakdown) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 text-accent mr-2" />
                AI Portfolio Analysis
              </CardTitle>
              <CardDescription>Intelligent insights about your portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Risk Assessment</h4>
                {(() => {
                  const totalAmt = Object.values(portfolio.breakdown).reduce((s, v: any) => s + Number(v), 0)
                  const low = Number(portfolio.breakdown['low'] || 0)
                  const moderate = Number(portfolio.breakdown['moderate'] || 0)
                  const high = Number(portfolio.breakdown['high'] || 0)
                  const pct = (n: number) => (totalAmt === 0 ? 0 : Math.round((n / totalAmt) * 100))
                  const highPct = pct(high)
                  const modPct = pct(moderate)
                  const lowPct = pct(low)
                  const riskLabel = highPct >= 50 ? 'High' : highPct >= 20 ? 'Moderate' : 'Low'
                  return (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Allocation: High {highPct}% · Moderate {modPct}% · Low {lowPct}%
                      </p>
                      <Progress value={highPct} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Risk Level: {riskLabel}</p>
                    </>
                  )
                })()}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Diversification Score</h4>
                {(() => {
                  const buckets = Object.keys(portfolio.breakdown).filter(k => Number(portfolio.breakdown[k]) > 0).length
                  const score = Math.min(10, Math.max(0, buckets * 3 + (portfolio.count > 3 ? 1 : 0)))
                  return (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        {buckets === 0 ? 'No allocation yet. Invest to see insights.' : `Diversified across ${buckets} risk buckets.`}
                      </p>
                      <Badge variant="secondary">Score: {score.toFixed(1)}/10</Badge>
                    </>
                  )
                })()}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Performance Outlook</h4>
                <p className="text-sm text-muted-foreground">
                  {portfolio.count === 0
                    ? 'Add your first investment to generate performance insights.'
                    : 'Demo outlook: maintain a balanced allocation; consider adding low-risk assets to stabilize returns.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Investments */}
        <Card>
          <CardHeader>
            <CardTitle>Your Investments</CardTitle>
            <CardDescription>Detailed view of your individual holdings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && <div className="text-sm text-destructive">{error}</div>}
              {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
              {!loading && portfolio.investments.length === 0 && (
                <div className="text-sm text-muted-foreground">No investments yet.</div>
              )}
              {portfolio.investments.map((investment) => (
                <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{investment.product.name}</h4>
                      <p className="text-sm text-muted-foreground">{investment.product.riskLevel.toUpperCase()} Risk</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm">Invested: {formatCurrency(investment.amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Demo values update on invest</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Link href="/products">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Add New Investment</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
