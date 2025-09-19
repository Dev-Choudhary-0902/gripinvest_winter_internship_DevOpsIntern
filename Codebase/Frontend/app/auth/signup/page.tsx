"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Eye, EyeOff, XCircle } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "Demo",
    lastName: "User",
    email: "demo@gmail.com",
    password: "Demo@1234",
    confirmPassword: "Demo@1234",
    riskAppetite: "moderate",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    const feedback: string[] = []

    if (password.length >= 8) strength += 20
    else feedback.push("Use at least 8 characters")

    if (/[A-Z]/.test(password)) strength += 20
    else feedback.push("Add an uppercase letter")

    if (/[a-z]/.test(password)) strength += 20
    else feedback.push("Add a lowercase letter")

    if (/\d/.test(password)) strength += 20
    else feedback.push("Add a number")

    if (/[^A-Za-z0-9]/.test(password)) strength += 20
    else feedback.push("Add a special character")

    setPasswordStrength(strength)
    setPasswordFeedback(feedback)
  }

  const handlePasswordChange = (password: string) => {
    setFormData((prev) => ({ ...prev, password }))
    calculatePasswordStrength(password)
  }

  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-destructive"
    if (passwordStrength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength < 40) return "Weak"
    if (passwordStrength < 80) return "Medium"
    return "Strong"
  }

  const mapRisk = (value: string) => {
    if (value === "conservative") return "low"
    if (value === "aggressive") return "high"
    return "moderate"
  }

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)
    if (!formData.email || !formData.password || !formData.firstName) {
      setError("Please fill required fields: first name, email, password")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          riskAppetite: mapRisk(formData.riskAppetite || "moderate"),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Signup failed")
      } else {
        // Store the authentication token
        localStorage.setItem('grip-invest-token', data.token)
        
        // Show success message briefly
        setSuccess("Account created successfully! Redirecting to profile...")
        
        // Redirect to profile page after a short delay
        setTimeout(() => {
          window.location.href = '/profile'
        }, 1500)
      }
    } catch (e) {
      setError("Network error. Is the backend running on :4000?")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold">Grip Invest</span>
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Start your investment journey with AI-powered insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Password Strength:</span>
                  <span
                    className={`font-medium ${passwordStrength >= 80 ? "text-green-600" : passwordStrength >= 40 ? "text-yellow-600" : "text-destructive"}`}
                  >
                    {getStrengthText()}
                  </span>
                </div>
                <Progress value={passwordStrength} className="h-2" />
                {passwordFeedback.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-1">
                        {passwordFeedback.map((feedback, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <XCircle className="h-3 w-3 text-destructive" />
                            <span>{feedback}</span>
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="flex items-center space-x-2 text-sm text-destructive">
                <XCircle className="h-3 w-3" />
                <span>Passwords do not match</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskAppetite">Risk Appetite</Label>
            <Select
              value={formData.riskAppetite}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, riskAppetite: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your risk tolerance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative - Low risk, stable returns</SelectItem>
                <SelectItem value="moderate">Moderate - Balanced risk and returns</SelectItem>
                <SelectItem value="aggressive">Aggressive - High risk, high potential returns</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Account"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
