import { type NextRequest, NextResponse } from "next/server"
import { validateAdminPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const isValid = validateAdminPassword(password)

    if (isValid) {
      return NextResponse.json({ success: true, message: "Login successful" })
    } else {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
