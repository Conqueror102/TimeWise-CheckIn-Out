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
  type: "check-in" | "check-out"
  timestamp: Date
  date: string
  isLate?: boolean
}

export interface AdminSettings {
  _id?: string
  latenessTime: string // Format: "HH:MM"
  workEndTime: string // Format: "HH:MM"
}
