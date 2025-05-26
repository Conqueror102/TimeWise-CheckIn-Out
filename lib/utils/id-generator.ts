export function generateStaffId(): string {
  // Generate mixed alphanumeric ID: 2 letters + 4 numbers
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"

  let id = ""

  // Add 2 random letters
  for (let i = 0; i < 2; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length))
  }

  // Add 4 random numbers
  for (let i = 0; i < 4; i++) {
    id += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }

  return id
}

export async function generateUniqueStaffId(db: any): Promise<string> {
  let staffId: string
  let exists = true

  while (exists) {
    staffId = generateStaffId()
    const existingStaff = await db.collection("staff").findOne({ staffId })
    exists = !!existingStaff
  }

  return staffId!
}
