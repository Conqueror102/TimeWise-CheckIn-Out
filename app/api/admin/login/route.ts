import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    if (!JWT_SECRET) {
      return NextResponse.json({ error: "JWT secret not set" }, { status: 500 })
    }

    const isValid = password === process.env.ADMIN_PASSWORD

    if (isValid) {
      const token = jwt.sign({ type: "admin" }, JWT_SECRET, { expiresIn: "2h" })
      return NextResponse.json({ success: true, message: "Login successful", token })
    } else {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
