"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { useCurrency } from "@/components/currency-provider"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/utils"

type Product = {
  id: string
  name: string
  investmentType: string
  riskLevel: string
  minInvestment: number
  annualYield: number
  description?: string
}

export default function ProductsPage() {
  const { formatCurrency } = useCurrency()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const response = await apiFetch('/api/products')
        const list = await response.json()
        setProducts(list)
      } catch (e: any) {
        console.log('API failed, using demo data:', e.message)
        // Fallback demo data
        setProducts([
          {
            id: '1',
            name: 'Tech Growth Fund',
            investmentType: 'mutual_fund',
            riskLevel: 'high',
            minInvestment: 5000,
            annualYield: 12.5,
            description: 'High-growth technology companies with strong fundamentals and innovative products.'
          },
          {
            id: '2',
            name: 'Healthcare ETF',
            investmentType: 'etf',
            riskLevel: 'moderate',
            minInvestment: 3000,
            annualYield: 8.2,
            description: 'Diversified healthcare sector including pharmaceuticals, biotech, and medical devices.'
          },
          {
            id: '3',
            name: 'Government Bonds',
            investmentType: 'bond',
            riskLevel: 'low',
            minInvestment: 1000,
            annualYield: 6.8,
            description: 'Secure government-backed bonds with guaranteed returns and low risk.'
          },
          {
            id: '4',
            name: 'Real Estate REIT',
            investmentType: 'reit',
            riskLevel: 'moderate',
            minInvestment: 2500,
            annualYield: 9.1,
            description: 'Real estate investment trust focusing on commercial properties and rental income.'
          },
          {
            id: '5',
            name: 'International Equity',
            investmentType: 'mutual_fund',
            riskLevel: 'high',
            minInvestment: 7500,
            annualYield: 11.3,
            description: 'Global equity fund investing in international markets for diversification.'
          },
          {
            id: '6',
            name: 'Fixed Deposit Plus',
            investmentType: 'fd',
            riskLevel: 'low',
            minInvestment: 10000,
            annualYield: 7.5,
            description: 'High-yield fixed deposit with flexible tenure options and guaranteed returns.'
          }
        ])
        setError(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">Investment Products</h1>
          <p className="text-muted-foreground">
            Discover and invest in our curated selection of investment opportunities.
          </p>
        </div>

        {/* AI Recommendations Banner */}
        <Card className="mb-8 bg-accent/5 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 text-accent mr-2" />
              AI Recommendations for You
            </CardTitle>
            <CardDescription>
              Based on your moderate risk appetite and investment history, we've identified these opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              View Personalized Recommendations
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search products..." className="pl-10" />
          </div>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="energy">Energy</SelectItem>
              <SelectItem value="real-estate">Real Estate</SelectItem>
              <SelectItem value="international">International</SelectItem>
              <SelectItem value="fixed-income">Fixed Income</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && <div className="text-sm text-muted-foreground">Loading products...</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}
          {!loading && !error && products.map((product) => (
            <Card key={product.id} className="relative">

              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="text-sm">{product.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{product.investmentType.toUpperCase()}</Badge>
                  <Badge
                    variant={
                      product.riskLevel === "high"
                        ? "destructive"
                        : product.riskLevel === "moderate"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {product.riskLevel.toUpperCase()} Risk
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min Investment:</span>
                    <span className="font-medium">{formatCurrency(product.minInvestment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Annual Yield (est):</span>
                    <span className="font-medium">{product.annualYield}%</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Link href={`/investments/invest/${product.id}`} className="flex-1">
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Invest Now</Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
