# Product Requirements Document (PRD) - Automated Hostel Management System

## 1. Overview
This system is a full-stack QR Meal Access System for a hostel environment. It digitizes the process of validating fee payments and providing restricted access to the mess/canteen using dynamic QR codes on a weekly rotating menu.

## 2. Core Functional Categories & Test Cases

### 2.1 User Login & Authentication
- **TC001**: Admin can log in with valid credentials and land on the Admin Dashboard.
- **TC003**: Student can log in with valid credentials and land on the Student Dashboard.
- **TC007**: New Student can sign up via registration form and reach the dashboard.
- **TC008 / TC009**: User can log out successfully, session is cleared, and routing defaults back to the landing page.
- **TC012**: Logged-out users attempting to access authenticated routes are redirected to the Login page.
- **TC013**: From the landing page, an unauthenticated user can click "Sign In" and reach the login view.

### 2.2 Student Dashboard & QR Code Features
- **TC006**: Student can access the dashboard to see core sections (QR Code, Meal History, Payments, Notifications, Weekly Menu).
- **TC004**: QR Code dynamically updates when the student switches the selected meal type (Breakfast, Lunch, Snacks, Dinner).
- **TC016**: QR code remains visible, fully rendered, and usable when switching between multiple meal type selections.

### 2.3 QR Scanner (Admin)
- **TC005**: Admin scans a valid student QR code; system validates it and a new meal record is appended to the meal logs.
- **TC010**: Admin scans an invalid QR code (non-app issued); system denies access with a clear reason, and no meal record is inserted.
- **TC017**: Admin scans a valid QR code, and scanner halts immediately after successful validation to prevent duplicate inserts and continuous re-scanning.

### 2.4 Admin Dashboard Overview & Analytics
- **TC002**: Admin can access the overview dashboard to view aggregated stats (Student count, Payments, Total Meal Counts, Room Occupancy).
- **TC020**: Admin overview specifically displays today's meal counts logically grouped by meal type.

### 2.5 Menu & Student Management
- **TC011**: Admin updates a day's menu item; any student can later view the updated weekly menu structure on their dashboard.
- **TC014**: Admin can search for students in the database by Name or Student ID, and the student list filters precisely to matched entries.
- **TC018**: Admin can edit an existing student profile and save details, ensuring changes are reflected universally in the student list.

### 2.6 Log Management & Filtering
- **TC015**: Admin can narrow meal logs by selecting a specific date range filter (start and end date).
- **TC019**: Admin can query meal logs by searching directly with a student's partial name and validating the filtered results.

## 3. Toolchain
- **Frontend Stack**: React, Vite, Tailwind CSS, TypeScript
- **Backend Stack**: Insforge SDK, PostgreSQL, Direct WebSockets
- **Testing SDK**: TestSprite (E2E Test Plan generation and execution)
