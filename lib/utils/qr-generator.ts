import QRCode from "qrcode"

export async function generateQRCode(staffId: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(staffId, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
    return qrCodeDataURL
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}
