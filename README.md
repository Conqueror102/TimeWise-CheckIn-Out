# Staff Check-In System

A comprehensive MERN stack application for managing staff attendance with QR code functionality.

## Features

- 📝 Staff registration with unique ID generation
- 📱 QR code generation and scanning
- ⏰ Check-in/check-out with lateness detection
- 📊 Admin dashboard with real-time monitoring
- 📈 Attendance reports and CSV export
- 🔍 Advanced filtering and search

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
MONGODB_URI=mongodb://localhost:27017/staff_checkin
\`\`\`

For production, use MongoDB Atlas:
\`\`\`env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/staff_checkin?retryWrites=true&w=majority
\`\`\`

### 3. Start MongoDB

Make sure MongoDB is running locally, or use MongoDB Atlas for cloud hosting.

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Usage

1. **Register Staff**: Use the "Register Staff" tab to add new employees
2. **Check-In/Out**: Staff can use their ID or scan QR codes
3. **Admin Dashboard**: Monitor attendance, view reports, and manage settings

## Technology Stack

- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **QR Codes**: qrcode, html5-qrcode

## Database Collections

The system automatically creates these MongoDB collections:

- `staff` - Staff member information
- `attendance` - Check-in/out logs
- `settings` - Admin configuration

## API Endpoints

- `POST /api/staff/register` - Register new staff
- `GET /api/staff/[staffId]` - Get staff details
- `POST /api/attendance/checkin` - Check-in/out
- `GET /api/admin/logs` - Get attendance logs
- `GET /api/admin/current-staff` - Get currently clocked in staff
- `GET /api/admin/absent-staff` - Get absent staff
- `GET/POST /api/admin/settings` - Manage admin settings
