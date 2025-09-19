import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertCircle, CheckCircle, Clock, Lightbulb } from "lucide-react"
import { Navigation } from "@/components/navigation"

const logs = [
  {
    id: 1,
    timestamp: "2024-01-15 14:30:25",
    endpoint: "POST /api/investments",
    status: "success",
    statusCode: 200,
    message: "Investment created successfully",
    userId: "user_123",
    details: "Invested $2,500 in Tech Growth Fund",
  },
  {
    id: 2,
    timestamp: "2024-01-15 14:28:15",
    endpoint: "GET /api/products/recommendations",
    status: "success",
    statusCode: 200,
    message: "AI recommendations generated",
    userId: "user_123",
    details: "Generated 5 personalized recommendations",
  },
  {
    id: 3,
    timestamp: "2024-01-15 14:25:10",
    endpoint: "POST /api/auth/login",
    status: "success",
    statusCode: 200,
    message: "User login successful",
    userId: "user_123",
    details: "Login from IP: 192.168.1.100",
  },
  {
    id: 4,
    timestamp: "2024-01-15 14:20:45",
    endpoint: "GET /api/investments/portfolio",
    status: "error",
    statusCode: 500,
    message: "Database connection timeout",
    userId: "user_456",
    details: "Failed to fetch portfolio data",
  },
  {
    id: 5,
    timestamp: "2024-01-15 14:18:30",
    endpoint: "PUT /api/products/123",
    status: "error",
    statusCode: 403,
    message: "Insufficient permissions",
    userId: "user_789",
    details: "User attempted to update product without admin role",
  },
  {
    id: 6,
    timestamp: "2024-01-15 14:15:20",
    endpoint: "POST /api/investments",
    status: "error",
    statusCode: 400,
    message: "Insufficient balance",
    userId: "user_456",
    details: "Attempted to invest $5,000 with balance of $3,200",
  },
  {
    id: 7,
    timestamp: "2024-01-15 14:12:10",
    endpoint: "GET /api/products",
    status: "success",
    statusCode: 200,
    message: "Products fetched successfully",
    userId: "user_123",
    details: "Retrieved 12 investment products",
  },
  {
    id: 8,
    timestamp: "2024-01-15 14:10:05",
    endpoint: "POST /api/auth/signup",
    status: "success",
    statusCode: 201,
    message: "User registration successful",
    userId: "user_999",
    details: "New user registered with email verification",
  },
]

export default function LogsPage() {
  const errorLogs = logs.filter((log) => log.status === "error")
  const successRate = (((logs.length - errorLogs.length) / logs.length) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">Transaction Logs</h1>
          <p className="text-muted-foreground">Monitor all API calls and system activities with detailed logging.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{successRate}%</div>
              <p className="text-xs text-muted-foreground">API reliability</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Error Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{errorLogs.length}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Unique users today</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Error Summary */}
        <Card className="mb-8 bg-accent/5 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 text-accent mr-2" />
              AI Error Analysis
            </CardTitle>
            <CardDescription>Intelligent summary of system errors and recommended actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Critical Issues Detected</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Database connection timeouts are affecting 12.5% of portfolio requests. Consider implementing connection
                pooling and retry logic.
              </p>
              <Badge variant="destructive">High Priority</Badge>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Security Alerts</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Multiple unauthorized access attempts detected. Review user permissions and consider implementing rate
                limiting.
              </p>
              <Badge variant="secondary">Medium Priority</Badge>
            </div>

            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">View Detailed AI Report</Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search logs..." className="pl-10" />
          </div>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Endpoint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Endpoints</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
              <SelectItem value="investments">Investments</SelectItem>
              <SelectItem value="products">Products</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Detailed transaction logs with status and error information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full">
                      {log.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{log.endpoint}</span>
                        <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.statusCode}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.message}</p>
                      <p className="text-xs text-muted-foreground">{log.details}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {log.timestamp}
                    </div>
                    <p className="text-xs text-muted-foreground">User: {log.userId}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
