"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, X, Zap, RotateCcw } from "lucide-react"

interface EnhancedQRScannerProps {
  onScan: (result: string) => void
  onClose?: () => void
}

export function EnhancedQRScanner({ onScan, onClose }: EnhancedQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const [cameras, setCameras] = useState<any[]>([])
  const [scannerReady, setScannerReady] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = "qr-reader-enhanced"
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    initializeScanner()

    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [])

  const cleanup = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop()
        }
        await scannerRef.current.clear()
      } catch (err) {
        console.warn("Cleanup error:", err)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
    setScannerReady(false)
  }

  const initializeScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      if (!mountedRef.current) return

      setCameras(devices)

      if (devices.length === 0) {
        setError("No cameras found on this device")
        return
      }

      // Clear any existing scanner
      await cleanup()

      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        if (mountedRef.current) {
          scannerRef.current = new Html5Qrcode(elementId)
          setScannerReady(true)
          startScanning(devices)
        }
      }, 100)
    } catch (err) {
      console.error("Error initializing scanner:", err)
      setError("Failed to access camera. Please check permissions.")
    }
  }

  const startScanning = async (devices: any[]) => {
    if (!scannerRef.current || !mountedRef.current) return

    try {
      setIsScanning(true)
      setError("")

      const cameraId =
        devices.find(
          (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("rear"),
        )?.id || devices[0].id

      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
      }

      await scannerRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          if (!mountedRef.current) return
          console.log("QR Code detected:", decodedText)
          onScan(decodedText)
          // Don't auto-close, let parent handle it
        },
        (error) => {
          if (!error.includes("NotFoundException")) {
            console.warn("QR scan error:", error)
          }
        },
      )
    } catch (err) {
      console.error("Error starting scanner:", err)
      setError("Failed to start camera. Please ensure camera permissions are granted.")
      setIsScanning(false)
    }
  }

  const handleClose = () => {
    cleanup()
    onClose?.()
  }

  const handleRestart = () => {
    cleanup()
    setTimeout(() => {
      if (mountedRef.current) {
        initializeScanner()
      }
    }, 200)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card rounded-xl shadow-lg p-6 border-2 border-accent-teal/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary-dark flex items-center gap-2">
            <div className="p-2 bg-accent-teal/10 rounded-lg">
              <Camera className="w-5 h-5 text-accent-teal" />
            </div>
            QR Code Scanner
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <div
            id={elementId}
            className="w-full rounded-lg overflow-hidden bg-gray-100"
            style={{ minHeight: "300px" }}
          />

          {!isScanning && !error && !scannerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-accent-teal/10 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent-teal animate-pulse" />
                </div>
                <p className="text-gray-600">Initializing camera...</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Try Again
            </Button>
          </div>
        )}

        <div className="mt-4 text-center space-y-3">
          <p className="text-gray-600 text-sm">Position the QR code within the scanning area</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRestart}
              className="flex-1 border-accent-teal/30 text-accent-teal hover:bg-accent-teal/5"
              disabled={!isScanning}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Restart
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
