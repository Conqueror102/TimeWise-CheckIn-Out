"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Download, User } from "lucide-react"

interface Staff {
  staffId: string
  name: string
  department: string
  position: string
  qrCode: string
}

const departments = [
  "Human Resources",
  "Engineering",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "Customer Support",
]

export function StaffRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    position: "",
  })
  const [loading, setLoading] = useState(false)
  const [registeredStaff, setRegisteredStaff] = useState<Staff | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/staff/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setRegisteredStaff(data.staff)
        setFormData({ name: "", department: "", position: "" })
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!registeredStaff) return

    const link = document.createElement("a")
    link.download = `${registeredStaff.staffId}-qr-code.png`
    link.href = registeredStaff.qrCode
    link.click()
  }

  if (registeredStaff) {
    return (
      <Card className="w-full max-w-md mx-auto glass-card shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 gradient-accent rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-accent-dark text-xl">Registration Successful!</CardTitle>
          <CardDescription>Staff member has been registered successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="bg-gray-50 p-6 rounded-xl mb-4 border-2 border-accent-teal/20">
              <img
                src={registeredStaff.qrCode || "/placeholder.svg"}
                alt="QR Code"
                className="mx-auto mb-3 rounded-lg"
              />
              <p className="font-mono text-2xl font-bold text-accent-dark">{registeredStaff.staffId}</p>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-gray-700">
                <strong className="text-primary-dark">Name:</strong> {registeredStaff.name}
              </p>
              <p className="text-gray-700">
                <strong className="text-primary-dark">Department:</strong> {registeredStaff.department}
              </p>
              <p className="text-gray-700">
                <strong className="text-primary-dark">Position:</strong> {registeredStaff.position}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="flex-1 border-2 border-gray-300 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
            <Button onClick={() => setRegisteredStaff(null)} className="flex-1 primary-button">
              Register Another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto glass-card shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-primary-dark text-xl">Staff Registration</CardTitle>
        <CardDescription>Register a new staff member</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-gray-700 font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border-2 border-gray-200 focus:border-accent-teal focus:ring-accent-teal/20"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="department" className="text-gray-700 font-medium">
              Department
            </Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
              required
            >
              <SelectTrigger className="border-2 border-gray-200 focus:border-accent-teal">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="position" className="text-gray-700 font-medium">
              Position
            </Label>
            <Input
              id="position"
              type="text"
              placeholder="Enter position/title"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="border-2 border-gray-200 focus:border-accent-teal focus:ring-accent-teal/20"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full primary-button h-12 font-semibold" disabled={loading}>
            {loading ? "Registering..." : "Register Staff"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
