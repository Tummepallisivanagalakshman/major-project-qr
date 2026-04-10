import pytest
from fastapi.testclient import TestClient
import sqlite3
import os
import bcrypt
import json
import base64
from datetime import datetime

# Import the FastAPI app and get_db dependency
from main import app, get_db

TEST_DB = "test_hostel_system.db"

# Override the database dependency to use our test DB
def override_get_db():
    conn = sqlite3.connect(TEST_DB, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """ Runs once per test session to setup the test database. """
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
        
    conn = sqlite3.connect(TEST_DB)
    cursor = conn.cursor()
    
    # Create tables identical to main.py
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
    
    # Seed Admin User
    hashed_pw = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
    cursor.execute("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, 'admin', 'System Admin')", ("admin", hashed_pw))
    conn.commit()
    conn.close()
    
    yield  # Tests run here
    
    # Teardown
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

# -------------------------------------
# TESTS
# -------------------------------------

def test_admin_login_success():
    response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["user"]["role"] == "admin"
    assert "token" in response.cookies

def test_admin_login_failure():
    response = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code == 401

def test_student_signup():
    response = client.post("/api/auth/signup", json={
        "username": "student1",
        "password": "password123",
        "student_id": "STU001",
        "full_name": "Test Student",
        "email": "test@student.com",
        "phone": "1234567890"
    })
    assert response.status_code == 200
    assert response.json()["success"] == True

def test_student_login():
    response = client.post("/api/auth/login", json={"username": "student1", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["user"]["role"] == "student"

def test_get_me(monkeypatch):
    # First login to get the cookie
    resp = client.post("/api/auth/login", json={"username": "student1", "password": "password123"})
    token = resp.cookies.get("token")
    
    resp2 = client.get("/api/auth/me", cookies={"token": token})
    assert resp2.status_code == 200
    assert resp2.json()["user"]["username"] == "student1"

def test_admin_add_room():
    # Admin login
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    token = resp.cookies.get("token")
    
    # Add room
    resp2 = client.post("/api/rooms", json={
        "room_number": "101",
        "capacity": 2,
        "type": "AC",
        "floor": "Ground"
    }, cookies={"token": token})
    assert resp2.status_code == 200
    assert resp2.json()["success"] == True

def test_admin_add_rule():
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    token = resp.cookies.get("token")
    
    resp2 = client.post("/api/rules", json={
        "category": "Hostel",
        "content": "No loud noise after 10PM"
    }, cookies={"token": token})
    assert resp2.status_code == 200
    assert resp2.json()["success"] == True

def test_student_cannot_add_room():
    resp = client.post("/api/auth/login", json={"username": "student1", "password": "password123"})
    token = resp.cookies.get("token")
    
    resp2 = client.post("/api/rooms", json={
        "room_number": "102",
        "capacity": 1,
        "type": "Non-AC",
        "floor": "First"
    }, cookies={"token": token})
    assert resp2.status_code == 403

def test_meal_access_unpaid_fee():
    # Admin logs in
    admin_resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    admin_token = admin_resp.cookies.get("token")
    
    # Gen a QR code payload
    h = datetime.now().hour
    current_meal = "Breakfast" if 6<=h<10 else ("Lunch" if 12<=h<15 else ("Dinner" if 19<=h<22 else ""))
    
    if current_meal:
        payload = {
            "student_id": "STU001",
            "meal_type": current_meal,
            "timestamp": datetime.now().timestamp() * 1000
        }
        token_str = base64.b64encode(json.dumps(payload).encode()).decode()
        
        # Scan attempt
        resp = client.post("/api/admin/meal-scan", json={"token": token_str}, cookies={"token": admin_token})
        assert resp.status_code == 200
        assert resp.json()["success"] == False
        assert "Deny: Fees pending" in resp.json()["message"]

def test_pay_fee():
    admin_resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    admin_token = admin_resp.cookies.get("token")
    
    # student1 has 50000 default fee, let's pay it
    resp = client.post("/api/payments/pay", json={
        "student_id": "STU001",
        "amount": 50000.0,
        "mode": "UPI"
    }, cookies={"token": admin_token})
    
    assert resp.status_code == 200
    assert resp.json()["success"] == True

def test_meal_access_after_payment():
    admin_resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    admin_token = admin_resp.cookies.get("token")
    
    h = datetime.now().hour
    current_meal = "Breakfast" if 6<=h<10 else ("Lunch" if 12<=h<15 else ("Dinner" if 19<=h<22 else ""))
    
    if current_meal:
        payload = {
            "student_id": "STU001",
            "meal_type": current_meal,
            "timestamp": datetime.now().timestamp() * 1000
        }
        token_str = base64.b64encode(json.dumps(payload).encode()).decode()
        
        # First Scan
        resp = client.post("/api/admin/meal-scan", json={"token": token_str}, cookies={"token": admin_token})
        assert resp.status_code == 200
        assert resp.json()["success"] == True
        
        # Second scan should fail
        resp2 = client.post("/api/admin/meal-scan", json={"token": token_str}, cookies={"token": admin_token})
        assert resp2.status_code == 200
        assert resp2.json()["success"] == False
        assert "Already accessed" in resp2.json()["message"]

def test_expired_qr_code():
    admin_resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    admin_token = admin_resp.cookies.get("token")
    
    payload = {
        "student_id": "STU001",
        "meal_type": "Lunch",
        # Timestamp is 2 minutes ago
        "timestamp": (datetime.now().timestamp() - 120) * 1000
    }
    token_str = base64.b64encode(json.dumps(payload).encode()).decode()
    
    resp = client.post("/api/admin/meal-scan", json={"token": token_str}, cookies={"token": admin_token})
    assert resp.status_code == 200
    assert resp.json()["success"] == False
    assert "Expired" in resp.json()["message"]

