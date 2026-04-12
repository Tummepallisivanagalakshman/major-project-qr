# 🏫 Elite Hostel QR Management System (InsForge Edition)

## 📌 Dashboard Overview
The Elite Hostel Management System is a premium, cloud-native solution for automated student residence administration. Originally built on a legacy Python/SQLite stack, the platform has been migrated to **InsForge**, leveraging high-performance PostgreSQL, secure Auth providers, and real-time WebSocket channels.

This system provides a frictionless "Generate-and-Scan" workflow for meal access, integrated financial tracking, and comprehensive residence management.

---

## 🚀 Key Features

### 🎓 For Students
- **Dynamic QR Authorization:** Generates secure, meal-specific QR codes with 10-second refresh intervals to prevent spoofing.
- **Financial Status:** Real-time tracking of fee payments, outstanding dues, and digital receipts (PDF).
- **Culinary Sync:** View the weekly mess menu synchronized in real-time.
- **Personalized Alerts:** Receive broadcast and targeted notifications regarding payments and hostel events.

### 🛡️ For Administrators
- **Intelligent Scanning Lens:** AI-ready scanner that validates fee status, meal eligibility, and account standing in milliseconds.
- **Admin Command Center:** Unified dashboard for monitoring occupancy, revenue, and daily meal distribution metrics.
- **Granular Management:** Dedicated modules for Students, Rooms, Payments, Notifications, Rules, and Reports.
- **Real-time Event Stream:** Instant UI update on successful payments or scanned arrivals.

---

## 🛠️ Technology Stack
- **Frontend:** React 18 (Vite) + TypeScript + Tailwind CSS
- **Design System:** Rich aesthetics with Framer Motion, Lucide Icons, and Glassmorphism effects.
- **Backend-as-a-Service:** InsForge (PostgreSQL Database, Auth, Realtime)
- **Communications:** Real-time subscriptions via InsForge Channels (replacing Socket.IO)

---

## 📂 Project Structure & File Details

### 🏗️ Root Configuration
- [`schema.sql`](./schema.sql): The foundational database blueprint. Contains the SQL definitions for `profiles`, `meal_records`, `payments`, `rooms`, `rules`, `menu`, and `notifications`.
- [`.env`](./.env): Secure configuration for `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY`.
- [`package.json`](./package.json): Project dependencies and Vite scripts.

### ⚙️ Core Logic (`src/lib/`)
- [`insforge.ts`](./src/lib/insforge.ts): Initializes the singleton InsForge client used across the entire application.
- [`api.ts`](./src/lib/api.ts): **The Brain of the Application.** Contains all SDK wrappers for Students and Admins, including fee validation logic, meal access checks, and financial aggregation.
- [`realtime.ts`](./src/lib/realtime.ts): Manages all real-time event subscriptions (broadcasts, payment alerts, and meal scan updates).

### 🖥️ User Interfaces (`src/components/`)
- [`App.tsx`](./src/App.tsx): Root router and global Authentication provider integration.
- [`AdminDashboard.tsx`](./src/components/AdminDashboard.tsx): High-level admin layout with contextually aware sidebar and scanner modal.
- [`StudentDashboard.tsx`](./src/components/StudentDashboard.tsx): Feature-rich student portal with QR generator and payment gateway simulation.
- [`Login.tsx`](./src/components/Login.tsx) & [`Signup.tsx`](./src/components/Signup.tsx): Specialized Auth views using InsForge Identity management.
- [`MenuLogs.tsx`](./src/components/MenuLogs.tsx): Shared component for viewing/editing the weekly mess schedule.
- [`QRScanner.tsx`](./src/components/QRScanner.tsx): Secure camera interface for administrative verification.

### 📊 Admin Modules (`src/components/admin/`)
- `Overview.tsx`: Visual analytics dashboard.
- `StudentManagement.tsx`: Full CRUD operations for resident profiles.
- `RoomManagement.tsx`: Dynamic occupancy and vacancy tracking.
- `PaymentManagement.tsx`: Ledger of all transactions with real-time sync.
- `MealLogs.tsx`: Audit trail of all meal sessions.
- `Reports.tsx`: Historical data visualization and revenue trends.
- `Notifications.tsx`: System-wide announcement broadcast tool.
- `Rules.tsx`: Policy management and distribution.
- `Settings.tsx`: Admin profile and security protocol management.

---

## ⚙️ Installation & Setup

### 1. Prerequisite: InsForge Setup
1. Create a project at [InsForge](https://insforge.com).
2. Use the `Database` tab to run the contents of [`schema.sql`](./schema.sql).
3. Copy your project URL and Anon Key.

### 2. Local Environment
```bash
# Clone the repository
git clone https://github.com/Tummepallisivanagalakshman/major-project-qr.git
cd major-project-qr

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your InsForge credentials

# Start Development Server
npm run dev
```

---

## 👨‍💻 Author

**Tummepalli Sivanagalakshman**

* GitHub: [@Tummepallisivanagalakshman](https://github.com/Tummepallisivanagalakshman)
* LinkedIn: [Siva Nagalakshman](https://www.linkedin.com/in/tummepalli-sivanagalakshman-a3100224b/)
