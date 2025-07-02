export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("adminAuthenticated") === "true";
}

export function setAdminAuthenticated(authenticated: boolean): void {
  if (typeof window === "undefined") return;
  if (authenticated) {
    localStorage.setItem("adminAuthenticated", "true");
  } else {
    localStorage.removeItem("adminAuthenticated");
  }
}

export function isScanScreenAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("scanScreenAuthenticated") === "true";
}

export function setScanScreenAuthenticated(authenticated: boolean): void {
  if (typeof window === "undefined") return;
  if (authenticated) {
    localStorage.setItem("scanScreenAuthenticated", "true");
  } else {
    localStorage.removeItem("scanScreenAuthenticated");
  }
}
