"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw, DollarSign } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { Navigation } from "@/components/navigation"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/utils"

type Log = { id: number; endpoint: string; httpMethod: string; statusCode: number; createdAt: string }
type Investment = { 
  id: string; 
  amount: number; 
  investedAt: string; 
  status: string; 
  expectedReturn: number; 
  product: { 
    name: string; 
    riskLevel: string; 
    annualYield: number 
  } 
}

// Live insights are computed from logs below

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-600" />
  }
}

function getStatusBadge(status: string) {
  const variants = {
    completed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  }

  return (
    <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export default function TransactionsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [filteredInvestments, setFilteredInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"transactions" | "logs">("transactions")

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching transaction data...');
        
        // Fetch investment transactions
        const investmentsResponse = await apiFetch('/api/investments/portfolio')
        if (investmentsResponse.ok) {
          const portfolioData = await investmentsResponse.json()
          setInvestments(portfolioData.investments || [])
          setFilteredInvestments(portfolioData.investments || [])
        }
        
        // Fetch API logs
        const logsResponse = await apiFetch('/api/logs/user/me')
        if (logsResponse.ok) {
          const logsData = await logsResponse.json()
          setLogs(logsData)
        }
      } catch (e: any) {
        console.error('Error fetching data:', e);
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter data based on search and filters
  useEffect(() => {
    if (activeTab === "transactions") {
      let filtered = investments

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(investment => 
          investment.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          investment.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter(investment => investment.status === statusFilter)
      }

      // Type filter (for investments, this is risk level)
      if (typeFilter !== "all") {
        filtered = filtered.filter(investment => investment.product.riskLevel === typeFilter)
      }

      setFilteredInvestments(filtered)
    } else {
      let filtered = logs

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(log => 
          log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.httpMethod.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter(log => {
          const status = log.statusCode < 400 ? 'completed' : log.statusCode < 500 ? 'pending' : 'failed'
          return status === statusFilter
        })
      }

      // Type filter
      if (typeFilter !== "all") {
        filtered = filtered.filter(log => {
          if (typeFilter === "investment") return log.endpoint.includes('/investments')
          if (typeFilter === "auth") return log.endpoint.includes('/auth')
          if (typeFilter === "products") return log.endpoint.includes('/products')
          if (typeFilter === "logs") return log.endpoint.includes('/logs')
          return true
        })
      }

      setFilteredLogs(filtered)
    }
  }, [investments, logs, searchTerm, statusFilter, typeFilter, activeTab])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // Fetch both investment transactions and logs
      const [investmentsResponse, logsResponse] = await Promise.all([
        apiFetch('/api/investments/portfolio'),
        apiFetch('/api/logs/user/me')
      ])
      
      if (investmentsResponse.ok) {
        const portfolioData = await investmentsResponse.json()
        setInvestments(portfolioData.investments || [])
        setFilteredInvestments(portfolioData.investments || [])
      }
      
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setLogs(logsData)
      }
    } catch (e: any) {
      console.error('Error refreshing data:', e)
      setError(e.message)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
              <p className="text-gray-600">Monitor all your investment activities and system logs</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            <Button
              variant={activeTab === "transactions" ? "default" : "outline"}
              onClick={() => setActiveTab("transactions")}
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Investment Transactions
            </Button>
            <Button
              variant={activeTab === "logs" ? "default" : "outline"}
              onClick={() => setActiveTab("logs")}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              System Logs
            </Button>
          </div>
        </div>

        {/* AI Insights Card */}
        <Card className="mb-8 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-violet-900">
              <AlertTriangle className="h-5 w-5" />
              AI Transaction Analysis
            </CardTitle>
            <CardDescription>Intelligent insights from your transaction patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {activeTab === "transactions" ? (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600">{filteredInvestments.length}</div>
                    <div className="text-sm text-gray-600">Total Investments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredInvestments.length === 0 ? 0 : 
                        Math.round((filteredInvestments.filter(i => i.status === 'active').length / filteredInvestments.length) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Active Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {new Set(filteredInvestments.map(i => i.product.riskLevel)).size}
                    </div>
                    <div className="text-sm text-gray-600">Risk Levels</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600">{filteredLogs.length}</div>
                    <div className="text-sm text-gray-600">Total API Calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{filteredLogs.length === 0 ? 0 : Math.round((filteredLogs.filter(l => l.statusCode < 400).length / filteredLogs.length) * 100)}%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{new Set(filteredLogs.filter(l => l.statusCode >= 400).map(l => l.statusCode)).size}</div>
                    <div className="text-sm text-gray-600">Error Types</div>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Common Issues</h4>
                <ul className="space-y-1">
                  {activeTab === "logs" ? (
                    <>
                      {Array.from(new Map(filteredLogs.filter(l => l.statusCode >= 400).map(l => [l.statusCode, 0])).keys()).slice(0,3).map((code) => (
                        <li key={String(code)} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                          HTTP {String(code)} errors
                        </li>
                      ))}
                      {filteredLogs.filter(l => l.statusCode >= 400).length === 0 && (
                        <li className="text-sm text-gray-600">No errors recorded.</li>
                      )}
                    </>
                  ) : (
                    <>
                      {Array.from(new Map(filteredInvestments.filter(i => i.status === 'cancelled').map(i => [i.status, 0])).keys()).slice(0,3).map((status) => (
                        <li key={String(status)} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                          {status} investments
                        </li>
                      ))}
                      {filteredInvestments.filter(i => i.status === 'cancelled').length === 0 && (
                        <li className="text-sm text-gray-600">No issues recorded.</li>
                      )}
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Recommendations</h4>
                <ul className="space-y-1">
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                    Keep API requests minimal and avoid repeated retries.
                  </li>
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                    Review failed requests in the table below and retry.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Search transactions..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={activeTab === "transactions" ? "Risk Level" : "Transaction Type"} />
                </SelectTrigger>
                <SelectContent>
                  {activeTab === "transactions" ? (
                    <>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="moderate">Moderate Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="logs">Logs</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {activeTab === "transactions" ? (
                    <>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="matured">Matured</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "transactions" ? "Investment Transactions" : "System Logs"}
            </CardTitle>
            <CardDescription>
              {activeTab === "transactions" 
                ? "Complete log of all your investment activities" 
                : "Complete log of all your system activities"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === "transactions" ? (
                    <>
                      <TableHead>Investment ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Log ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Date</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {error && (
                  <TableRow><TableCell colSpan={7} className="text-destructive text-sm">{error}</TableCell></TableRow>
                )}
                {loading && (
                  <TableRow><TableCell colSpan={7} className="text-sm text-muted-foreground">Loading...</TableCell></TableRow>
                )}
                {!loading && activeTab === "transactions" && filteredInvestments.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-sm text-muted-foreground">No investment transactions found.</TableCell></TableRow>
                )}
                {!loading && activeTab === "logs" && filteredLogs.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-sm text-muted-foreground">No system logs found.</TableCell></TableRow>
                )}
                
                {/* Investment Transactions */}
                {activeTab === "transactions" && filteredInvestments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">#{investment.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{investment.product.name}</TableCell>
                    <TableCell className="font-medium">₹{investment.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">₹{investment.expectedReturn.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={investment.product.riskLevel === "high" ? "destructive" : investment.product.riskLevel === "moderate" ? "default" : "secondary"}>
                        {investment.product.riskLevel.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(investment.status)}
                        {getStatusBadge(investment.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(investment.investedAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* System Logs */}
                {activeTab === "logs" && filteredLogs.map((log) => {
                  const getTransactionType = (endpoint: string) => {
                    if (endpoint.includes('/investments')) return 'Investment'
                    if (endpoint.includes('/auth')) return 'Authentication'
                    if (endpoint.includes('/products')) return 'Product'
                    if (endpoint.includes('/logs')) return 'Log'
                    return 'API'
                  }
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">#{log.id}</TableCell>
                      <TableCell>{getTransactionType(log.endpoint)}</TableCell>
                      <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                      <TableCell className="font-mono text-sm">{log.httpMethod}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.statusCode < 400 ? 'completed' : log.statusCode < 500 ? 'pending' : 'failed')}
                          {getStatusBadge(log.statusCode < 400 ? 'completed' : log.statusCode < 500 ? 'pending' : 'failed')}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.statusCode}</TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
