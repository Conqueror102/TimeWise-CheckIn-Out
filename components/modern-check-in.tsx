// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Label } from "@/components/ui/label"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { QrCode, KeyRound, Camera, CheckCircle, Clock, AlertTriangle, LogIn, LogOut } from "lucide-react"
// import { QRScanner } from "./qr-scanner"

// export function ModernCheckIn() {
//   const [staffId, setStaffId] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [message, setMessage] = useState("")
//   const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success")
//   const [showScanner, setShowScanner] = useState(false)

//   const handleCheckIn = async (id: string, type: "check-in" | "check-out") => {
//     if (!id.trim()) {
//       setMessage("Please enter a staff ID")
//       setMessageType("error")
//       return
//     }

//     setLoading(true)
//     setMessage("")

//     try {
//       const response = await fetch("/api/attendance/checkin", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ staffId: id.trim(), type }),
//       })

//       const data = await response.json()

//       if (data.success) {
//         setMessage(
//           `${data.staff} ${type === "check-in" ? "checked in" : "checked out"} successfully${data.isLate ? " (Late)" : ""}`,
//         )
//         setMessageType(data.isLate ? "warning" : "success")
//         setStaffId("")
//       } else {
//         setMessage(data.error || `${type} failed`)
//         setMessageType("error")
//       }
//     } catch (error) {
//       setMessage("Network error. Please try again.")
//       setMessageType("error")
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleQRScan = (scannedId: string) => {
//     setStaffId(scannedId)
//     setShowScanner(false)
//   }

//   const getMessageIcon = () => {
//     switch (messageType) {
//       case "success":
//         return <CheckCircle className="w-4 h-4" />
//       case "warning":
//         return <AlertTriangle className="w-4 h-4" />
//       case "error":
//         return <AlertTriangle className="w-4 h-4" />
//     }
//   }

//   const getAlertVariant = () => {
//     switch (messageType) {
//       case "error":
//         return "destructive"
//       default:
//         return "default"
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
//       <div className="w-full max-w-md space-y-6">
//         <div className="text-center space-y-2">
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
//             Staff Check-In
//           </h1>
//           <p className="text-gray-600">Welcome! Please check in or out</p>
//         </div>

//         <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
//           <CardHeader className="text-center">
//             <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mb-4">
//               <Clock className="w-6 h-6 text-white" />
//             </div>
//             <CardTitle className="text-xl">Attendance System</CardTitle>
//             <CardDescription>Enter your staff ID or scan your QR code</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <Tabs defaultValue="manual" className="w-full">
//               <TabsList className="grid w-full grid-cols-2 bg-gray-100">
//                 <TabsTrigger value="manual" className="flex items-center gap-2 data-[state=active]:bg-white">
//                   <KeyRound className="w-4 h-4" />
//                   Manual ID
//                 </TabsTrigger>
//                 <TabsTrigger value="qr" className="flex items-center gap-2 data-[state=active]:bg-white">
//                   <QrCode className="w-4 h-4" />
//                   QR Code
//                 </TabsTrigger>
//               </TabsList>

//               <TabsContent value="manual" className="space-y-4 mt-6">
//                 <div className="space-y-2">
//                   <Label htmlFor="staffId" className="text-sm font-medium">
//                     Staff ID
//                   </Label>
//                   <Input
//                     id="staffId"
//                     type="text"
//                     placeholder="e.g., AB1234"
//                     value={staffId}
//                     onChange={(e) => setStaffId(e.target.value.toUpperCase())}
//                     className="text-center font-mono text-lg tracking-wider border-gray-200 focus:border-blue-500 focus:ring-blue-500"
//                   />
//                 </div>
//               </TabsContent>

//               <TabsContent value="qr" className="space-y-4 mt-6">
//                 <div className="text-center">
//                   {!showScanner ? (
//                     <Button
//                       onClick={() => setShowScanner(true)}
//                       variant="outline"
//                       className="w-full border-dashed border-2 border-gray-300 hover:border-blue-500 h-20"
//                     >
//                       <div className="flex flex-col items-center gap-2">
//                         <Camera className="w-6 h-6" />
//                         <span>Start QR Scanner</span>
//                       </div>
//                     </Button>
//                   ) : (
//                     <div className="space-y-4">
//                       <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
//                     </div>
//                   )}
//                 </div>
//                 {staffId && (
//                   <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
//                     <p className="text-sm text-green-700 font-medium">Scanned ID:</p>
//                     <p className="font-mono font-bold text-lg text-green-800">{staffId}</p>
//                   </div>
//                 )}
//               </TabsContent>
//             </Tabs>

//             {message && (
//               <Alert variant={getAlertVariant()} className="mt-6">
//                 {getMessageIcon()}
//                 <AlertDescription>{message}</AlertDescription>
//               </Alert>
//             )}

//             <div className="flex gap-3 mt-6">
//               <Button
//                 onClick={() => handleCheckIn(staffId, "check-in")}
//                 disabled={loading || !staffId.trim()}
//                 className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3"
//               >
//                 <LogIn className="w-4 h-4 mr-2" />
//                 {loading ? "Processing..." : "Check In"}
//               </Button>
//               <Button
//                 onClick={() => handleCheckIn(staffId, "check-out")}
//                 disabled={loading || !staffId.trim()}
//                 variant="outline"
//                 className="flex-1 border-gray-300 hover:bg-gray-50 font-medium py-3"
//               >
//                 <LogOut className="w-4 h-4 mr-2" />
//                 {loading ? "Processing..." : "Check Out"}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         <div className="text-center">
//           <p className="text-sm text-gray-500">Need help? Contact your administrator</p>
//         </div>
//       </div>
//     </div>
//   )
// }
