"use client"

import { useAuth } from "@/contexts/AuthContext"
import AITutorChat from "@/components/aitutor/AITutorChat"

export default function AITutorPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access AI Tutor</h1>
          <p className="text-muted-foreground">You need to be logged in to use the AI Tutor feature.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">AI Tutor</h1>
          <p className="text-muted-foreground">
            Get personalized help from your AI tutor. Ask questions, get explanations, and receive guidance on your studies.
          </p>
        </div>
        <AITutorChat />
      </div>
    </div>
  )
}