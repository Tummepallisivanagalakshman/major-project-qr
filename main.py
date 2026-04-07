import sqlite3
import base64
import json
import bcrypt
import jwt
from typing import Optional, Any
from fastapi import FastAPI, Depends, HTTPException, Request, Response, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import socketio

# -------------------------------------------------------------------
# Configuration & Setup
# -------------------------------------------------------------------
JWT_SECRET = "fallback_secret_key_for_dev"
ALGORITHM = "HS256"

# Create a FastAPI App
app = FastAPI(title="QR Meal Access System API")

# Setup CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Real-time WebSockets using python-socketio
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

@sio.event
async def connect(sid, environ):
    print(f"A user connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"User disconnected: {sid}")


# -------------------------------------------------------------------
# Database Helper
# -------------------------------------------------------------------
def get_db():
    """
    Dependency that provisions a database connection for each request.
    Using `row_factory = sqlite3.Row` allows us to access columns by name (like dictionaries),
    making it behave very similarly to Node.js / Express DB queries.
    """
    conn = sqlite3.connect("hostel_system.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# -------------------------------------------------------------------
# Application Startup (Database Initialization)
# -------------------------------------------------------------------
@app.on_event("startup")
def startup_db():
    conn = sqlite3.connect("hostel_system.db")
    cursor = conn.cursor()
    
    # 1. Create Tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
            role TEXT NOT NULL, student_id TEXT UNIQUE,
            full_name TEXT, email TEXT, phone TEXT,
            hostel_name TEXT, block TEXT, room_number TEXT,
            room_type TEXT, sharing_type TEXT, floor TEXT, bed_number TEXT,
            status TEXT DEFAULT 'Active', total_fees REAL DEFAULT 50000,
            paid_amount REAL DEFAULT 0, next_due_date TEXT, profile_photo TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meal_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL, meal_type TEXT NOT NULL,
            date TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, meal_type, date)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL, amount REAL NOT NULL,
            date TEXT NOT NULL, mode TEXT NOT NULL, status TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT, title TEXT NOT NULL, message TEXT NOT NULL,
            type TEXT NOT NULL, date TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_number TEXT UNIQUE NOT NULL, capacity INTEGER NOT NULL,
            occupancy INTEGER DEFAULT 0, type TEXT NOT NULL, floor TEXT NOT NULL,
            status TEXT DEFAULT 'Available'
        )
    """)
    cursor.execute("CREATE TABLE IF NOT EXISTS rules (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT NOT NULL, content TEXT NOT NULL)")
    cursor.execute("CREATE TABLE IF NOT EXISTS menu (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, breakfast TEXT NOT NULL, lunch TEXT NOT NULL, snacks TEXT NOT NULL, dinner TEXT NOT NULL, UNIQUE(day))")
    
    # Seed Default Admin User
    if not cursor.execute("SELECT * FROM users WHERE username = 'admin'").fetchone():
        hashed_pw = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
        cursor.execute("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, 'admin', 'System Admin')", ("admin", hashed_pw))
    
    conn.commit()
    conn.close()

# -------------------------------------------------------------------
# Authentication Utilities
# -------------------------------------------------------------------
def verify_token(req: Request, db: sqlite3.Connection = Depends(get_db)):
    """ Reads the JWT token from cookies OR the Authorization header and verifies it. """
    token = req.cookies.get("token")
    if not token:
        auth_header = req.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail={"success": False, "message": "Unauthorized"})
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("role") == "student" and not payload.get("student_id"):
            db_user = db.execute("SELECT student_id FROM users WHERE id = ?", (payload.get('id'),)).fetchone()
            if db_user: payload["student_id"] = db_user["student_id"]
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=403, detail={"success": False, "message": "Invalid token"})

def require_admin(user: dict = Depends(verify_token)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={"success": False, "message": "Admin access required"})
    return user

# -------------------------------------------------------------------
# Input Models
# -------------------------------------------------------------------
class LoginModel(BaseModel): username: str; password: str
class SignupModel(BaseModel): username: str; password: str; student_id: str; full_name: Optional[str] = None; email: Optional[str] = None; phone: Optional[str] = None
class PaymentModel(BaseModel): student_id: str; amount: float; mode: str
class MealAccessModel(BaseModel): token: Optional[str] = None; student_id: Optional[str] = None
class ProfileUpdateModel(BaseModel): full_name: str; email: str; phone: str; profile_photo: Optional[str] = None

# ===================================================================
# ROUTES
# ===================================================================

@app.post("/api/auth/login")
def login(data: LoginModel, response: Response, db: sqlite3.Connection = Depends(get_db)):
    user = db.execute("SELECT * FROM users WHERE username = ?", (data.username,)).fetchone()
    if user and bcrypt.checkpw(data.password.encode('utf-8'), user['password'].encode('utf-8')):
        user_dict = dict(user)
        token = jwt.encode({"id": user_dict["id"], "username": user_dict["username"], "role": user_dict["role"], "student_id": user_dict.get("student_id")}, JWT_SECRET, algorithm=ALGORITHM)
        response.set_cookie(key="token", value=token, httponly=True, samesite='lax', max_age=86400)
        del user_dict["password"]
        return {"success": True, "user": user_dict}
    return Response(content='{"success": false, "message": "Invalid credentials"}', status_code=401, media_type="application/json")

@app.post("/api/auth/signup")
async def signup(data: SignupModel, db: sqlite3.Connection = Depends(get_db)):
    hashed_pw = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode()
    try:
        db.execute(
            "INSERT INTO users (username, password, role, student_id, full_name, email, phone) VALUES (?, ?, 'student', ?, ?, ?, ?)",
            (data.username, hashed_pw, data.student_id, data.full_name, data.email, data.phone)
        )
        db.commit()
        await sio.emit("student_registered", {"student_id": data.student_id, "full_name": data.full_name, "username": data.username})
        return {"success": True}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Username or Student ID already exists"})

@app.get("/api/auth/me")
def get_me(user: dict = Depends(verify_token), db: sqlite3.Connection = Depends(get_db)):
    db_user = db.execute("SELECT * FROM users WHERE id = ?", (user['id'],)).fetchone()
    if db_user:
        user_dict = dict(db_user)
        del user_dict["password"]
        return {"success": True, "user": user_dict}
    raise HTTPException(status_code=404, detail={"success": False, "message": "User not found"})

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("token")
    return {"success": True}

@app.get("/api/payments/{student_id}")
def get_payments(student_id: str, user: dict = Depends(verify_token), db: sqlite3.Connection = Depends(get_db)):
    if user.get("role") != "admin" and user.get("student_id") != student_id: raise HTTPException(status_code=403, detail={"success": False, "message": "Access denied"})
    payments = db.execute("SELECT * FROM payments WHERE student_id = ? ORDER BY date DESC", (student_id,)).fetchall()
    return {"success": True, "payments": [dict(p) for p in payments]}

@app.post("/api/payments/pay")
async def make_payment(data: PaymentModel, user: dict = Depends(verify_token), db: sqlite3.Connection = Depends(get_db)):
    if user.get("role") != "admin" and user.get("student_id") != data.student_id: raise HTTPException(status_code=403, detail={"success": False, "message": "Access denied"})
    date = datetime.now().strftime("%Y-%m-%d")
    cursor = db.cursor()
    cursor.execute("INSERT INTO payments (student_id, amount, date, mode, status) VALUES (?, ?, ?, ?, 'Success')", (data.student_id, data.amount, date, data.mode))
    payment_id = cursor.lastrowid
    cursor.execute("UPDATE users SET paid_amount = COALESCE(paid_amount, 0) + ? WHERE student_id = ?", (data.amount, data.student_id))
    db.commit()
    user_data = dict(cursor.execute("SELECT * FROM users WHERE student_id = ?", (data.student_id,)).fetchone())
    del user_data["password"]
    await sio.emit('payment_received', {"student_id": data.student_id, "amount": data.amount, "date": date, "mode": data.mode, "payment_id": payment_id, "full_name": user_data.get("full_name")})
    return {"success": True, "user": user_data, "payment_id": payment_id}

@app.get("/api/notifications/{student_id}")
def get_notifications(student_id: str, user: dict = Depends(verify_token), db: sqlite3.Connection = Depends(get_db)):
    if user.get("role") != "admin" and user.get("student_id") != student_id: raise HTTPException(status_code=403, detail={"success": False, "message": "Access denied"})
    notifications = db.execute("SELECT * FROM notifications WHERE student_id = ? OR student_id IS NULL ORDER BY date DESC", (student_id,)).fetchall()
    return {"success": True, "notifications": [dict(n) for n in notifications]}

@app.post("/api/meal-access")
def meal_access(data: MealAccessModel, user: dict = Depends(verify_token), db: sqlite3.Connection = Depends(get_db)):
    student_id = data.student_id or data.token
    if not student_id: raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid QR code"})
    if user.get("role") != "admin" and user.get("student_id") != student_id: raise HTTPException(status_code=403, detail={"success": False, "message": "Access denied"})
    student = dict(db.execute("SELECT status, paid_amount, total_fees FROM users WHERE student_id = ?", (student_id,)).fetchone() or {})
    if not student: raise HTTPException(status_code=404, detail={"success": False, "message": "Student not found"})
    if student.get("status") != "Active": raise HTTPException(status_code=403, detail={"success": False, "message": "Account is blocked."})
    
    h = datetime.now().hour
    meal = "Breakfast" if 6<=h<10 else ("Lunch" if 12<=h<15 else ("Dinner" if 19<=h<22 else ""))
    if not meal: raise HTTPException(status_code=400, detail={"success": False, "message": "Meal counter is currently closed"})
    try:
        db.execute("INSERT INTO meal_records (student_id, meal_type, date) VALUES (?, ?, ?)", (student_id, meal, datetime.now().strftime("%Y-%m-%d")))
        db.commit()
        return {"success": True, "meal": meal}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"success": False, "message": f"Already accessed {meal} today"})

@app.post("/api/admin/meal-scan")
async def admin_meal_scan(req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    token = data.get("token")
    if not token: raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid QR code"})
    
    try:
        decoded_str = base64.b64decode(token).decode('utf-8')
        qr_data = json.loads(decoded_str)
        student_id = qr_data.get("student_id")
        meal_type = qr_data.get("meal_type")
        timestamp = qr_data.get("timestamp", 0)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Malformed QR data"})

    # Expire QR codes after 60 seconds to prevent reusing screenshots
    if (datetime.now().timestamp() * 1000) - timestamp > 60000:
        await sio.emit("meal_scanned", {"student_id": student_id, "status": "deny", "reason": "QR Code Expired"})
        return {"success": False, "message": "QR Code Expired"}

    student = dict(db.execute("SELECT status, paid_amount, total_fees FROM users WHERE student_id = ?", (student_id,)).fetchone() or {})
    if not student: return {"success": False, "message": "Student not found"}
    
    # Strict Fee Check
    paid = student.get("paid_amount") or 0
    total = student.get("total_fees") or 0
    if paid < total:
        reason = f"Please pay the fee (Unpaid: Rs. {total - paid})"
        await sio.emit("meal_scanned", {"student_id": student_id, "status": "deny", "reason": reason})
        return {"success": False, "message": "Deny: Fees pending"}
    
    if student.get("status") != "Active": 
        await sio.emit("meal_scanned", {"student_id": student_id, "status": "deny", "reason": "Account is Blocked"})
        return {"success": False, "message": "Account is blocked"}

    h = datetime.now().hour
    current_meal = "Breakfast" if 6<=h<10 else ("Lunch" if 12<=h<15 else ("Dinner" if 19<=h<22 else ""))
    
    if meal_type != current_meal or not current_meal:
        await sio.emit("meal_scanned", {"student_id": student_id, "status": "deny", "reason": "Meal time mismatch"})
        return {"success": False, "message": "Invalid meal time"}

    try:
        db.execute("INSERT INTO meal_records (student_id, meal_type, date) VALUES (?, ?, ?)", (student_id, current_meal, datetime.now().strftime("%Y-%m-%d")))
        db.commit()
        await sio.emit("meal_scanned", {"student_id": student_id, "status": "approve", "reason": f"Approved for {current_meal}"})
        return {"success": True, "meal": current_meal}
    except sqlite3.IntegrityError:
        await sio.emit("meal_scanned", {"student_id": student_id, "status": "deny", "reason": f"Already accessed {current_meal}"})
        return {"success": False, "message": f"Already accessed {current_meal} today"}

@app.get("/api/meal-logs/{student_id}")
def get_meal_logs(student_id: str, user: dict = Depends(verify_token), db: sqlite3.Connection = Depends(get_db)):
    if user.get("role") != "admin" and user.get("student_id") != student_id: raise HTTPException(status_code=403, detail={"success": False, "message": "Access denied"})
    logs = db.execute("SELECT * FROM meal_records WHERE student_id = ? ORDER BY timestamp DESC", (student_id,)).fetchall()
    return {"success": True, "mealLogs": [dict(m) for m in logs]}

@app.post("/api/user/update-profile")
def update_profile(data: ProfileUpdateModel, user: dict = Depends(verify_token), db: sqlite3.Connection = Depends(get_db)):
    db.execute("UPDATE users SET full_name = ?, email = ?, phone = ?, profile_photo = ? WHERE id = ?", (data.full_name, data.email, data.phone, data.profile_photo, user['id']))
    db.commit()
    user_data = dict(db.execute("SELECT * FROM users WHERE id = ?", (user['id'],)).fetchone())
    del user_data["password"]
    return {"success": True, "user": user_data}

# --- General System APIs ---
@app.get("/api/menu")
def get_menu(db: sqlite3.Connection = Depends(get_db)):
    return {"success": True, "menu": [dict(m) for m in db.execute("SELECT * FROM menu").fetchall()]}

@app.get("/api/rooms")
def get_rooms(user: dict = Depends(verify_token), db: sqlite3.Connection = Depends(get_db)):
    return {"success": True, "rooms": [dict(r) for r in db.execute("SELECT * FROM rooms").fetchall()]}

@app.get("/api/rules")
def get_rules(db: sqlite3.Connection = Depends(get_db)):
    return [dict(r) for r in db.execute("SELECT * FROM rules").fetchall()]

# --- Admin APIs ---
@app.get("/api/admin/stats")
def get_admin_stats(user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    students = db.execute("SELECT count(*) as total, sum(case when status='Active' then 1 else 0 end) as active, sum(case when status='Blocked' then 1 else 0 end) as blocked FROM users WHERE role='student'").fetchone()
    rooms = db.execute("SELECT count(*) as total, sum(occupancy) as occupied, sum(capacity - occupancy) as available FROM rooms").fetchone()
    payments_total = db.execute("SELECT sum(amount) as total_received FROM payments").fetchone()
    payments_pending = db.execute("SELECT sum(total_fees - paid_amount) as pending FROM users WHERE role='student'").fetchone()
    
    meals_today_rows = db.execute("SELECT meal_type, count(*) as count FROM meal_records WHERE date = ? GROUP BY meal_type", (today,)).fetchall()
    today_meals = {"Breakfast": 0, "Lunch": 0, "Dinner": 0}
    for r in meals_today_rows: today_meals[r["meal_type"]] = r["count"]
        
    stats = {
        "students": dict(students) if students and students["total"] is not None else {"total": 0, "active": 0, "blocked": 0},
        "rooms": dict(rooms) if rooms and rooms["total"] is not None else {"total": 0, "occupied": 0, "available": 0},
        "payments": {"total_received": (dict(payments_total).get("total_received") or 0) if payments_total else 0, "pending": (dict(payments_pending).get("pending") or 0) if payments_pending else 0},
        "today_meals": today_meals
    }
    return {"success": True, "stats": stats}

@app.get("/api/students")
def get_all_students(user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    return {"success": True, "students": [dict(s) for s in db.execute("SELECT * FROM users WHERE role = 'student'").fetchall()]}

@app.get("/api/meal-logs")
def get_all_meal_logs(user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    res = db.execute("SELECT m.*, u.username FROM meal_records m JOIN users u ON m.student_id = u.student_id ORDER BY m.timestamp DESC").fetchall()
    return [dict(r) for r in res]

@app.get("/api/admin/payments")
def get_all_payments(user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    res = db.execute("SELECT p.*, u.username, u.full_name FROM payments p JOIN users u ON p.student_id = u.student_id ORDER BY p.date DESC").fetchall()
    return [dict(r) for r in res]

# --- Admin Dynamic Admin Actions (Rooms, Rules, etc) ---

@app.post("/api/rooms")
async def add_room(req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    cursor = db.cursor()
    cursor.execute("INSERT INTO rooms (room_number, capacity, type, floor) VALUES (?, ?, ?, ?)", (data.get('room_number'), data.get('capacity'), data.get('type'), data.get('floor')))
    db.commit()
    return {"success": True, "id": cursor.lastrowid}

@app.put("/api/rooms/{id}")
async def update_room(id: int, req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    db.execute("UPDATE rooms SET room_number = ?, capacity = ?, type = ?, floor = ?, status = ? WHERE id = ?", (data.get('room_number'), data.get('capacity'), data.get('type'), data.get('floor'), data.get('status'), id))
    db.commit()
    return {"success": True}

@app.delete("/api/rooms/{id}")
def delete_room(id: int, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    db.execute("DELETE FROM rooms WHERE id = ?", (id,))
    db.commit()
    return {"success": True}

@app.get("/api/rooms/{roomNumber}/students")
def get_room_students(roomNumber: str, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    students = db.execute("SELECT id, full_name, student_id, status FROM users WHERE room_number = ? AND role = 'student'", (roomNumber,)).fetchall()
    return {"success": True, "students": [dict(s) for s in students]}

@app.post("/api/rules")
async def add_rule(req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    cursor = db.cursor()
    cursor.execute("INSERT INTO rules (category, content) VALUES (?, ?)", (data.get('category'), data.get('content')))
    db.commit()
    return {"success": True, "id": cursor.lastrowid}

@app.put("/api/rules/{id}")
async def update_rule(id: int, req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    db.execute("UPDATE rules SET category = ?, content = ? WHERE id = ?", (data.get('category'), data.get('content'), id))
    db.commit()
    return {"success": True}

@app.delete("/api/rules/{id}")
def delete_rule(id: int, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    db.execute("DELETE FROM rules WHERE id = ?", (id,))
    db.commit()
    return {"success": True}

@app.put("/api/menu/{id}")
async def update_menu(id: int, req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    db.execute("UPDATE menu SET breakfast = ?, lunch = ?, snacks = ?, dinner = ? WHERE id = ?", (data.get('breakfast'), data.get('lunch'), data.get('snacks'), data.get('dinner'), id))
    db.commit()
    return {"success": True}

@app.put("/api/admin/students/{id}")
async def admin_update_student(id: int, req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    db.execute("UPDATE users SET full_name = ?, email = ?, phone = ?, hostel_name = ?, block = ?, room_number = ?, room_type = ?, sharing_type = ?, total_fees = ?, status = ?, floor = ?, bed_number = ? WHERE id = ?", (data.get('full_name'), data.get('email'), data.get('phone'), data.get('hostel_name'), data.get('block'), data.get('room_number'), data.get('room_type'), data.get('sharing_type'), data.get('total_fees'), data.get('status'), data.get('floor'), data.get('bed_number'), id))
    db.commit()
    return {"success": True}

@app.delete("/api/admin/students/{id}")
def admin_delete_student(id: int, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    student = db.execute("SELECT room_number FROM users WHERE id = ?", (id,)).fetchone()
    if student and student['room_number']:
        db.execute("UPDATE rooms SET occupancy = MAX(0, occupancy - 1) WHERE room_number = ?", (student['room_number'],))
    db.execute("DELETE FROM users WHERE id = ?", (id,))
    db.commit()
    return {"success": True}

@app.post("/api/admin/students/block-unblock")
async def toggle_student_status(req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    db.execute("UPDATE users SET status = ? WHERE student_id = ?", (data.get('status'), data.get('student_id')))
    db.commit()
    return {"success": True}

@app.post("/api/admin/students/add")
async def admin_add_student(req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    hashed_pw = bcrypt.hashpw(data.get('password', 'password123').encode('utf-8'), bcrypt.gensalt()).decode()
    cursor = db.cursor()
    cursor.execute("INSERT INTO users (username, password, role, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, total_fees, status, floor, bed_number) VALUES (?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)", (data.get('username'), hashed_pw, data.get('student_id'), data.get('full_name'), data.get('email'), data.get('phone'), data.get('hostel_name'), data.get('block'), data.get('room_number'), data.get('room_type'), data.get('sharing_type'), data.get('total_fees'), data.get('floor'), data.get('bed_number')))
    db.execute("UPDATE rooms SET occupancy = occupancy + 1 WHERE room_number = ?", (data.get('room_number'),))
    db.commit()
    return {"success": True, "id": cursor.lastrowid}

@app.get("/api/admin/reports/meals")
def report_meals(user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    return [dict(r) for r in db.execute("SELECT date, meal_type, count(*) as count FROM meal_records GROUP BY date, meal_type ORDER BY date DESC LIMIT 30").fetchall()]

@app.get("/api/admin/reports/revenue")
def report_revenue(user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    return [dict(r) for r in db.execute("SELECT date, sum(amount) as total FROM payments WHERE status = 'Success' GROUP BY date ORDER BY date DESC LIMIT 30").fetchall()]

@app.post("/api/admin/payments/add")
async def add_payment(req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    date_val = data.get('date') or datetime.now().strftime("%Y-%m-%d")
    status = data.get('status')
    amt = data.get('amount')
    sid = data.get('student_id')
    db.execute("INSERT INTO payments (student_id, amount, date, mode, status) VALUES (?, ?, ?, ?, ?)", (sid, amt, date_val, data.get('mode'), status))
    if status == 'Success':
        db.execute("UPDATE users SET paid_amount = paid_amount + ? WHERE student_id = ?", (amt, sid))
    db.commit()
    return {"success": True}

@app.post("/api/admin/notifications/broadcast")
async def broadcast_notification(req: Request, user: dict = Depends(require_admin), db: sqlite3.Connection = Depends(get_db)):
    data = await req.json()
    date_val = datetime.now().strftime("%Y-%m-%d")
    students = db.execute("SELECT student_id FROM users WHERE role='student'").fetchall()
    for s in students:
        db.execute("INSERT INTO notifications (student_id, title, message, type, date) VALUES (?, ?, ?, ?, ?)", (s['student_id'], data.get('title'), data.get('message'), data.get('type'), date_val))
    db.commit()
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
