"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface BackButtonProps {
  fallbackHref?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function BackButton({
  fallbackHref = "/dashboard",
  className = "",
  variant = "ghost",
  size = "sm",
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Try to go back in history first
    if (window.history.length > 1) {
      router.back()
    } else {
      // Fallback to specified href if no history
      router.push(fallbackHref)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleBack} className={`flex items-center gap-2 ${className}`}>
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  )
}
