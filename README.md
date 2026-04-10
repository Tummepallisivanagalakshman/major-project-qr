# 🏫 Full-Stack QR Meal Access & Hostel Management System

## 📌 Overview
This project is an automated, Full-Stack QR Code–based Meal Access and Hostel Management System. It replaces manual logs by providing students with a fully automated dashboard to generate secure, time-sensitive QR codes for meal access. Administrators can instantly scan these QR codes to verify a student's meal eligibility, strict fee payment status, and block access to unauthorized or unpaid users in real-time.

---

## 🚀 Key Features

### For Students:
* **Interactive Dashboard:** View meal logs, fee dues, room details, and notifications.
* **Dynamic QR Code Generation:** Generates a secure, time-sensitive (1-minute expiry) QR code for current meal times (Breakfast, Lunch, Dinner).
* **Profile Management:** Update contact information securely.
* **Payment Logs & Notifications:** Track previous payments and receive admin notifications.

### For Administrators:
* **Real-time QR Scanning:** Web-based QR scanner using laptop/mobile cameras. Connects via real-time WebSockets (`Socket.IO`).
* **Strict Verification:** Rejects scanning if the QR code is expired, the user has unpaid fees, the account is blocked, or the student already accessed the current meal.
* **Extensive Dashboards:** Monitor live capacity, total payments, and meal counts.
* **Full Management Suite:** Manage Rooms, Menus, Rules, Payments, and broadcast Notifications.

---

## 🛠️ Technologies Used

### Frontend (Client)
* **React 18** (Vite)
* **Tailwind CSS** (for styling)
* **React Router Dom** (for navigation)
* **Socket.io-client** (for real-time admin scan notifications)
* **qrcode.react** & **html5-qrcode** (for QR generation & scanning)
* **Recharts** (for admin analytics)

### Backend (Server)
* **FastAPI** (Python web framework)
* **SQLite3** (Lightweight relation database)
* **python-socketio** (ASGI mode for real-time WebSocket communication)
* **PyJWT & bcrypt** (Authentication & password hashing)
* **Uvicorn** (ASGI server)

---

## ⚙️ How It Works (QR Access Flow)

1. A student logs into their dashboard and clicks **"Generate QR Code"**.
2. The system checks the current server time and creates a securely encoded QR payload restricted to the current meal (e.g., *Lunch*).
3. The Admin uses the dedicated Scanner page. When the QR is scanned, the data is pushed securely to the API.
4. The Backend checks:
   - Is the QR code < 60 seconds old?
   - Are the student's fees fully paid?
   - Is their account marked 'Active'?
   - Have they already claimed this meal today?
5. The Admin receives real-time validation via WebSockets (**Approved** / **Denied** with precise reasons).

---

## ▶️ Setup and Installation

### Method 1: Using Docker (Recommended)

1. Clone the repository.
   ```bash
   git clone https://github.com/Tummepallisivanagalakshman/major-project-qr.git
   cd major-project-qr
   ```

2. Start the services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Access the Application:
   * **Frontend:** `http://localhost:80`
   * **Backend API:** `http://localhost:8000`

### Method 2: Manual Local Setup

**1. Setup Backend:**
```bash
git clone https://github.com/Tummepallisivanagalakshman/major-project-qr.git
cd major-project-qr

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```
*(The backend runs on `http://localhost:8000`)*

**2. Setup Frontend:**
Open a new terminal window:
```bash
# Install Node dependencies
npm install

# Start the Vite development frontend
npm run dev
```
*(The frontend runs on `http://localhost:5173`)*

---

## 👨‍💻 Author

**Tummepalli Sivanagalakshman**

* GitHub: https://github.com/Tummepallisivanagalakshman
* LinkedIn: https://www.linkedin.com/in/tummepalli-sivanagalakshman-a3100224b/
