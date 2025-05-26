export const ADMIN_PASSWORD = "admin123" // In production, use environment variable

export function validateAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("adminAuthenticated") === "true"
}

export function setAdminAuthenticated(authenticated: boolean): void {
  if (typeof window === "undefined") return
  if (authenticated) {
    localStorage.setItem("adminAuthenticated", "true")
  } else {
    localStorage.removeItem("adminAuthenticated")
  }
}
