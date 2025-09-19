"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "./providers/auth-provider"
import { useRouter } from "next/navigation"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace("/login")
    }
  }, [user, router])

  if (!user) return null
  return <>{children}</>
}
