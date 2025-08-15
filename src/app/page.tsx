"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, MessageSquare, BarChart3, Calendar, Users, Settings, Bell, Search, Home } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

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
    return null // Will redirect to auth page
  }

  // Mock data for demonstration
  const mockSubjects = [
    { name: "Mathematics", progress: 75, grade: "A", color: "bg-blue-500" },
    { name: "Science", progress: 60, grade: "B", color: "bg-green-500" },
    { name: "English", progress: 85, grade: "A", color: "bg-purple-500" },
    { name: "Social Studies", progress: 45, grade: "C", color: "bg-orange-500" },
  ]

  const mockAssignments = [
    { title: "Algebra Homework", subject: "Mathematics", dueDate: "2024-01-15", status: "pending" },
    { title: "Science Project", subject: "Science", dueDate: "2024-01-20", status: "in-progress" },
    { title: "Essay Writing", subject: "English", dueDate: "2024-01-18", status: "completed" },
  ]

  const mockRecentActivity = [
    { action: "Completed lesson on Fractions", time: "2 hours ago", type: "lesson" },
    { action: "Submitted Math assignment", time: "5 hours ago", type: "assignment" },
    { action: "AI Tutor session on Geometry", time: "1 day ago", type: "ai-session" },
  ]

  const handleLogout = () => {
    logout()
    router.push("/auth")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-primary">AI Tutor</h1>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Subjects</span>
                </Button>
                <Button variant="ghost" className="flex items-center space-x-2" onClick={() => router.push("/ai-tutor")}>
                  <MessageSquare className="h-4 w-4" />
                  <span>AI Tutor</span>
                </Button>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Progress</span>
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Card */}
            <Card>
              <CardHeader>
                <CardTitle>Welcome back, {user.name}!</CardTitle>
                <CardDescription>Continue your learning journey with AI Tutor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">4</div>
                    <div className="text-sm text-muted-foreground">Active Subjects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">66%</div>
                    <div className="text-sm text-muted-foreground">Overall Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">12</div>
                    <div className="text-sm text-muted-foreground">Completed Lessons</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subjects Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Progress</CardTitle>
                <CardDescription>Your progress across different subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSubjects.map((subject, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{subject.name}</span>
                          <Badge variant="outline">{subject.grade}</Badge>
                        </div>
                        <Progress value={subject.progress} className="h-2" />
                        <div className="text-sm text-muted-foreground mt-1">{subject.progress}% complete</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest learning activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.type === "lesson" && <BookOpen className="h-5 w-5 text-blue-500" />}
                        {activity.type === "assignment" && <Calendar className="h-5 w-5 text-green-500" />}
                        {activity.type === "ai-session" && <MessageSquare className="h-5 w-5 text-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* AI Tutor Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>AI Tutor</span>
                </CardTitle>
                <CardDescription>Get help from your AI tutor</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg" onClick={() => router.push("/ai-tutor")}>
                  Start AI Session
                </Button>
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Quick Topics:</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="cursor-pointer">Math Help</Badge>
                    <Badge variant="secondary" className="cursor-pointer">Science Questions</Badge>
                    <Badge variant="secondary" className="cursor-pointer">Essay Review</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Upcoming Assignments</span>
                </CardTitle>
                <CardDescription>Don't miss these deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAssignments.map((assignment, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{assignment.title}</div>
                      <div className="text-sm text-muted-foreground">{assignment.subject}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm">Due: {assignment.dueDate}</div>
                        <Badge 
                          variant={assignment.status === "completed" ? "default" : "outline"}
                          className={assignment.status === "pending" ? "border-red-500 text-red-500" : ""}
                        >
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Study Streak */}
            <Card>
              <CardHeader>
                <CardTitle>Study Streak</CardTitle>
                <CardDescription>Keep up the great work!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">7</div>
                  <div className="text-sm text-muted-foreground">Days in a row</div>
                  <div className="mt-4">
                    <div className="flex justify-center space-x-1">
                      {[...Array(7)].map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}