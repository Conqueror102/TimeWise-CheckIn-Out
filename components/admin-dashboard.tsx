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
  CalendarDays,
  XCircle,
  ArrowLeftCircle,
} from "lucide-react"
import type { AttendanceLog, Staff, AdminSettings } from "@/lib/models"
import type { ReactNode, ElementType } from "react" // For React types
import type { LucideIcon } from 'lucide-react'

// Component Props Types
interface StaffDetailModalProps {
  staff: Staff | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CircleStatProps {
  value: number
  max: number
  color: string
  label: string
  icon: LucideIcon
}

interface GroupedAttendanceLog {
  checkIn: AttendanceLog | null
  checkOut: AttendanceLog | null
  staff: AttendanceLog
}
import { StaffRegistration } from "./staff-registration"
import { setAdminAuthenticated } from "@/lib/auth"
import logo from "@/public/logo1.png"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer"

interface AdminDashboardProps {
  onLogout: () => void
}

interface StaffDetailModalProps {
  staff: Staff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getCookie(name: string): string | null {
  return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1] || null;
}

// Helper to group logs by staffId and date
interface GroupedLog {
  checkIn: AttendanceLog | null;
  checkOut: AttendanceLog | null;
  staff: AttendanceLog;
}

function groupLogsByStaffAndDate(logs: AttendanceLog[]): GroupedLog[] {
  const grouped: { [key: string]: GroupedLog } = {};
  for (const log of logs) {
    const key = `${log.staffId}_${log.date}`;
    if (!grouped[key]) grouped[key] = { checkIn: null, checkOut: null, staff: log };
    if (log.type === "check-in") grouped[key].checkIn = log;
    if (log.type === "check-out") grouped[key].checkOut = log;
  }
  return Object.values(grouped);
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [adminToken, setAdminToken] = useState<string | null>(getCookie("adminToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(!!adminToken);
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [currentStaff, setCurrentStaff] = useState<AttendanceLog[]>([])
  const [absentStaff, setAbsentStaff] = useState<Staff[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [settings, setSettings] = useState<AdminSettings>({ latenessTime: "09:00", workEndTime: "17:00" })
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    department: "all",
    lateOnly: false,
  })
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const token = getCookie("adminToken");
    setAdminToken(token);
    setIsAuthenticated(!!token);
    if (token) {
      fetchAdminData(token).catch(error => {
        console.error("Initial data fetch failed:", error);
        setIsAuthenticated(false);
      });
    }
  }, []);

  async function fetchAdminData(token: string) {
    try {
      setLoading(true);
      const date = new Date().toISOString().split('T')[0];
      
      // Fetch all data in parallel with cache control headers
      const fetchOptions = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };

      const [logsRes, currentStaffRes, absentStaffRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/logs?date=${date}`, fetchOptions),
        fetch('/api/admin/current-staff', fetchOptions),
        fetch(`/api/admin/absent-staff?date=${date}`, fetchOptions),
        fetch('/api/admin/settings', fetchOptions)
      ]);

      const [logsData, currentStaffData, absentStaffData, settingsData] = await Promise.all([
        logsRes.json(),
        currentStaffRes.json(),
        absentStaffRes.json(),
        settingsRes.json()
      ]);

      if (!logsRes.ok || !currentStaffRes.ok || !absentStaffRes.ok || !settingsRes.ok) {
        throw new Error('One or more API requests failed');
      }

      setLogs(logsData.logs || []);
      setCurrentStaff(currentStaffData.currentStaff || []);
      setAbsentStaff(absentStaffData.absentStaff || []);
      setSettings(settingsData.settings || { latenessTime: "09:00", workEndTime: "17:00" });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching admin data:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Real-time data fetching
  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchLogs(), fetchCurrentStaff(), fetchAbsentStaff()])
    setLastUpdate(new Date())
  }, [filters])

  useEffect(() => {
    fetchAllData()
    fetchSettings()
  }, [fetchAllData])

  // Auto-refresh every 30 seconds if authenticated
  useEffect(() => {
    if (!autoRefresh || !adminToken || !isAuthenticated) return;

    const interval = setInterval(() => {
      fetchAdminData(adminToken).catch(error => {
        console.error("Auto-refresh failed:", error);
        if (error.message === "Unauthorized") {
          setIsAuthenticated(false);
          clearInterval(interval);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, adminToken, isAuthenticated]);

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.date) params.append("date", filters.date)
      if (filters.department !== "all") params.append("department", filters.department)
      if (filters.lateOnly) params.append("lateOnly", "true")

      const response = await fetch(`/api/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Error fetching logs:", error)
      throw error;
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentStaff = async () => {
    try {
      console.log("Fetching current staff...")
      const response = await fetch("/api/admin/current-staff", {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch current staff');
      }
      const data = await response.json()
      setCurrentStaff(data.currentStaff || [])
    } catch (error) {
      console.error("Error fetching current staff:", error)
      throw error;
    }
  }

  const fetchAbsentStaff = async () => {
    try {
      const response = await fetch(`/api/admin/absent-staff?date=${filters.date}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch absent staff');
      }
      const data = await response.json()
      setAbsentStaff(data.absentStaff || [])
    } catch (error) {
      console.error("Error fetching absent staff:", error)
      throw error;
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
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
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${adminToken}` },
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
    <div className="web-app-container min-h-screen bg-white">
      {/* Header */}
      <header className="gradient-primary shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <Image src={logo} alt="" width={200} height={200}/>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Admin Dashboard</h1>
                <div className="flex items-center gap-3 text-blue-200 text-xs sm:text-sm">
                  <span>Staff Attendance Management</span>
                  {autoRefresh && <div className="live-indicator">Live</div>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="text-white text-xs">Last updated: {lastUpdate.toLocaleTimeString()}</div>
              <button onClick={fetchAllData} className="btn-outline-white flex items-center gap-1 text-xs sm:text-sm">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button onClick={exportToCSV} className="btn-outline-white flex items-center gap-1 text-xs sm:text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button onClick={handleLogout} className="btn-outline-white flex items-center gap-1 text-xs sm:text-sm">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
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
          <TabsList className="bg-white shadow-md border flex flex-wrap">
            <TabsTrigger value="logs" className="data-[state=active]:bg-primary-navy data-[state=active]:text-white">
              Attendance Logs
            </TabsTrigger>
            <TabsTrigger value="current" className="data-[state=active]:bg-primary-navy data-[state=active]:text-white">
              Currently In
            </TabsTrigger>
            <TabsTrigger value="absent" className="data-[state=active]:bg-primary-navy data-[state=active]:text-white">
              Absent Staff
            </TabsTrigger>
            <TabsTrigger value="staff-directory" className="data-[state=active]:bg-primary-navy data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Staff Directory
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
            <Card className="bg-accent-teal/15">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-navy">
                  <Filter className="w-5 h-5 text-accent-teal" />
                  Filter Options
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row flex-wrap gap-4">
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
                  <Table className="min-w-[400px] text-xs align-middle">
                    <TableCaption>Attendance records for the selected date.</TableCaption>
                    <TableHeader>
                      <TableRow className="sticky top-0 bg-white z-10">
                        <TableHead className="px-1 py-2 whitespace-nowrap">Staff ID</TableHead>
                        <TableHead className="px-1 py-2 whitespace-nowrap">Name</TableHead>
                        <TableHead className="px-1 py-2 whitespace-nowrap">Department</TableHead>
                        <TableHead className="px-1 py-2 whitespace-nowrap">Check-In Time</TableHead>
                        <TableHead className="px-1 py-2 whitespace-nowrap" style={{maxWidth: 40}}>Check-In Photo</TableHead>
                        <TableHead className="px-1 py-2 whitespace-nowrap">Late?</TableHead>
                        <TableHead className="px-1 py-2 whitespace-nowrap">Check-In Early?</TableHead>
                        <TableHead className="px-1 py-2 whitespace-nowrap">Check-Out Time</TableHead>
                        <TableHead className="px-1 py-2 whitespace-nowrap" style={{maxWidth: 40}}>Check-Out Photo</TableHead>
                        <TableHead className="px-1 py-2 whitespace-nowrap">Check-Out Early?</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupLogsByStaffAndDate(logs).map((group, index) => {
                        let checkInEarly = false;
                        if (group.checkIn && group.checkIn.timestamp) {
                          const checkInTime = new Date(group.checkIn.timestamp).toTimeString().slice(0, 5);
                          checkInEarly = checkInTime < settings.latenessTime;
                        }
                        let checkOutEarly = false;
                        if (group.checkOut && group.checkOut.timestamp) {
                          const checkOutTime = new Date(group.checkOut.timestamp).toTimeString().slice(0, 5);
                          checkOutEarly = checkOutTime < settings.workEndTime;
                        }
                        return (
                          <TableRow key={index}>
                            <TableCell className="px-1 py-2 font-mono font-medium text-primary-navy whitespace-nowrap">{group.staff.staffId}</TableCell>
                            <TableCell className="px-1 py-2 font-medium text-primary-navy whitespace-nowrap">{group.staff.staffName}</TableCell>
                            <TableCell className="px-1 py-2 text-gray-600 whitespace-nowrap">{group.staff.department}</TableCell>
                            <TableCell className="px-1 py-2 text-gray-600 whitespace-nowrap">{group.checkIn ? new Date(group.checkIn.timestamp).toLocaleTimeString() : <span className="text-gray-400 text-xs">-</span>}</TableCell>
                            <TableCell className="px-1 py-2" style={{maxWidth: 40}}>
                              {group.checkIn && group.checkIn.photoUrl ? (
                                <img
                                  src={group.checkIn.photoUrl}
                                  alt="Check-in"
                                  className="w-6 h-6 object-cover rounded cursor-pointer border"
                                  style={{maxWidth: 24, maxHeight: 24}}
                                  onClick={() => setModalImage(group.checkIn?.photoUrl || null)}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">No photo</span>
                              )}
                            </TableCell>
                            <TableCell className="px-1 py-2">
                              {group.checkIn && group.checkIn.isLate ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-red-400 bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold">Late</span>
                              ) : <span className="text-gray-400 text-xs">-</span>}
                            </TableCell>
                            <TableCell className="px-1 py-2">
                              {checkInEarly ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-green-400 bg-green-100 text-green-700 px-2 py-1 text-xs font-semibold">Early</span>
                              ) : <span className="text-gray-400 text-xs">-</span>}
                            </TableCell>
                            <TableCell className="px-1 py-2 text-gray-600 whitespace-nowrap">{group.checkOut ? new Date(group.checkOut.timestamp).toLocaleTimeString() : <span className="text-gray-400 text-xs">-</span>}</TableCell>
                            <TableCell className="px-1 py-2" style={{maxWidth: 40}}>
                              {group.checkOut && group.checkOut.photoUrl ? (
                                <img
                                  src={group.checkOut.photoUrl}
                                  alt="Check-out"
                                  className="w-6 h-6 object-cover rounded cursor-pointer border"
                                  style={{maxWidth: 24, maxHeight: 24}}
                                  onClick={() => setModalImage(group.checkOut?.photoUrl || null)}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">No photo</span>
                              )}
                            </TableCell>
                            <TableCell className="px-1 py-2">
                              {checkOutEarly ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-green-400 bg-green-100 text-green-700 px-2 py-1 text-xs font-semibold">Early</span>
                              ) : <span className="text-gray-400 text-xs">-</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-accent-teal/5 rounded-lg border border-accent-teal/20 hover:bg-accent-teal/10 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-primary-navy">{staff.staffName}</p>
                        <p className="text-sm text-gray-600">
                          {staff.department} • {staff.staffId}
                        </p>
                      </div>
                      <div className="text-left sm:text-right mt-2 sm:mt-0">
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
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div>
                        <p className="font-semibold text-primary-navy">{staff.name}</p>
                        <p className="text-sm text-gray-600">
                          {staff.department} • {staff.position}
                        </p>
                      </div>
                      <div className="text-left sm:text-right mt-2 sm:mt-0">
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

          <TabsContent value="staff-directory" className="space-y-6">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-primary-navy">Staff Directory</CardTitle>
                <CardDescription>
                  {/* Show total staff count here when implemented */}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffDirectoryTable />
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

      <Dialog open={!!modalImage} onOpenChange={() => setModalImage(null)}>
        <DialogContent>
          {modalImage && (
            <img src={modalImage} alt="Check-in" className="w-full h-auto max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StaffDirectoryTable() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchStaff() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/staff");
        const data = await res.json();
        setStaff(data.staff || []);
      } catch (err) {
        setError("Failed to fetch staff list");
      } finally {
        setLoading(false);
      }
    }
    fetchStaff();
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search by name..."
          className="border rounded px-3 py-2 w-full max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff
              .filter((s: Staff) => s.name.toLowerCase().includes(search.toLowerCase()))
              .map((s: Staff) => (
                <TableRow key={s.staffId}>
                  <TableCell>{s.staffId}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.department}</TableCell>
                  <TableCell>{s.position}</TableCell>
                  <TableCell>
                    <button
                      className="px-3 py-1 bg-primary-navy text-white rounded hover:bg-primary-navy/80"
                      onClick={() => {
                        setSelectedStaff(s);
                        setModalOpen(true);
                      }}
                    >
                      View Details
                    </button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
      <StaffDetailModal
        staff={selectedStaff}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

interface CircleStatProps {
  value: number;
  max: number;
  color: string;
  label: string;
  icon: React.ElementType;
}

function CircleStat({ value, max, color, label, icon: Icon }: CircleStatProps) {
  const radius = 32;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = max > 0 ? value / max : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center" style={{ width: radius * 2 }}>
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2}>
          <circle
            stroke="#e5e7eb"
            fill="none"
            strokeWidth={stroke}
            cx={radius}
            cy={radius}
            r={normalizedRadius}
          />
          <circle
            stroke={color}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </div>
      <div className="flex flex-col items-center mt-2" style={{ color }}>
        {Icon && <Icon className="w-5 h-5 mb-1" />}
        <span className="text-xs font-medium">{label}</span>
      </div>
    </div>
  );
}

function StaffDetailModal({ staff, open, onOpenChange }: StaffDetailModalProps) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (!staff) return;
    setLoading(true);
    setError(null);
    const adminToken = getCookie("adminToken");
    fetch(`/api/admin/logs?staffId=${staff.staffId}&month=${selectedMonth}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .catch(() => setError("Failed to fetch logs"))
      .finally(() => setLoading(false));
  }, [staff, selectedMonth]);

  // Compute stats for the selected month
  const earlyCheckIn = logs.filter((l: AttendanceLog) => l.type === "check-in" && l.checkInType === "early").length;
  const late = logs.filter((l: AttendanceLog) => l.type === "check-in" && l.checkInType === "late").length;
  const present = logs.filter((l: AttendanceLog) => l.type === "check-in").length;
  const absent = logs.filter((l: AttendanceLog) => l.type === "absent").length;
  const earlyLeft = logs.filter((l: AttendanceLog) => l.type === "check-out" && l.checkOutType === "early").length;

  // Get unique months from logs for dropdown
  const months = Array.from(
    new Set(logs.map((l) => l.date?.slice(0, 7)))
  ).sort().reverse();

  // Sort logs by day
  const sortedLogs = [...logs].sort((a, b) => {
    if (sortOrder === "asc") return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date);
  });

  interface DailyLog {
    checkIn?: AttendanceLog;
    checkOut?: AttendanceLog;
    absent?: boolean;
  }

  // Group logs by date
  const logsByDate: { [key: string]: DailyLog } = {};
  logs.forEach(log => {
    const date = log.date;
    if (!logsByDate[date]) logsByDate[date] = {};
    if (log.type === "check-in") {
      logsByDate[date].checkIn = log;
    } else if (log.type === "check-out") {
      logsByDate[date].checkOut = log;
    } else if (log.type === "absent") {
      logsByDate[date].absent = true;
    }
  });
  const days = Object.keys(logsByDate).sort((a, b) => sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Staff Details</DialogTitle>
          <DialogDescription>
            {staff ? (
              <>
                <span><b>Name:</b> {staff.name}</span> | <span><b>Staff ID:</b> {staff.staffId}</span> | <span><b>Department:</b> {staff.department}</span> | <span><b>Position:</b> {staff.position}</span>
              </>
            ) : (
              <span>No staff selected.</span>
            )}
          </DialogDescription>
        </DialogHeader>
        {staff && (
          <div className="flex flex-col gap-6 mt-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center py-4 mb-6">
              <CircleStat value={earlyCheckIn} max={present} color="#22c55e" label="Early Check-in" icon={CalendarDays} />
              <CircleStat value={late} max={present} color="#ef4444" label="Late Days" icon={Clock} />
              <CircleStat value={absent} max={logs.length} color="#eab308" label="Absent Days" icon={XCircle} />
              <CircleStat value={earlyLeft} max={present} color="#3b82f6" label="Early Left" icon={ArrowLeftCircle} />
            </div>
            {/* Month Dropdown and Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.length === 0 ? (
                      <SelectItem value={selectedMonth}>{selectedMonth}</SelectItem>
                    ) : (
                      months.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-6 text-lg font-semibold">
                <span>Total Present: {present}</span>
                <span>Total Absent: {absent}</span>
                <span>Total Late: {late}</span>
              </div>
            </div>
            {/* Logs Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>Day {sortOrder === "asc" ? "↑" : "↓"}</button>
                    </TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead>Check-out Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                  ) : error ? (
                    <TableRow><TableCell colSpan={4} className="text-red-500">{error}</TableCell></TableRow>
                  ) : days.length === 0 ? (
                    <TableRow><TableCell colSpan={4}>No logs for this month.</TableCell></TableRow>
                  ) : (
                    days.map(date => {
                      const entry = logsByDate[date];
                      let status = "";
                      if (entry.absent) {
                        status = "Absent";
                      } else if (entry.checkIn && entry.checkIn.checkInType === "late") {
                        status = "Late";
                      } else if (entry.checkIn && entry.checkIn.checkInType === "early") {
                        status = "Early";
                      }
                      if (entry.checkOut?.checkOutType === "early") {
                        status = status ? `${status}, Early Left` : "Early Left";
                      }
                      return (
                        <TableRow key={date}>
                          <TableCell>{date}</TableCell>
                          <TableCell>{entry.checkIn ? entry.checkIn.time : ""}</TableCell>
                          <TableCell>{entry.checkOut ? entry.checkOut.time : ""}</TableCell>
                          <TableCell>{status}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
