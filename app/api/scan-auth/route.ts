import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (password === process.env.SCAN_SCREEN_PASSWORD) {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "JWT secret not set" }, { status: 500 });
    }
    const token = jwt.sign({ type: "scan" }, JWT_SECRET, { expiresIn: "2h" });
    return NextResponse.json({ success: true, token });
  }
  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
} 