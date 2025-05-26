// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { Users, Clock, UserX, Settings, Download, Filter, AlertTriangle, UserPlus, LogOut } from "lucide-react"
// import type { AttendanceLog, Staff, AdminSettings } from "@/lib/models"
// import { StaffRegistration } from "./staff-registration"
// import { setAdminAuthenticated } from "@/lib/auth"

// interface ModernAdminDashboardProps {
//   onLogout: () => void
// }

// export function ModernAdminDashboard({ onLogout }: ModernAdminDashboardProps) {
//   const [logs, setLogs] = useState<AttendanceLog[]>([])
//   const [currentStaff, setCurrentStaff] = useState<AttendanceLog[]>([])
//   const [absentStaff, setAbsentStaff] = useState<Staff[]>([])
//   const [settings, setSettings] = useState<AdminSettings>({ latenessTime: "09:00", workEndTime: "17:00" })
//   const [filters, setFilters] = useState({
//     date: new Date().toISOString().split("T")[0],
//     department: "all",
//     lateOnly: false,
//   })
//   const [loading, setLoading] = useState(false)

//   useEffect(() => {
//     fetchLogs()
//     fetchCurrentStaff()
//     fetchAbsentStaff()
//     fetchSettings()
//   }, [])

//   useEffect(() => {
//     fetchLogs()
//     fetchAbsentStaff()
//   }, [filters])

//   const fetchLogs = async () => {
//     setLoading(true)
//     try {
//       const params = new URLSearchParams()
//       if (filters.date) params.append("date", filters.date)
//       if (filters.department !== "all") params.append("department", filters.department)
//       if (filters.lateOnly) params.append("lateOnly", "true")

//       const response = await fetch(`/api/admin/logs?${params}`)
//       const data = await response.json()
//       setLogs(data.logs || [])
//     } catch (error) {
//       console.error("Error fetching logs:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchCurrentStaff = async () => {
//     try {
//       const response = await fetch("/api/admin/current-staff")
//       const data = await response.json()
//       setCurrentStaff(data.currentStaff || [])
//     } catch (error) {
//       console.error("Error fetching current staff:", error)
//     }
//   }

//   const fetchAbsentStaff = async () => {
//     try {
//       const response = await fetch(`/api/admin/absent-staff?date=${filters.date}`)
//       const data = await response.json()
//       setAbsentStaff(data.absentStaff || [])
//     } catch (error) {
//       console.error("Error fetching absent staff:", error)
//     }
//   }

//   const fetchSettings = async () => {
//     try {
//       const response = await fetch("/api/admin/settings")
//       const data = await response.json()
//       setSettings(data.settings || { latenessTime: "09:00", workEndTime: "17:00" })
//     } catch (error) {
//       console.error("Error fetching settings:", error)
//     }
//   }

//   const updateSettings = async () => {
//     try {
//       await fetch("/api/admin/settings", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(settings),
//       })
//       alert("Settings updated successfully!")
//     } catch (error) {
//       console.error("Error updating settings:", error)
//       alert("Failed to update settings")
//     }
//   }

//   const exportToCSV = () => {
//     const headers = ["Staff ID", "Name", "Department", "Type", "Date", "Time", "Late"]
//     const csvContent = [
//       headers.join(","),
//       ...logs.map((log) =>
//         [
//           log.staffId,
//           log.staffName,
//           log.department,
//           log.type,
//           log.date,
//           new Date(log.timestamp).toLocaleTimeString(),
//           log.isLate ? "Yes" : "No",
//         ].join(","),
//       ),
//     ].join("\n")

//     const blob = new Blob([csvContent], { type: "text/csv" })
//     const url = window.URL.createObjectURL(blob)
//     const a = document.createElement("a")
//     a.href = url
//     a.download = `attendance-logs-${filters.date}.csv`
//     a.click()
//     window.URL.revokeObjectURL(url)
//   }

//   const handleLogout = () => {
//     setAdminAuthenticated(false)
//     onLogout()
//   }

//   const departments = [
//     "all",
//     "Human Resources",
//     "Engineering",
//     "Marketing",
//     "Sales",
//     "Finance",
//     "Operations",
//     "Customer Support",
//   ]

//   const lateCount = logs.filter((log) => log.date === filters.date && log.isLate).length

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
//       <div className="container mx-auto p-6 space-y-6">
//         {/* Header */}
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
//               Admin Dashboard
//             </h1>
//             <p className="text-gray-600 mt-1">Manage staff attendance and system settings</p>
//           </div>
//           <div className="flex gap-3">
//             <Button onClick={exportToCSV} variant="outline" className="border-gray-300">
//               <Download className="w-4 h-4 mr-2" />
//               Export CSV
//             </Button>
//             <Button onClick={handleLogout} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
//               <LogOut className="w-4 h-4 mr-2" />
//               Logout
//             </Button>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-green-600 text-white">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium opacity-90">Currently Clocked In</CardTitle>
//               <Users className="h-5 w-5 opacity-80" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold">{currentStaff.length}</div>
//               <p className="text-xs opacity-80 mt-1">Active staff members</p>
//             </CardContent>
//           </Card>

//           <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-500 to-red-500 text-white">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium opacity-90">Late Today</CardTitle>
//               <Clock className="h-5 w-5 opacity-80" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold">{lateCount}</div>
//               <p className="text-xs opacity-80 mt-1">Late arrivals</p>
//             </CardContent>
//           </Card>

//           <Card className="shadow-lg border-0 bg-gradient-to-r from-red-500 to-pink-500 text-white">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium opacity-90">Absent Today</CardTitle>
//               <UserX className="h-5 w-5 opacity-80" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold">{absentStaff.length}</div>
//               <p className="text-xs opacity-80 mt-1">Missing staff</p>
//             </CardContent>
//           </Card>
//         </div>

//         <Tabs defaultValue="logs" className="space-y-6">
//           <TabsList className="bg-white shadow-md border-0">
//             <TabsTrigger value="logs" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
//               Attendance Logs
//             </TabsTrigger>
//             <TabsTrigger
//               value="current"
//               className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
//             >
//               Currently In
//             </TabsTrigger>
//             <TabsTrigger value="absent" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
//               Absent Staff
//             </TabsTrigger>
//             <TabsTrigger value="register" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
//               <UserPlus className="w-4 h-4 mr-2" />
//               Register Staff
//             </TabsTrigger>
//             <TabsTrigger value="settings" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700">
//               <Settings className="w-4 h-4 mr-2" />
//               Settings
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="logs" className="space-y-6">
//             {/* Filters */}
//             <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Filter className="w-5 h-5 text-purple-600" />
//                   Filters
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="flex flex-wrap gap-4">
//                 <div className="flex items-center gap-2">
//                   <Label htmlFor="date">Date:</Label>
//                   <Input
//                     id="date"
//                     type="date"
//                     value={filters.date}
//                     onChange={(e) => setFilters({ ...filters, date: e.target.value })}
//                     className="w-auto border-gray-200"
//                   />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Label htmlFor="department">Department:</Label>
//                   <Select
//                     value={filters.department}
//                     onValueChange={(value) => setFilters({ ...filters, department: value })}
//                   >
//                     <SelectTrigger className="w-auto border-gray-200">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {departments.map((dept) => (
//                         <SelectItem key={dept} value={dept}>
//                           {dept === "all" ? "All Departments" : dept}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="checkbox"
//                     id="lateOnly"
//                     checked={filters.lateOnly}
//                     onChange={(e) => setFilters({ ...filters, lateOnly: e.target.checked })}
//                     className="rounded border-gray-300"
//                   />
//                   <Label htmlFor="lateOnly">Late arrivals only</Label>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Logs Table */}
//             <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//               <CardHeader>
//                 <CardTitle>Attendance Logs</CardTitle>
//                 <CardDescription>{loading ? "Loading..." : `${logs.length} records found`}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead>
//                       <tr className="border-b border-gray-200">
//                         <th className="text-left p-3 font-semibold text-gray-700">Staff ID</th>
//                         <th className="text-left p-3 font-semibold text-gray-700">Name</th>
//                         <th className="text-left p-3 font-semibold text-gray-700">Department</th>
//                         <th className="text-left p-3 font-semibold text-gray-700">Type</th>
//                         <th className="text-left p-3 font-semibold text-gray-700">Time</th>
//                         <th className="text-left p-3 font-semibold text-gray-700">Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {logs.map((log, index) => (
//                         <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
//                           <td className="p-3 font-mono font-medium text-blue-600">{log.staffId}</td>
//                           <td className="p-3 font-medium">{log.staffName}</td>
//                           <td className="p-3 text-gray-600">{log.department}</td>
//                           <td className="p-3">
//                             <Badge
//                               variant={log.type === "check-in" ? "default" : "secondary"}
//                               className={
//                                 log.type === "check-in" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
//                               }
//                             >
//                               {log.type}
//                             </Badge>
//                           </td>
//                           <td className="p-3 text-gray-600">{new Date(log.timestamp).toLocaleString()}</td>
//                           <td className="p-3">
//                             {log.isLate && (
//                               <Badge
//                                 variant="destructive"
//                                 className="flex items-center gap-1 w-fit bg-red-100 text-red-800"
//                               >
//                                 <AlertTriangle className="w-3 h-3" />
//                                 Late
//                               </Badge>
//                             )}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                   {logs.length === 0 && (
//                     <div className="text-center py-8 text-gray-500">
//                       No attendance records found for the selected filters.
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="current">
//             <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//               <CardHeader>
//                 <CardTitle className="text-green-700">Currently Clocked In</CardTitle>
//                 <CardDescription>{currentStaff.length} staff members currently in office</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   {currentStaff.map((staff, index) => (
//                     <div
//                       key={index}
//                       className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200"
//                     >
//                       <div>
//                         <p className="font-semibold text-green-800">{staff.staffName}</p>
//                         <p className="text-sm text-green-600">
//                           {staff.department} • {staff.staffId}
//                         </p>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-sm text-green-600">Checked in at</p>
//                         <p className="font-mono text-sm font-medium text-green-800">
//                           {new Date(staff.timestamp).toLocaleTimeString()}
//                         </p>
//                         {staff.isLate && (
//                           <Badge variant="destructive" className="mt-1 bg-orange-100 text-orange-800">
//                             Late
//                           </Badge>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                   {currentStaff.length === 0 && (
//                     <div className="text-center py-8 text-gray-500">No staff currently clocked in</div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="absent">
//             <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//               <CardHeader>
//                 <CardTitle className="text-red-700">Absent Staff</CardTitle>
//                 <CardDescription>Staff who haven't checked in for {filters.date}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   {absentStaff.map((staff, index) => (
//                     <div
//                       key={index}
//                       className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200"
//                     >
//                       <div>
//                         <p className="font-semibold text-red-800">{staff.name}</p>
//                         <p className="text-sm text-red-600">
//                           {staff.department} • {staff.position}
//                         </p>
//                       </div>
//                       <div className="text-right">
//                         <p className="font-mono text-sm font-medium text-red-800">{staff.staffId}</p>
//                         <Badge variant="destructive" className="bg-red-100 text-red-800">
//                           Absent
//                         </Badge>
//                       </div>
//                     </div>
//                   ))}
//                   {absentStaff.length === 0 && (
//                     <div className="text-center py-8 text-gray-500">All staff have checked in today! 🎉</div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="register">
//             <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2 text-blue-700">
//                   <UserPlus className="w-5 h-5" />
//                   Register New Staff
//                 </CardTitle>
//                 <CardDescription>Add a new staff member to the system</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <StaffRegistration />
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="settings">
//             <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2 text-gray-700">
//                   <Settings className="w-5 h-5" />
//                   System Settings
//                 </CardTitle>
//                 <CardDescription>Configure lateness time and work hours</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="latenessTime" className="text-sm font-medium">
//                       Lateness Time
//                     </Label>
//                     <Input
//                       id="latenessTime"
//                       type="time"
//                       value={settings.latenessTime}
//                       onChange={(e) => setSettings({ ...settings, latenessTime: e.target.value })}
//                       className="border-gray-200"
//                     />
//                     <p className="text-sm text-gray-600">Check-ins after this time will be marked as late</p>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="workEndTime" className="text-sm font-medium">
//                       Work End Time
//                     </Label>
//                     <Input
//                       id="workEndTime"
//                       type="time"
//                       value={settings.workEndTime}
//                       onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
//                       className="border-gray-200"
//                     />
//                     <p className="text-sm text-gray-600">Used to determine absent staff</p>
//                   </div>
//                 </div>
//                 <Button
//                   onClick={updateSettings}
//                   className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
//                 >
//                   Save Settings
//                 </Button>
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   )
// }
