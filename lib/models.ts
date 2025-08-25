export interface Staff {
  _id?: string
  staffId: string
  name: string
  department: string
  position: string
  qrCode: string
  createdAt: Date
}

export interface AttendanceLog {
  _id?: string
  staffId: string
  staffName: string
  department: string
  type: "check-in" | "check-out" | "absent"
  timestamp: Date
  date: string
  time?: string  // Time in HH:MM format
  isLate?: boolean
  photoUrl?: string  // Optional photo URL for check-in photos
  checkInType?: "early" | "late" | "on-time"
  checkOutType?: "early" | "on-time" | "late"  // Type of checkout (early departure, on time, or late)
}

export interface AdminSettings {
  _id?: string
  latenessTime: string // Format: "HH:MM"
  workEndTime: string // Format: "HH:MM"
}
