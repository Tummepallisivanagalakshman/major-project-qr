# 🏫 Elite Hostel QR Management System (InsForge Edition)

## 🌐 Live Deployment
**🚀 [Visit the Live Application](https://44ey5tr2.insforge.site)**

---

## 📌 Dashboard Overview
The Elite Hostel Management System is a premium, cloud-native solution for automated student residence administration. The platform is powered by **InsForge**, leveraging high-performance PostgreSQL, secure Authentication, and real-time WebSocket channels for instant updates.

This system provides a frictionless **"Generate-and-Scan"** workflow for meal access, integrated financial tracking, and comprehensive residence management.

---

## 🚀 Key Features

### 🎓 For Students
- **Dynamic QR Authorization:** Generates secure, meal-specific QR codes with 10-second refresh intervals to prevent spoofing.
- **Biometric Profile Photo:** Securely upload and store profile photos via InsForge Storage for administrative verification.
- **Financial Status:** Real-time tracking of fee payments, outstanding dues, and digital receipts (PDF).
- **Mess Menu Sync:** View the weekly mess menu synchronized in real-time with administrative updates.
- **Personalized Alerts:** Receive broadcast notifications regarding payments and hostel events.

### 🛡️ For Administrators
- **Intelligent Scanning Lens:** AI-ready scanner that validates fee status, meal eligibility, and account standing in milliseconds.
- **Mobile-First Scanner:** Optimized mobile interface with quick-access camera bridge for scanning on the go.
- **Admin Command Center:** Unified dashboard for monitoring occupancy, revenue, and daily meal distribution metrics.
- **Granular Management:** Dedicated modules for Students, Rooms, Payments, Notifications, Rules, and Reports.
- **Real-time Event Stream:** Instant UI updates on successful payments or scanned arrivals via WebSocket subscriptions.

---

## 🛠️ Technology Stack
- **Frontend:** React 18 (Vite) + TypeScript + Tailwind CSS
- **Design System:** Rich aesthetics with Framer Motion, Lucide Icons, and Glassmorphism effects.
- **Backend-as-a-Service:** [InsForge](https://insforge.com) (PostgreSQL Database, Auth, Storage, Realtime)
- **Communications:** Real-time subscriptions via InsForge Channels.

---

## 📂 Project Structure

### 🏗️ Root Configuration
- [`schema.sql`](./schema.sql): Foundational database blueprint for PostgreSQL.
- [`.env`](./.env): Secure configuration for API endpoints and keys.
- [`vite.config.ts`](./vite.config.ts): Optimized build configuration with vendor chunk splitting.

### ⚙️ Core Logic (`src/lib/`)
- [`insforge.ts`](./src/lib/insforge.ts): singleton InsForge client initialization.
- [`api.ts`](./src/lib/api.ts): Central API bridge containing business logic for fee validation, meal access, and storage handling.
- [`realtime.ts`](./src/lib/realtime.ts): WebSocket event management for live updates.

### 🖥️ User Interfaces (`src/components/`)
- [`AdminDashboard.tsx`](./src/components/AdminDashboard.tsx): High-level admin portal with responsive mobile scanner support.
- [`StudentDashboard.tsx`](./src/components/StudentDashboard.tsx): Student portal with QR generation and payment gateway simulation.
- [`QRScanner.tsx`](./src/components/QRScanner.tsx): Secure camera interface for administrative verification.

---

## ⚙️ Installation & Setup

### 1. Prerequisite: InsForge Setup
1. Create a project at [InsForge](https://insforge.com).
2. Run the [`schema.sql`](./schema.sql) in the Database SQL Editor.
3. Configure your storage bucket named `profile-photos` and set it to **Public**.

### 2. Local Environment
```bash
# Clone the repository
git clone https://github.com/Tummepallisivanagalakshman/major-project-qr.git
cd major-project-qr

# Install dependencies
npm install

# Start Development Server
npm run dev
```

---

## 👨‍💻 Author

**Tummepalli Sivanagalakshman**

* GitHub: [@Tummepallisivanagalakshman](https://github.com/Tummepallisivanagalakshman)
* LinkedIn: [Siva Nagalakshman](https://www.linkedin.com/in/tummepalli-sivanagalakshman-a3100224b/)

---
*Deployed with ❤️ on InsForge.*
