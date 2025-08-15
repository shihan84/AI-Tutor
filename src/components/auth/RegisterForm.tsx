"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BookOpen, User, Mail, Lock, Calendar, Phone, MapPin } from "lucide-react"
import { UserRole, GradeLevel } from "@prisma/client"

interface RegisterFormProps {
  onSwitchToLogin: () => void
  onSuccess: (user: any) => void
}

export default function RegisterForm({ onSwitchToLogin, onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "",
    gradeLevel: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    specialization: "",
    experience: "",
    qualification: "",
    occupation: ""
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate required fields based on role
    if (!formData.role) {
      setError("Please select a role")
      return
    }

    if (formData.role === "STUDENT" && !formData.gradeLevel) {
      setError("Please select a grade level")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          gradeLevel: formData.gradeLevel || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      // If role-specific fields are provided, update the profile
      if (formData.role === "TEACHER" && (formData.specialization || formData.experience || formData.qualification)) {
        // In a real app, you would make another API call to update the teacher profile
        console.log("Teacher profile data:", {
          specialization: formData.specialization,
          experience: formData.experience,
          qualification: formData.qualification
        })
      }

      if (formData.role === "PARENT" && formData.occupation) {
        // In a real app, you would make another API call to update the parent profile
        console.log("Parent profile data:", {
          occupation: formData.occupation
        })
      }

      onSuccess(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">AI Tutor</h1>
          </div>
        </div>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Join our AI-powered learning platform</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>I am a:</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: "STUDENT", label: "Student", color: "bg-blue-100 text-blue-800" },
                { value: "TEACHER", label: "Teacher", color: "bg-green-100 text-green-800" },
                { value: "PARENT", label: "Parent", color: "bg-purple-100 text-purple-800" },
                { value: "ADMIN", label: "Admin", color: "bg-orange-100 text-orange-800" }
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleInputChange("role", role.value)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.role === role.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Badge className={role.color}>{role.label}</Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Role-specific fields */}
          {formData.role === "STUDENT" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Select value={formData.gradeLevel} onValueChange={(value) => handleInputChange("gradeLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIMARY_1">Primary 1</SelectItem>
                    <SelectItem value="PRIMARY_2">Primary 2</SelectItem>
                    <SelectItem value="PRIMARY_3">Primary 3</SelectItem>
                    <SelectItem value="PRIMARY_4">Primary 4</SelectItem>
                    <SelectItem value="PRIMARY_5">Primary 5</SelectItem>
                    <SelectItem value="SECONDARY_6">Secondary 6</SelectItem>
                    <SelectItem value="SECONDARY_7">Secondary 7</SelectItem>
                    <SelectItem value="SECONDARY_8">Secondary 8</SelectItem>
                    <SelectItem value="SECONDARY_9">Secondary 9</SelectItem>
                    <SelectItem value="SECONDARY_10">Secondary 10</SelectItem>
                    <SelectItem value="HIGHER_SECONDARY_11">Higher Secondary 11</SelectItem>
                    <SelectItem value="HIGHER_SECONDARY_12">Higher Secondary 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formData.role === "TEACHER" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    type="text"
                    placeholder="e.g., Mathematics, Science"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange("specialization", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    placeholder="Years of experience"
                    value={formData.experience}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  type="text"
                  placeholder="e.g., B.Ed, M.Sc, Ph.D"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange("qualification", e.target.value)}
                />
              </div>
            </div>
          )}

          {formData.role === "PARENT" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  type="text"
                  placeholder="Your occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange("occupation", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Optional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Optional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  placeholder="Your address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="pl-10 min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}