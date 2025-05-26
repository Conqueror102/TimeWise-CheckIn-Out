"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Clock,
  UserX,
  Settings,
  Download,
  Filter,
  AlertTriangle,
  UserPlus,
  LogOut,
  Building2,
  TrendingUp,
  RefreshCw,
  Timer,
} from "lucide-react"
import type { AttendanceLog, Staff, AdminSettings } from "@/lib/models"
import { StaffRegistration } from "./staff-registration"
import { setAdminAuthenticated } from "@/lib/auth"
import logo from "@/public/logo1.png"
import Image from "next/image"

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [currentStaff, setCurrentStaff] = useState<AttendanceLog[]>([])
  const [absentStaff, setAbsentStaff] = useState<Staff[]>([])
  const [settings, setSettings] = useState<AdminSettings>({ latenessTime: "09:00", workEndTime: "17:00" })
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    department: "all",
    lateOnly: false,
  })
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Real-time data fetching
  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchLogs(), fetchCurrentStaff(), fetchAbsentStaff()])
    setLastUpdate(new Date())
  }, [filters])

  useEffect(() => {
    fetchAllData()
    fetchSettings()
  }, [fetchAllData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchAllData()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchAllData])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.date) params.append("date", filters.date)
      if (filters.department !== "all") params.append("department", filters.department)
      if (filters.lateOnly) params.append("lateOnly", "true")

      const response = await fetch(`/api/admin/logs?${params}`)
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentStaff = async () => {
    try {
      const response = await fetch("/api/admin/current-staff")
      const data = await response.json()
      setCurrentStaff(data.currentStaff || [])
    } catch (error) {
      console.error("Error fetching current staff:", error)
    }
  }

  const fetchAbsentStaff = async () => {
    try {
      const response = await fetch(`/api/admin/absent-staff?date=${filters.date}`)
      const data = await response.json()
      setAbsentStaff(data.absentStaff || [])
    } catch (error) {
      console.error("Error fetching absent staff:", error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()
      setSettings(data.settings || { latenessTime: "09:00", workEndTime: "17:00" })
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const updateSettings = async () => {
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      alert("Settings updated successfully!")
    } catch (error) {
      console.error("Error updating settings:", error)
      alert("Failed to update settings")
    }
  }

  const exportToCSV = () => {
    const headers = ["Staff ID", "Name", "Department", "Type", "Date", "Time", "Status"]
    const csvContent = [
      headers.join(","),
      ...logs.map((log) =>
        [
          log.staffId,
          log.staffName,
          log.department,
          log.type,
          log.date,
          new Date(log.timestamp).toLocaleTimeString(),
          getAttendanceStatus(log),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-logs-${filters.date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleLogout = () => {
    setAdminAuthenticated(false)
    onLogout()
  }

  const getAttendanceStatus = (log: AttendanceLog) => {
    if (log.type === "check-in" && log.isLate) return "Late"
    if (log.type === "check-out") {
      const checkoutTime = new Date(log.timestamp).toTimeString().slice(0, 5)
      if (checkoutTime < settings.workEndTime) return "Early"
    }
    return "On Time"
  }

  const getStatusBadge = (log: AttendanceLog) => {
    if (log.type === "check-in" && log.isLate) {
      return (
        <Badge className="status-late flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Late
        </Badge>
      )
    }
    if (log.type === "check-out") {
      const checkoutTime = new Date(log.timestamp).toTimeString().slice(0, 5)
      if (checkoutTime < settings.workEndTime) {
        return (
          <Badge className="status-early flex items-center gap-1">
            <Timer className="w-3 h-3" />
            Early
          </Badge>
        )
      }
    }
    return null
  }

  const departments = [
    "all",
    "Human Resources",
    "Engineering",
    "Marketing",
    "Sales",
    "Finance",
    "Operations",
    "Customer Support",
  ]

  const lateCount = logs.filter((log) => log.date === filters.date && log.isLate).length
  const earlyCount = logs.filter((log) => {
    if (log.type !== "check-out" || log.date !== filters.date) return false
    const checkoutTime = new Date(log.timestamp).toTimeString().slice(0, 5)
    return checkoutTime < settings.workEndTime
  }).length

  return (
    <div className="web-app-container min-h-screen">
      {/* Header */}
      <header className="gradient-primary shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                <Image src={logo} alt="" width={200} height={200}/>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <div className="flex items-center gap-3 text-blue-200 text-sm">
                  <span>Staff Attendance Management</span>
                  {autoRefresh && <div className="live-indicator">Live</div>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-white text-xs">Last updated: {lastUpdate.toLocaleTimeString()}</div>
              <button onClick={fetchAllData} className="btn-outline-white flex items-center gap-1 text-sm">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button onClick={exportToCSV} className="btn-outline-white flex items-center gap-1 text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button onClick={handleLogout} className="btn-outline-white flex items-center gap-1 text-sm">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className=" border-l-4 border-l-accent-teal">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Currently Active</CardTitle>
              <div className="p-2 bg-accent-teal/10 rounded-lg">
                <Users className="h-5 w-5 text-accent-teal" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-navy mb-1">{currentStaff.length}</div>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Staff in office
              </p>
            </CardContent>
          </Card>

          <Card className=" border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Late Arrivals</CardTitle>
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-navy mb-1">{lateCount}</div>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Today's late check-ins
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Early Departures</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-navy mb-1">{earlyCount}</div>
              <p className="text-xs text-gray-600">Left before work end time</p>
            </CardContent>
          </Card>

          <Card className=" border-l-4 border-l-error">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Absent Today</CardTitle>
              <div className="p-2 bg-error/10 rounded-lg">
                <UserX className="h-5 w-5 text-error" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-navy mb-1">{absentStaff.length}</div>
              <p className="text-xs text-gray-600">Missing staff members</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="bg-white shadow-md border">
            <TabsTrigger value="logs" className="data-[state=active]:bg-primary-navy data-[state=active]:text-white">
              Attendance Logs
            </TabsTrigger>
            <TabsTrigger value="current" className="data-[state=active]:bg-primary-navy data-[state=active]:text-white">
              Currently In
            </TabsTrigger>
            <TabsTrigger value="absent" className="data-[state=active]:bg-primary-navy data-[state=active]:text-white">
              Absent Staff
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-primary-navy data-[state=active]:text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Register Staff
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-primary-navy data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            {/* Filters */}
            <Card className=" bg-accent-teal/15">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-navy">
                  <Filter className="w-5 h-5 text-accent-teal" />
                  Filter Options
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date" className="text-gray-700">
                    Date:
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="w-auto border-2 border-gray-200 focus:border-primary-navy"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="department" className="text-gray-700">
                    Department:
                  </Label>
                  <Select
                    value={filters.department}
                    onValueChange={(value) => setFilters({ ...filters, department: value })}
                  >
                    <SelectTrigger className="w-auto border-2 border-gray-200 focus:border-primary-navy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept === "all" ? "All Departments" : dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lateOnly"
                    checked={filters.lateOnly}
                    onChange={(e) => setFilters({ ...filters, lateOnly: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="lateOnly" className="text-gray-700">
                    Late arrivals only
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoRefresh" className="text-gray-700">
                    Auto-refresh
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-primary-navy">Attendance Records</CardTitle>
                <CardDescription>
                  {loading ? "Loading..." : `${logs.length} records found`}
                  {autoRefresh && <span className="ml-2 text-success">• Live updates enabled</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4 font-semibold text-gray-700">Staff ID</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Department</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Time</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-mono font-medium text-primary-navy">{log.staffId}</td>
                          <td className="p-4 font-medium text-primary-navy">{log.staffName}</td>
                          <td className="p-4 text-gray-600">{log.department}</td>
                          <td className="p-4">
                            <Badge
                              variant={log.type === "check-in" ? "default" : "secondary"}
                              className={
                                log.type === "check-in" ? "bg-primary-navy text-white" : "bg-gray-200 text-gray-700"
                              }
                            >
                              {log.type}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-600">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-4">{getStatusBadge(log)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {logs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No attendance records found for the selected filters.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="current">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-primary-navy">Currently Clocked In</CardTitle>
                <CardDescription>
                  {currentStaff.length} staff members currently in office
                  {autoRefresh && <span className="ml-2 text-success">• Live updates</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentStaff.map((staff, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-accent-teal/5 rounded-lg border border-accent-teal/20 hover:bg-accent-teal/10 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-primary-navy">{staff.staffName}</p>
                        <p className="text-sm text-gray-600">
                          {staff.department} • {staff.staffId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Checked in at</p>
                        <p className="font-mono text-sm font-medium text-primary-navy">
                          {new Date(staff.timestamp).toLocaleTimeString()}
                        </p>
                        {staff.isLate && (
                          <Badge className="status-late mt-1">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Late
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {currentStaff.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No staff currently clocked in</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="absent">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-primary-navy">Absent Staff</CardTitle>
                <CardDescription>Staff who haven't checked in for {filters.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {absentStaff.map((staff, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div>
                        <p className="font-semibold text-primary-navy">{staff.name}</p>
                        <p className="text-sm text-gray-600">
                          {staff.department} • {staff.position}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium text-gray-700">{staff.staffId}</p>
                        <Badge className="status-absent">Absent</Badge>
                      </div>
                    </div>
                  ))}
                  {absentStaff.length === 0 && (
                    <div className="text-center py-12 text-gray-500">All staff have checked in today! 🎉</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-navy">
                  <UserPlus className="w-5 h-5" />
                  Register New Staff
                </CardTitle>
                <CardDescription>Add a new staff member to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <StaffRegistration />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-navy">
                  <Settings className="w-5 h-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>Configure lateness time and work hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="latenessTime" className="text-sm font-medium text-gray-700">
                      Lateness Time
                    </Label>
                    <Input
                      id="latenessTime"
                      type="time"
                      value={settings.latenessTime}
                      onChange={(e) => setSettings({ ...settings, latenessTime: e.target.value })}
                      className="border-2 border-gray-200 focus:border-primary-navy"
                    />
                    <p className="text-sm text-gray-600">Check-ins after this time will be marked as late</p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="workEndTime" className="text-sm font-medium text-gray-700">
                      Work End Time
                    </Label>
                    <Input
                      id="workEndTime"
                      type="time"
                      value={settings.workEndTime}
                      onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                      className="border-2 border-gray-200 focus:border-primary-navy"
                    />
                    <p className="text-sm text-gray-600">Check-outs before this time will be marked as early</p>
                  </div>
                </div>
                <Button onClick={updateSettings} className="btn-primary">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
