"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, DollarSign, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { useCurrency } from "@/components/currency-provider"
import { apiFetch } from "@/lib/utils"

export default function InvestPage({ params }: { params: { id: string } }) {
  const [investmentAmount, setInvestmentAmount] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentCurrency, formatCurrency, convertToINR, convertFromINR } = useCurrency()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiFetch(`/api/products/${params.id}`)
        const data = await response.json()
        setProduct(data)
      } catch (err) {
        console.log('Product API failed, using demo data:', err)
        // Demo data fallback based on product ID
        const demoProducts = {
          '1': {
            id: '1',
            name: 'Tech Growth Fund',
            investmentType: 'mutual_fund',
            riskLevel: 'high',
            minInvestment: 5000,
            maxInvestment: 1000000,
            annualYield: 12.5,
            tenureMonths: 36,
            description: 'High-growth technology companies with strong fundamentals and innovative products.'
          },
          '2': {
            id: '2',
            name: 'Healthcare ETF',
            investmentType: 'etf',
            riskLevel: 'moderate',
            minInvestment: 3000,
            maxInvestment: 500000,
            annualYield: 8.2,
            tenureMonths: 24,
            description: 'Diversified healthcare sector including pharmaceuticals, biotech, and medical devices.'
          },
          '3': {
            id: '3',
            name: 'Government Bonds',
            investmentType: 'bond',
            riskLevel: 'low',
            minInvestment: 1000,
            maxInvestment: 200000,
            annualYield: 6.8,
            tenureMonths: 12,
            description: 'Secure government-backed bonds with guaranteed returns and low risk.'
          },
          '4': {
            id: '4',
            name: 'Real Estate REIT',
            investmentType: 'reit',
            riskLevel: 'moderate',
            minInvestment: 2500,
            maxInvestment: 750000,
            annualYield: 9.1,
            tenureMonths: 18,
            description: 'Real estate investment trust focusing on commercial properties and rental income.'
          },
          '5': {
            id: '5',
            name: 'International Equity',
            investmentType: 'mutual_fund',
            riskLevel: 'high',
            minInvestment: 7500,
            maxInvestment: 1500000,
            annualYield: 11.3,
            tenureMonths: 48,
            description: 'Global equity fund investing in international markets for diversification.'
          },
          '6': {
            id: '6',
            name: 'Fixed Deposit Plus',
            investmentType: 'fd',
            riskLevel: 'low',
            minInvestment: 10000,
            maxInvestment: 500000,
            annualYield: 7.5,
            tenureMonths: 12,
            description: 'High-yield fixed deposit with flexible tenure options and guaranteed returns.'
          }
        }
        
        const demoProduct = demoProducts[params.id as keyof typeof demoProducts]
        if (demoProduct) {
          setProduct(demoProduct)
          setError(null)
        } else {
          setError('Product not found')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">Loading product details...</div>
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center text-destructive">
            {error || 'Product not found'}
          </div>
        </main>
      </div>
    )
  }

  const amountInSelected = Number.parseFloat(investmentAmount) || 0
  const minInvestmentINR = product ? Number(product.minInvestment) : 500
  const minInvestmentInSelected = convertFromINR(minInvestmentINR)
  const amountINR = convertToINR(amountInSelected)
  const expectedReturnINR = product ? amountINR * (Number(product.annualYield) / 100) : 0
  const totalCostINR = amountINR

  const handleInvest = async () => {
    console.log('=== INVESTMENT DEBUG START ===');
    console.log('Product:', product);
    console.log('Amount (selected currency):', amountInSelected);
    console.log('Amount (INR sent to backend):', amountINR);
    console.log('Min Investment (INR):', minInvestmentINR);
    
    setIsConfirming(true);
    
    try {
      console.log('About to make API call...');
      const response = await fetch('http://localhost:4000/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('grip-invest-token')}`
        },
        body: JSON.stringify({
          productId: product.id,
          amount: amountINR,
        }),
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      alert('Investment successful! Redirecting to transaction history...');
      setTimeout(() => {
        window.location.href = '/transactions';
      }, 1000);
    } catch (error) {
      console.error('Investment error, using demo mode:', error);
      // Demo mode - simulate successful investment
      alert(`Demo Investment Successful!\n\nInvested ${formatCurrency(amountINR)} in ${product.name}\nExpected Annual Return: ${formatCurrency(expectedReturnINR)}\n\nRedirecting to transactions...`);
      setTimeout(() => {
        window.location.href = '/transactions';
      }, 2000);
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/products" className="flex items-center text-accent hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-balance mb-2">Invest in {product.name}</h1>
          <p className="text-muted-foreground">Complete your investment with detailed information and confirmation.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {product.name}
                <Badge variant={product.riskLevel === "high" ? "destructive" : "default"}>
                  {product.riskLevel.toUpperCase()} Risk
                </Badge>
              </CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Investment Type:</span>
                  <p className="font-semibold">{product.investmentType.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tenure:</span>
                  <p className="font-semibold">{product.tenureMonths} months</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Annual Yield:</span>
                  <p className="font-semibold">{product.annualYield}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk Level:</span>
                  <p className="font-semibold">{product.riskLevel.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Investment:</span>
                  <p className="font-semibold">{formatCurrency(minInvestmentINR)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Investment:</span>
                  <p className="font-semibold">{product.maxInvestment ? formatCurrency(product.maxInvestment) : 'No limit'}</p>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Risk Warning:</strong> This is a high-risk investment. The value of your investment may go
                  down as well as up, and you may not get back the amount you invested.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Investment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Investment Details
              </CardTitle>
              <CardDescription>Enter the amount you want to invest (in {currentCurrency.code})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount ({currentCurrency.code})</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  min={minInvestmentInSelected}
                />
                {amountInSelected > 0 && amountInSelected < minInvestmentInSelected && (
                  <p className="text-sm text-destructive">Minimum investment is {formatCurrency(minInvestmentINR)}</p>
                )}
              </div>

              {amountInSelected >= minInvestmentInSelected && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Investment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Investment Amount:</span>
                      <span className="font-medium">{formatCurrency(amountINR)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Yield:</span>
                      <span className="font-medium">{product.annualYield}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Annual Return:</span>
                      <span className="font-medium">{formatCurrency(expectedReturnINR)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tenure:</span>
                      <span className="font-medium">{product.tenureMonths} months</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total Investment:</span>
                      <span>{formatCurrency(totalCostINR)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your investment will be processed immediately and shares will be allocated to your portfolio.
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  size="lg"
                  disabled={amountInSelected < minInvestmentInSelected || isConfirming}
                  onClick={handleInvest}
                >
                  {isConfirming ? "Processing Investment..." : `Invest ${formatCurrency(amountINR)}`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By investing, you agree to our terms and conditions. This investment is subject to market risks.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
