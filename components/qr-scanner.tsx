// "use client"

// import { useEffect, useRef, useState } from "react"
// import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode"
// import { Button } from "@/components/ui/button"
// import { Camera, X } from "lucide-react"

// interface QRScannerProps {
//   onScan: (result: string) => void
//   onClose?: () => void
// }

// export function QRScanner({ onScan, onClose }: QRScannerProps) {
//   const scannerRef = useRef<Html5QrcodeScanner | null>(null)
//   const [isScanning, setIsScanning] = useState(false)
//   const [error, setError] = useState<string>("")

//   useEffect(() => {
//     if (!isScanning) {
//       setIsScanning(true)
//       setError("")

//       const config = {
//         fps: 10,
//         qrbox: { width: 250, height: 250 },
//         aspectRatio: 1.0,
//         supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
//       }

//       scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false)

//       scannerRef.current.render(
//         (decodedText) => {
//           console.log("QR Code scanned:", decodedText)
//           onScan(decodedText)
//           cleanup()
//         },
//         (error) => {
//           // Only log actual errors, not scanning attempts
//           if (error.includes("NotFoundException")) {
//             return // Ignore "not found" errors during scanning
//           }
//           console.warn("QR scan error:", error)
//         },
//       )
//     }

//     const cleanup = () => {
//       if (scannerRef.current) {
//         scannerRef.current.clear().catch((err) => {
//           console.warn("Error clearing scanner:", err)
//         })
//         scannerRef.current = null
//       }
//       setIsScanning(false)
//     }

//     return cleanup
//   }, [onScan, isScanning])

//   const handleStop = () => {
//     if (scannerRef.current) {
//       scannerRef.current.clear().catch(console.error)
//       scannerRef.current = null
//     }
//     setIsScanning(false)
//     onClose?.()
//   }

//   return (
//     <div className="w-full max-w-md mx-auto">
//       <div className="bg-white rounded-lg shadow-lg p-4">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold flex items-center gap-2">
//             <Camera className="w-5 h-5" />
//             Scan QR Code
//           </h3>
//           <Button variant="ghost" size="sm" onClick={handleStop}>
//             <X className="w-4 h-4" />
//           </Button>
//         </div>

//         <div id="qr-reader" className="w-full"></div>

//         {error && (
//           <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
//             <p className="text-red-600 text-sm">{error}</p>
//           </div>
//         )}

//         <div className="mt-4 text-center">
//           <p className="text-sm text-gray-600">Position the QR code within the frame to scan</p>
//           <Button variant="outline" onClick={handleStop} className="mt-2">
//             Cancel Scanning
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }
