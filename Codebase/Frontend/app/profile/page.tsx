"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Settings, Shield, Bell, CreditCard, TrendingUp, DollarSign, PieChart } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { BackButton } from "@/components/back-button"
import { useCurrency } from "@/components/currency-provider"
import { apiFetch } from "@/lib/utils"
import { LogOut } from "lucide-react"

export default function ProfilePage() {
  const { formatCurrency } = useCurrency()
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    riskAppetite: "moderate" as "low" | "moderate" | "high",
    investmentGoal: "",
    monthlyInvestment: "",
  })
  
  const [portfolioData, setPortfolioData] = useState({
    total: 0,
    count: 0,
    expectedTotalReturn: 0,
    diversificationScore: 0,
    breakdown: {} as Record<string, number>
  })
  
  const [loading, setLoading] = useState(true)
  const [memberSince, setMemberSince] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [show2FADisableModal, setShow2FADisableModal] = useState(false)
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false)
  const [loginHistory, setLoginHistory] = useState<any[]>([])
  
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('grip-invest-token')
      alert('Logged out successfully!')
      window.location.href = '/auth/login'
    }
  }

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:4000/health', { 
        method: 'GET',
        timeout: 3000 
      })
      return response.ok
    } catch (error) {
      console.log('Backend health check failed:', error)
      return false
    }
  }
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [twoFactorData, setTwoFactorData] = useState({
    qrCode: '',
    secret: '',
    token: '',
    isEnabled: false
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('grip-invest-token') : null
        if (!token) {
          console.log('No authentication token found. Using demo data.')
          // Use demo data when no token is found
          setProfileData(prev => ({ 
            ...prev, 
            firstName: 'Demo', 
            lastName: 'User', 
            email: 'demo@gmail.com', 
            phone: '+1 (555) 123-4567',
            riskAppetite: 'moderate',
            investmentGoal: 'Retirement Planning',
            monthlyInvestment: '5000'
          }))
          setMemberSince('Jan 2024')
          setLoading(false)
          return
        }

        // For demo purposes, if backend is not available, use demo data
        const isBackendAvailable = await checkBackendHealth()
        
        if (!isBackendAvailable) {
          console.log('Backend not available, using demo data')
          setProfileData(prev => ({ 
            ...prev, 
            firstName: 'Demo', 
            lastName: 'User', 
            email: 'demo@gmail.com', 
            phone: '+1 (555) 123-4567',
            riskAppetite: 'moderate',
            investmentGoal: 'Retirement Planning',
            monthlyInvestment: '5000'
          }))
          setMemberSince('Jan 2024')
          setLoading(false)
          return
        }

        // Fetch user profile
        console.log('Fetching user data with token:', token.substring(0, 20) + '...')
        const userRes = await fetch('http://localhost:4000/api/auth/me', { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        
        console.log('User API response status:', userRes.status)
        
        if (userRes.ok) {
          const userData = await userRes.json()
          console.log('User data received:', userData)
          setProfileData(prev => ({ 
            ...prev, 
            firstName: userData.firstName || '', 
            lastName: userData.lastName || '', 
            email: userData.email || '', 
            phone: userData.phone || '',
            riskAppetite: userData.riskAppetite || 'moderate',
            investmentGoal: userData.investmentGoal || '',
            monthlyInvestment: userData.monthlyInvestment || ''
          }))
          
          // Set member since date (assuming user creation date)
          setMemberSince(new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          }))
        } else {
          const errorData = await userRes.json()
          console.error('User API error:', errorData)
          
          // Fallback to demo data if API fails
          setProfileData(prev => ({ 
            ...prev, 
            firstName: 'Demo', 
            lastName: 'User', 
            email: 'demo@gmail.com', 
            phone: '+1 (555) 123-4567',
            riskAppetite: 'moderate',
            investmentGoal: 'Retirement Planning',
            monthlyInvestment: '5000'
          }))
          setMemberSince('Jan 2024')
        }

        // Fetch portfolio data
        const portfolioRes = await apiFetch('/api/investments/portfolio')
        if (portfolioRes.ok) {
          const portfolio = await portfolioRes.json()
          setPortfolioData({
            total: portfolio.total || 0,
            count: portfolio.count || 0,
            expectedTotalReturn: portfolio.expectedTotalReturn || 0,
            diversificationScore: portfolio.diversificationScore || 0,
            breakdown: portfolio.breakdown || {}
          })
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Check 2FA status
  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const token = localStorage.getItem('grip-invest-token')
        if (!token) return

        const response = await fetch('http://localhost:4000/api/auth/2fa/status', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setTwoFactorData(prev => ({ ...prev, isEnabled: data.enabled }))
        }
      } catch (error) {
        console.error('Error checking 2FA status:', error)
      }
    }

    check2FAStatus()
  }, [])

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = localStorage.getItem('grip-invest-token')
        if (!token) return

        const response = await fetch('http://localhost:4000/api/auth/preferences', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setPreferences(data.preferences)
        }
      } catch (error) {
        console.error('Error fetching preferences:', error)
      }
    }

    fetchPreferences()
  }, [])

  const handleSavePersonalInfo = async () => {
    setSaving(true)
    setSaveMessage(null)
    
    try {
      const token = localStorage.getItem('grip-invest-token')
      if (!token) {
        setSaveMessage({ type: 'error', text: 'Please log in to update your profile' })
        return
      }

      const response = await fetch('http://localhost:4000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone
        })
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Personal information updated successfully!' })
        // Refresh user data
        const userRes = await fetch('http://localhost:4000/api/auth/me', { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          setProfileData(prev => ({ 
            ...prev, 
            firstName: userData.firstName || '', 
            lastName: userData.lastName || '', 
            email: userData.email || '', 
            phone: userData.phone || '',
            riskAppetite: userData.riskAppetite || 'moderate',
            investmentGoal: userData.investmentGoal || '',
            monthlyInvestment: userData.monthlyInvestment || ''
          }))
        }
      } else {
        const errorData = await response.json()
        setSaveMessage({ type: 'error', text: errorData.error || 'Failed to update profile' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveInvestmentPreferences = async () => {
    setSaving(true)
    setSaveMessage(null)
    
    try {
      const token = localStorage.getItem('grip-invest-token')
      if (!token) {
        setSaveMessage({ type: 'error', text: 'Please log in to update your preferences' })
        return
      }

      const response = await fetch('http://localhost:4000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          riskAppetite: profileData.riskAppetite,
          investmentGoal: profileData.investmentGoal,
          monthlyInvestment: parseFloat(profileData.monthlyInvestment)
        })
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Investment preferences updated successfully!' })
        // Refresh user data
        const userRes = await fetch('http://localhost:4000/api/auth/me', { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          setProfileData(prev => ({ 
            ...prev, 
            firstName: userData.firstName || '', 
            lastName: userData.lastName || '', 
            email: userData.email || '', 
            phone: userData.phone || '',
            riskAppetite: userData.riskAppetite || 'moderate',
            investmentGoal: userData.investmentGoal || '',
            monthlyInvestment: userData.monthlyInvestment || ''
          }))
        }
      } else {
        const errorData = await response.json()
        setSaveMessage({ type: 'error', text: errorData.error || 'Failed to update preferences' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setSaving(true)
    setSaveMessage(null)
    
    try {
      const token = localStorage.getItem('grip-invest-token')
      if (!token) {
        setSaveMessage({ type: 'error', text: 'Please log in to change password' })
        return
      }

      const response = await fetch('http://localhost:4000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Password changed successfully!' })
        setShowPasswordModal(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const errorData = await response.json()
        setSaveMessage({ type: 'error', text: errorData.error || 'Failed to change password' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handle2FASetup = async () => {
    setSaving(true)
    setSaveMessage(null)
    
    try {
      const token = localStorage.getItem('grip-invest-token')
      if (!token) {
        setSaveMessage({ type: 'error', text: 'Please log in to setup 2FA' })
        return
      }

      const response = await fetch('http://localhost:4000/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTwoFactorData(prev => ({ 
          ...prev, 
          qrCode: data.qrCode, 
          secret: data.secret 
        }))
        setShow2FAModal(true)
      } else {
        const errorData = await response.json()
        setSaveMessage({ type: 'error', text: errorData.error || 'Failed to setup 2FA' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handle2FAVerify = async () => {
    if (!twoFactorData.token) {
      setSaveMessage({ type: 'error', text: 'Please enter the verification code' })
      return
    }

    setSaving(true)
    setSaveMessage(null)
    
    try {
      const token = localStorage.getItem('grip-invest-token')
      if (!token) {
        setSaveMessage({ type: 'error', text: 'Please log in to verify 2FA' })
        return
      }

      const response = await fetch('http://localhost:4000/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: twoFactorData.token })
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: '2FA enabled successfully!' })
        setShow2FAModal(false)
        setTwoFactorData(prev => ({ ...prev, isEnabled: true, token: '' }))
      } else {
        const errorData = await response.json()
        setSaveMessage({ type: 'error', text: errorData.error || 'Failed to verify 2FA' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handle2FADisable = async () => {
    if (!twoFactorData.token) {
      setSaveMessage({ type: 'error', text: 'Please enter the verification code' })
      return
    }

    setSaving(true)
    setSaveMessage(null)
    
    try {
      const token = localStorage.getItem('grip-invest-token')
      if (!token) {
        setSaveMessage({ type: 'error', text: 'Please log in to disable 2FA' })
        return
      }

      const response = await fetch('http://localhost:4000/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: twoFactorData.token })
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: '2FA disabled successfully!' })
        setShow2FADisableModal(false)
        setTwoFactorData(prev => ({ ...prev, isEnabled: false, token: '' }))
      } else {
        const errorData = await response.json()
        setSaveMessage({ type: 'error', text: errorData.error || 'Failed to disable 2FA' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleLoginHistory = async () => {
    setSaving(true)
    setSaveMessage(null)
    
    try {
      const token = localStorage.getItem('grip-invest-token')
      if (!token) {
        setSaveMessage({ type: 'error', text: 'Please log in to view login history' })
        return
      }

      const response = await fetch('http://localhost:4000/api/auth/login-history', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setLoginHistory(data.loginHistory)
        setShowLoginHistoryModal(true)
      } else {
        const errorData = await response.json()
        setSaveMessage({ type: 'error', text: errorData.error || 'Failed to fetch login history' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    setSaveMessage(null)
    
    try {
      const token = localStorage.getItem('grip-invest-token')
      if (!token) {
        setSaveMessage({ type: 'error', text: 'Please log in to save preferences' })
        return
      }

      const response = await fetch('http://localhost:4000/api/auth/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Preferences saved successfully!' })
      } else {
        const errorData = await response.json()
        setSaveMessage({ type: 'error', text: errorData.error || 'Failed to save preferences' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketUpdates: true,
    portfolioAlerts: true,
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-balance mb-2">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account information and investment preferences.</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          
          {/* Success/Error Messages */}
          {saveMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              saveMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  saveMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                {saveMessage.text}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold">
                    {loading ? "Loading..." : `${profileData.firstName} ${profileData.lastName}`.trim() || "User"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {loading ? "Loading..." : profileData.email || "No email"}
                  </p>
                  {!loading && !profileData.email && (
                    <p className="text-xs text-blue-500 mt-2">
                      Welcome! Your profile is ready.
                    </p>
                  )}
                  <Badge className="mt-2">Premium Member</Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Member Since:</span>
                    <span>{memberSince || "Loading..."}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Investments:</span>
                    <span>{loading ? "..." : portfolioData.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Portfolio Value:</span>
                    <span className="font-medium">{loading ? "..." : formatCurrency(portfolioData.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected Return:</span>
                    <span className="font-medium text-green-600">{loading ? "..." : formatCurrency(portfolioData.expectedTotalReturn)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diversification:</span>
                    <span className="font-medium">{loading ? "..." : `${portfolioData.diversificationScore}/3`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Portfolio Breakdown */}
            {portfolioData.count > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Portfolio Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(portfolioData.breakdown).map(([risk, amount]) => (
                      <div key={risk} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            risk === 'low' ? 'bg-green-500' : 
                            risk === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium capitalize">{risk} Risk</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Profile Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your basic account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder={loading ? "Loading..." : "Enter first name"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder={loading ? "Loading..." : "Enter last name"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder={loading ? "Loading..." : "Enter email address"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder={loading ? "Loading..." : "Enter phone number"}
                  />
                </div>

                <Button 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={handleSavePersonalInfo}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Investment Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Investment Preferences
                </CardTitle>
                <CardDescription>Configure your investment strategy and goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="riskAppetite">Risk Appetite</Label>
                  <Select
                    value={profileData.riskAppetite}
                    onValueChange={(value) => setProfileData((prev) => ({ ...prev, riskAppetite: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading..." : "Select risk appetite"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Conservative - Low risk, stable returns</SelectItem>
                      <SelectItem value="moderate">Moderate - Balanced risk and returns</SelectItem>
                      <SelectItem value="high">Aggressive - High risk, high potential returns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investmentGoal">Investment Goal</Label>
                  <Select
                    value={profileData.investmentGoal}
                    onValueChange={(value) => setProfileData((prev) => ({ ...prev, investmentGoal: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading..." : "Select investment goal"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short-term">Short-term gains (1-2 years)</SelectItem>
                      <SelectItem value="medium-term">Medium-term growth (3-5 years)</SelectItem>
                      <SelectItem value="long-term-growth">Long-term growth (5+ years)</SelectItem>
                      <SelectItem value="retirement">Retirement planning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyInvestment">Monthly Investment Budget ($)</Label>
                  <Input
                    id="monthlyInvestment"
                    type="number"
                    value={profileData.monthlyInvestment}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, monthlyInvestment: e.target.value }))}
                    placeholder={loading ? "Loading..." : "Enter monthly budget"}
                  />
                </div>

                <Button 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={handleSaveInvestmentPreferences}
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Preferences"}
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Choose how you want to receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Button
                      variant={preferences.emailNotifications ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, emailNotifications: !prev.emailNotifications }))
                      }
                    >
                      {preferences.emailNotifications ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SMS Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive alerts via text message</p>
                    </div>
                    <Button
                      variant={preferences.smsNotifications ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreferences((prev) => ({ ...prev, smsNotifications: !prev.smsNotifications }))}
                    >
                      {preferences.smsNotifications ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Market Updates</h4>
                      <p className="text-sm text-muted-foreground">Daily market news and insights</p>
                    </div>
                    <Button
                      variant={preferences.marketUpdates ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreferences((prev) => ({ ...prev, marketUpdates: !prev.marketUpdates }))}
                    >
                      {preferences.marketUpdates ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Portfolio Alerts</h4>
                      <p className="text-sm text-muted-foreground">Important portfolio changes</p>
                    </div>
                    <Button
                      variant={preferences.portfolioAlerts ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreferences((prev) => ({ ...prev, portfolioAlerts: !prev.portfolioAlerts }))}
                    >
                      {preferences.portfolioAlerts ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={handleSavePreferences}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? "Saving..." : "Save Notification Preferences"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Change Password</h4>
                      <p className="text-sm text-muted-foreground">Update your account password</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={twoFactorData.isEnabled ? () => setShow2FADisableModal(true) : handle2FASetup}
                    >
                      {twoFactorData.isEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Login History</h4>
                      <p className="text-sm text-muted-foreground">View recent account access</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={handleLoginHistory}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleChangePassword}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Changing..." : "Change Password"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Setup Two-Factor Authentication</h3>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app:
                </p>
                {twoFactorData.qrCode && (
                  <img src={twoFactorData.qrCode} alt="QR Code" className="mx-auto mb-4" />
                )}
                <p className="text-xs text-gray-500 mb-4">
                  Or enter this code manually: <code className="bg-gray-100 px-2 py-1 rounded">{twoFactorData.secret}</code>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Enter 6-digit code from your app</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="123456"
                  value={twoFactorData.token}
                  onChange={(e) => setTwoFactorData(prev => ({ ...prev, token: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handle2FAVerify}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Verifying..." : "Verify & Enable"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShow2FAModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {show2FADisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Disable Two-Factor Authentication</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Enter 6-digit code from your authenticator app</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="123456"
                  value={twoFactorData.token}
                  onChange={(e) => setTwoFactorData(prev => ({ ...prev, token: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handle2FADisable}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Disabling..." : "Disable 2FA"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShow2FADisableModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Login History Modal */}
      {showLoginHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-4/5 max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Login History</h3>
              <Button 
                variant="outline"
                onClick={() => setShowLoginHistoryModal(false)}
              >
                Close
              </Button>
            </div>
            <div className="overflow-y-auto max-h-96">
              {loginHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No login history found</p>
              ) : (
                <div className="space-y-2">
                  {loginHistory.map((login) => (
                    <div key={login.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${login.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium">{login.endpoint}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(login.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {login.success ? 'Success' : 'Failed'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {login.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
