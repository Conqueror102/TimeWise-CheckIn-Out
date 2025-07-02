"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, KeyRound, Camera, CheckCircle, Clock, AlertTriangle, LogIn, LogOut, } from "lucide-react"
import { EnhancedQRScanner } from "@/components/enhanced-qr-scanner"
import logo from "@/public/logo1.png"
import Image from "next/image"

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}`;
}
function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}
function getCookie(name: string): string | null {
  return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1] || null;
}

export default function StaffCheckIn() {
  const [staffId, setStaffId] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success")
  const [showScanner, setShowScanner] = useState(false)
  const [scanAuth, setScanAuth] = useState(false)
  const [scanPassword, setScanPassword] = useState("")
  const [scanAuthError, setScanAuthError] = useState("")
  const [scanToken, setScanToken] = useState<string | null>(getCookie("scanToken"))

  useEffect(() => {
    const token = getCookie("scanToken");
    setScanToken(token);
    setScanAuth(!!token);
  }, []);

  const handleCheckIn = async (id: string, type: "check-in" | "check-out") => {
    if (!id.trim()) {
      setMessage("Please enter a staff ID")
      setMessageType("error")
      return
    }
    if (!scanToken) {
      setMessage("Not authenticated. Please enter the password.")
      setMessageType("error")
      return
    }
    setLoading(true)
    setMessage("")
    try {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${scanToken}`,
        },
        body: JSON.stringify({ staffId: id.trim(), type }),
      })
      const data = await response.json()
      if (data.success) {
        setMessage(
          `${data.staff} ${type === "check-in" ? "checked in" : "checked out"} successfully${data.isLate ? " (Late)" : ""}`,
        )
        setMessageType(data.isLate ? "warning" : "success")
        setStaffId("")
        setShowScanner(false)
      } else {
        setMessage(data.error || `${type} failed`)
        setMessageType("error")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = (scannedId: string) => {
    setStaffId(scannedId)
    setShowScanner(false)
    // Auto-focus on check-in after scan
    setTimeout(() => {
      const checkInBtn = document.querySelector('[data-action="check-in"]') as HTMLButtonElement
      checkInBtn?.focus()
    }, 100)
  }

  const handleScanAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setScanAuthError("");
    try {
      const res = await fetch("/api/scan-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: scanPassword }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setScanToken(data.token);
        setCookie("scanToken", data.token, 7200);
        setScanAuth(true);
        setScanAuthError("");
      } else {
        setScanAuthError("Invalid password");
      }
    } catch {
      setScanAuthError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanLogout = () => {
    setScanToken(null);
    deleteCookie("scanToken");
    setScanAuth(false);
    // ... any other logout logic
  }

  const getMessageIcon = () => {
    switch (messageType) {
      case "success":
        return <CheckCircle className="w-4 h-4" />
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      case "error":
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getAlertVariant = () => {
    switch (messageType) {
      case "error":
        return "destructive"
      default:
        return "default"
    }
  }

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (!scanAuth) {
    return (
      <div className="web-app-container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md glass-card shadow-xl animate-slide-up">
          <CardHeader className="text-center space-y-4 pb-6">
            <CardTitle className="text-2xl font-bold text-primary-dark">Enter Access Password</CardTitle>
            <CardDescription className="text-gray-600">
              This screen is protected. Please enter the password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleScanAuth} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="scanPassword" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="scanPassword"
                  type="password"
                  placeholder="Enter password"
                  value={scanPassword}
                  onChange={(e) => setScanPassword(e.target.value)}
                  className="h-12 border-2 border-gray-200 focus:border-accent-teal focus:ring-accent-teal/20"
                  required
                />
              </div>
              {scanAuthError && (
                <Alert variant="destructive">
                  <AlertDescription>{scanAuthError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full primary-button h-12 font-semibold" disabled={loading}>
                {loading ? "Authenticating..." : "Access Check-In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="web-app-container">
      {/* Header */}
      <header className="gradient-primary shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
               <Image src={logo} alt="" width={200} height={200}/>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Staffs/Students Portal</h1>
                <p className="text-blue-200 text-sm">Attendance Management System</p>
              </div>
            </div>
            <div className="text-white text-sm">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-md mx-auto">
          <Card className="modern-card animate-slide-up">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto mb-4 gradient-accent rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-primary-navy">Check In / Check Out</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your staff ID or scan your QR code to record attendance
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger
                    value="manual"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary-navy"
                  >
                    <KeyRound className="w-4 h-4" />
                    Staff ID
                  </TabsTrigger>
                  <TabsTrigger
                    value="qr"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary-navy"
                  >
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 mt-6">
                  <div className="space-y-3">
                    <Label htmlFor="staffId" className="text-sm font-medium text-gray-700">
                      Staff ID
                    </Label>
                    <Input
                      id="staffId"
                      type="text"
                      placeholder="e.g., AB1234"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                      className="text-center font-mono text-lg tracking-wider h-11 border-2 border-gray-200 focus:border-primary-navy focus:ring-primary-navy/20"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="qr" className="space-y-4 mt-6">
                  <div className="text-center">
                    {!showScanner ? (
                      <Button
                        onClick={() => setShowScanner(true)}
                        variant="outline"
                        className="w-full h-20 border-2 border-dashed border-accent-teal text-accent-teal hover:bg-accent-teal/5 hover:border-accent-teal"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Camera className="w-6 h-6" />
                          <span>Tap to Scan QR Code</span>
                        </div>
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <EnhancedQRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
                      </div>
                    )}
                  </div>
                  {staffId && (
                    <div className="text-center p-4 bg-accent-teal/10 rounded-lg border border-accent-teal/30 animate-fade-in">
                      <p className="text-sm text-accent-teal-dark font-medium mb-1">Scanned ID:</p>
                      <p className="font-mono font-bold text-xl text-accent-teal-dark">{staffId}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {message && (
                <Alert variant={getAlertVariant()} className="animate-fade-in">
                  {getMessageIcon()}
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button
                  data-action="check-in"
                  onClick={() => handleCheckIn(staffId, "check-in")}
                  disabled={loading || !staffId.trim()}
                  className="btn-success h-12 font-semibold"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {loading ? "Processing..." : "Check In"}
                </Button>
                <Button
                  data-action="check-out"
                  onClick={() => handleCheckIn(staffId, "check-out")}
                  disabled={loading || !staffId.trim()}
                  className="btn-primary h-12 font-semibold"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {loading ? "Processing..." : "Check Out"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <Card className="modern-card">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-2">Need assistance?</p>
                <p className="text-xs text-gray-500">Contact your system administrator or IT support</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
