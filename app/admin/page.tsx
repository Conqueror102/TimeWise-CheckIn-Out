"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { isAdminAuthenticated } from "@/lib/auth"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated())
    setIsLoading(false)
  }, [])

  const handleAdminLogin = () => {
    setIsAuthenticated(true)
  }

  const handleAdminLogout = () => {
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="web-app-container flex items-center justify-center">
        <div className="text-primary-dark text-xl">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <AdminDashboard onLogout={handleAdminLogout} />
  } else {
    return <AdminLogin onLogin={handleAdminLogin} />
  }
}
