"use client"

import { useState } from "react"
import LoginForm from "@/components/auth/LoginForm"
import RegisterForm from "@/components/auth/RegisterForm"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [user, setUser] = useState(null)

  const handleAuthSuccess = (userData: any) => {
    setUser(userData)
    // In a real app, you would store the user in context/localStorage
    // and redirect to the dashboard
    console.log("Auth successful:", userData)
    // For now, we'll just reload the page to show the dashboard
    window.location.reload()
  }

  if (user) {
    // This would normally redirect to dashboard
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {isLogin ? (
          <LoginForm 
            onSwitchToRegister={() => setIsLogin(false)} 
            onSuccess={handleAuthSuccess}
          />
        ) : (
          <RegisterForm 
            onSwitchToLogin={() => setIsLogin(true)} 
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  )
}