import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

console.log('--- SERVER STARTING ---');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  try {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    const PORT = 3000;

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    // Trust Proxy for Cloud Run / Proxies
    app.set('trust proxy', 1);

    // Security Headers
    app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for Vite dev server compatibility
    }));

    // Rate Limiting
    const loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Limit each IP to 10 login attempts per windowMs
      message: { success: false, message: "Too many login attempts, please try again later" }
    });

    app.use(express.json());
    app.use(cookieParser());

    // Middleware
    const authenticateToken = (req: any, res: any, next: any) => {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid token" });
        
        if (user.role === 'student' && !user.student_id) {
          db.get("SELECT student_id FROM users WHERE id = ?", [user.id], (err, dbUser: any) => {
            if (dbUser) {
              user.student_id = dbUser.student_id;
            }
            req.user = user;
            next();
          });
        } else {
          req.user = user;
          next();
        }
      });
    };

    const isAdmin = (req: any, res: any, next: any) => {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      next();
    };

    // Database setup
    const db = new sqlite3.Database('hostel_system.db');
    
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          student_id TEXT UNIQUE,
          full_name TEXT,
          email TEXT,
          phone TEXT,
          hostel_name TEXT,
          block TEXT,
          room_number TEXT,
          room_type TEXT,
          sharing_type TEXT,
          floor TEXT,
          bed_number TEXT,
          status TEXT DEFAULT 'Active',
          total_fees REAL DEFAULT 50000,
          paid_amount REAL DEFAULT 0,
          next_due_date TEXT,
          profile_photo TEXT
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS meal_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id TEXT NOT NULL,
          meal_type TEXT NOT NULL,
          date TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(student_id, meal_type, date)
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          mode TEXT NOT NULL,
          status TEXT NOT NULL
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id TEXT,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          date TEXT NOT NULL
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_number TEXT UNIQUE NOT NULL,
          capacity INTEGER NOT NULL,
          occupancy INTEGER DEFAULT 0,
          type TEXT NOT NULL,
          floor TEXT NOT NULL,
          status TEXT DEFAULT 'Available'
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          content TEXT NOT NULL
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS menu (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          day TEXT NOT NULL,
          breakfast TEXT NOT NULL,
          lunch TEXT NOT NULL,
          snacks TEXT NOT NULL,
          dinner TEXT NOT NULL,
          UNIQUE(day)
        )
      `);

      // Performance Indexes
      db.run("CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status)");
      db.run("CREATE INDEX IF NOT EXISTS idx_meal_records_date_type ON meal_records(date, meal_type)");
      db.run("CREATE INDEX IF NOT EXISTS idx_meal_records_student_date ON meal_records(student_id, date)");
      db.run("CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id)");
      db.run("CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id)");
      db.run("CREATE INDEX IF NOT EXISTS idx_users_room ON users(room_number)");

      // Migration: Update 2024 dates to 2026
      db.run("UPDATE payments SET date = REPLACE(date, '2024', '2026') WHERE date LIKE '2024%'");
      db.run("UPDATE notifications SET date = REPLACE(date, '2024', '2026') WHERE date LIKE '2024%'");
      db.run("UPDATE users SET next_due_date = REPLACE(next_due_date, '2024', '2026') WHERE next_due_date LIKE '2024%'");
      db.run("UPDATE meal_records SET date = REPLACE(date, '2024', '2026') WHERE date LIKE '2024%'");
      db.run("UPDATE users SET total_fees = 50000 WHERE total_fees IS NULL");
      db.run("UPDATE users SET paid_amount = 0 WHERE paid_amount IS NULL");

      // Default admin
      const adminUsername = 'admin';
      db.get("SELECT * FROM users WHERE username = ?", [adminUsername], (err, row) => {
        if (!row) {
          const hashedPw = bcrypt.hashSync('admin123', 10);
          db.run("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)", [adminUsername, hashedPw, 'admin', 'System Admin']);
        }
      });

      // Seed some data for testing if needed
      db.get("SELECT * FROM users WHERE username = 'student'", (err, row) => {
        if (!row) {
          const hashedPw = bcrypt.hashSync('student123', 10);
          db.run(`INSERT INTO users 
            (username, password, role, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, floor, bed_number, paid_amount, next_due_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            ['student', hashedPw, 'student', 'STU001', 'John Doe', 'john@example.com', '+91 9876543210', 'North Wing', 'B-Block', '302', 'AC', 'Double', '3rd Floor', 'B1', 35000, '2026-04-15']);
          
          // Add some payments
          db.run("INSERT INTO payments (student_id, amount, date, mode, status) VALUES (?, ?, ?, ?, ?)", ['STU001', 20000, '2026-01-10', 'UPI', 'Success']);
          db.run("INSERT INTO payments (student_id, amount, date, mode, status) VALUES (?, ?, ?, ?, ?)", ['STU001', 15000, '2026-02-15', 'Card', 'Success']);

          // Add some notifications
          db.run("INSERT INTO notifications (student_id, title, message, type, date) VALUES (?, ?, ?, ?, ?)", ['STU001', 'Payment Reminder', 'Your next installment is due on 15th April.', 'payment', '2026-03-20']);
          db.run("INSERT INTO notifications (student_id, title, message, type, date) VALUES (NULL, 'Admin Announcement', 'Hostel maintenance scheduled for this Sunday.', 'admin', '2026-03-21')");
        }
      });

      // Seed Rooms if empty
      db.get("SELECT count(*) as count FROM rooms", (err, row: any) => {
        if (row && row.count === 0) {
          const rooms = [
            ['101', 2, 'AC', '1st Floor'],
            ['102', 3, 'Non-AC', '1st Floor'],
            ['201', 2, 'AC', '2nd Floor'],
            ['202', 4, 'Non-AC', '2nd Floor'],
            ['301', 1, 'AC', '3rd Floor'],
            ['302', 2, 'AC', '3rd Floor'],
          ];
          rooms.forEach(r => {
            db.run("INSERT INTO rooms (room_number, capacity, type, floor) VALUES (?, ?, ?, ?)", r);
          });
          // Update occupancy for seeded student
          db.run("UPDATE rooms SET occupancy = 1 WHERE room_number = '302'");
        }
      });

      // Seed Rules if empty
      db.get("SELECT count(*) as count FROM rules", (err, row: any) => {
        if (row && row.count === 0) {
          const rules = [
            ['Hostel', 'In-time for all students is 9:30 PM. Late entry requires prior permission.'],
            ['Hostel', 'Silence hours are to be observed from 10:00 PM to 6:00 AM.'],
            ['Mess', 'Meal access is strictly via QR code scan at the counter.'],
            ['Payment', 'Hostel fees must be paid by the 15th of every month.'],
          ];
          rules.forEach(r => {
            db.run("INSERT INTO rules (category, content) VALUES (?, ?)", r);
          });
        }
      });

      // Seed Menu if empty
      db.get("SELECT count(*) as count FROM menu", (err, row: any) => {
        if (row && row.count === 0) {
          const menu = [
            ['Monday', 'Idli, Sambar, Coconut Chutney, Tea/Coffee', 'Rice, Dal Tadka, Mix Veg Sabzi, Curd, Papad', 'Samosa, Mint Chutney, Tea', 'Roti, Paneer Butter Masala, Jeera Rice, Salad'],
            ['Tuesday', 'Puri, Aloo Bhaji, Pickle, Milk', 'Veg Biryani, Raita, Salan, Salad', 'Bread Pakora, Ketchup, Tea', 'Roti, Dal Makhani, Gobi Matar, Rice'],
            ['Wednesday', 'Aloo Paratha, Curd, Butter, Tea', 'Rice, Sambhar, Poriyal, Rasam, Appalam', 'Vada Pav, Chutney, Tea', 'Roti, Chicken Curry (or Egg Curry), Rice, Salad'],
            ['Thursday', 'Dosa, Sambar, Tomato Chutney, Coffee', 'Rice, Rajma Masala, Aloo Gobi, Curd', 'Poha, Sev, Lemon, Tea', 'Roti, Bhindi Fry, Dal Fry, Rice'],
            ['Friday', 'Upma, Coconut Chutney, Banana, Tea', 'Lemon Rice, Curd Rice, Potato Fry, Pickle', 'Onion Bhajia, Chutney, Tea', 'Roti, Malai Kofta, Veg Pulao, Salad'],
            ['Saturday', 'Chole Bhature, Pickle, Lassi', 'Rice, Kadhi Pakora, Baingan Bharta, Papad', 'Pav Bhaji, Butter, Tea', 'Roti, Mix Dal, Seasonal Veg, Rice'],
            ['Sunday', 'Masala Omelette (or Paneer Scramble), Bread Toast, Juice', 'Special Veg Thali (Poori, Paneer, Dal, Sweet)', 'Biscuits, Tea/Coffee', 'Roti, Butter Chicken (or Paneer Tikka Masala), Rice, Salad']
          ];
          menu.forEach(m => {
            db.run("INSERT INTO menu (day, breakfast, lunch, snacks, dinner) VALUES (?, ?, ?, ?, ?)", m);
          });
        }
      });
    });

    // API Routes
    app.post('/api/auth/login', loginLimiter, (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password required" });
      }

      db.get("SELECT * FROM users WHERE username = ?", [username], (err, user: any) => {
        if (user && bcrypt.compareSync(password, user.password)) {
          const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, student_id: user.student_id },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          });

          // Don't send password back
          const { password: _, ...userWithoutPassword } = user;
          res.json({ success: true, user: userWithoutPassword });
        } else {
          res.status(401).json({ success: false, message: "Invalid credentials" });
        }
      });
    });

    app.post('/api/auth/signup', loginLimiter, (req, res) => {
      const { username, password, student_id, full_name, email, phone } = req.body;
      if (!username || !password || !student_id) {
        return res.status(400).json({ success: false, message: "Required fields missing" });
      }

      const hashedPw = bcrypt.hashSync(password, 10);
      db.run(`INSERT INTO users 
        (username, password, role, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, floor, bed_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [username, hashedPw, 'student', student_id, full_name, email, phone, 'Main Hostel', 'A', '101', 'Non-AC', 'Triple', '1st', 'A1'], (err) => {
        if (err) {
          res.status(400).json({ success: false, message: "Username or Student ID already exists" });
        } else {
          io.emit('student_registered', { student_id, full_name, username });
          res.json({ success: true });
        }
      });
    });

    app.get('/api/auth/me', authenticateToken, (req: any, res) => {
      db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user: any) => {
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          res.json({ success: true, user: userWithoutPassword });
        } else {
          res.status(404).json({ success: false, message: "User not found" });
        }
      });
    });

    app.post('/api/auth/logout', (req, res) => {
      res.clearCookie('token');
      res.json({ success: true });
    });

    app.get('/api/payments/:student_id', authenticateToken, (req: any, res) => {
      // Security: Ensure student can only see their own payments
      if (req.user.role !== 'admin' && req.user.student_id !== req.params.student_id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      db.all("SELECT * FROM payments WHERE student_id = ? ORDER BY date DESC", [req.params.student_id], (err, rows) => {
        if (err) {
          res.status(500).json({ success: false, message: "Error fetching payments" });
        } else {
          res.json({ success: true, payments: rows });
        }
      });
    });

    app.get('/api/notifications/:student_id', authenticateToken, (req: any, res) => {
      // Security: Ensure student can only see their own notifications
      if (req.user.role !== 'admin' && req.user.student_id !== req.params.student_id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      db.all("SELECT * FROM notifications WHERE student_id = ? OR student_id IS NULL ORDER BY date DESC", [req.params.student_id], (err, rows) => {
        if (err) {
          res.status(500).json({ success: false, message: "Error fetching notifications" });
        } else {
          res.json({ success: true, notifications: rows });
        }
      });
    });

    app.post('/api/auth/change-password', authenticateToken, (req: any, res) => {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      db.get("SELECT password FROM users WHERE id = ?", [userId], (err, user: any) => {
        if (user && bcrypt.compareSync(oldPassword, user.password)) {
          const hashedPw = bcrypt.hashSync(newPassword, 10);
          db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPw, userId], (err) => {
            res.json({ success: true });
          });
        } else {
          res.status(400).json({ success: false, message: "Incorrect old password" });
        }
      });
    });

    app.post('/api/payments/pay', authenticateToken, (req: any, res) => {
      const { student_id, amount, mode } = req.body;
      
      // Security: Ensure student can only pay for themselves
      if (req.user.role !== 'admin' && req.user.student_id !== student_id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const date = new Date().toISOString().split('T')[0];
      
      db.serialize(() => {
        db.run("INSERT INTO payments (student_id, amount, date, mode, status) VALUES (?, ?, ?, ?, ?)", [student_id, amount, date, mode, 'Success'], function(err) {
          if (err) {
            console.error("Payment insert error:", err);
            return res.status(500).json({ success: false, message: "Error recording payment" });
          }
          
          const paymentId = this.lastID; // Get the inserted payment ID
          
          db.run("UPDATE users SET paid_amount = COALESCE(paid_amount, 0) + ? WHERE student_id = ?", [amount, student_id], (err) => {
            if (err) {
              console.error("User update error:", err);
              res.status(500).json({ success: false, message: "Error updating student balance" });
            } else {
              db.get("SELECT * FROM users WHERE student_id = ?", [student_id], (err, user) => {
                if (err || !user) {
                  res.status(500).json({ success: false, message: "Error retrieving updated user" });
                } else {
                  const { password: _, ...userWithoutPassword } = user as any;
                  io.emit('payment_received', { 
                    student_id, 
                    amount, 
                    date, 
                    mode, 
                    payment_id: paymentId, 
                    full_name: userWithoutPassword.full_name,
                    user: userWithoutPassword 
                  });
                  res.json({ success: true, user: userWithoutPassword, payment_id: paymentId });
                }
              });
            }
          });
        });
      });
    });

    app.post('/api/user/update-profile', authenticateToken, (req: any, res) => {
      const { full_name, email, phone, profile_photo } = req.body;
      const userId = req.user.id;

      db.run("UPDATE users SET full_name = ?, email = ?, phone = ?, profile_photo = ? WHERE id = ?", 
        [full_name, email, phone, profile_photo, userId], (err) => {
        if (err) {
          res.status(500).json({ success: false, message: "Error updating profile" });
        } else {
          db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
            res.json({ success: true, user });
          });
        }
      });
    });

    app.get('/api/students', authenticateToken, isAdmin, (req, res) => {
      db.all("SELECT * FROM users WHERE role = 'student'", (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, students: rows || [] });
      });
    });

    app.get('/api/admin/payments', authenticateToken, isAdmin, (req, res) => {
      db.all(`
        SELECT p.*, u.username, u.full_name 
        FROM payments p 
        JOIN users u ON p.student_id = u.student_id 
        ORDER BY p.date DESC
      `, (err, rows) => {
        res.json(rows);
      });
    });

    app.get('/api/meal-logs', authenticateToken, isAdmin, (req, res) => {
      db.all(`
        SELECT m.*, u.username 
        FROM meal_records m 
        JOIN users u ON m.student_id = u.student_id 
        ORDER BY m.timestamp DESC
      `, (err, rows) => {
        res.json(rows);
      });
    });

    app.get('/api/meal-logs/:student_id', authenticateToken, (req: any, res) => {
      // Security: Ensure student can only see their own logs
      if (req.user.role !== 'admin' && req.user.student_id !== req.params.student_id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      db.all("SELECT * FROM meal_records WHERE student_id = ? ORDER BY timestamp DESC", [req.params.student_id], (err, rows) => {
        if (err) {
          res.status(500).json({ success: false, message: "Error fetching meal logs" });
        } else {
          res.json({ success: true, mealLogs: rows || [] });
        }
      });
    });

    app.post('/api/meal-access', authenticateToken, (req: any, res) => {
      const { token, student_id: fallbackStudentId } = req.body;
      
      let student_id = fallbackStudentId;
      
      if (token) {
        try {
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
          student_id = decoded.student_id;
          
          // Optional: Check if token is expired (e.g., older than 5 minutes)
          const tokenTime = decoded.timestamp;
          if (Date.now() - tokenTime > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "QR Expired. Please refresh." });
          }
        } catch (e) {
          // If it fails to parse, maybe it's the old static QR format or just invalid
          student_id = token;
        }
      }

      if (!student_id) {
        return res.status(400).json({ success: false, message: "Invalid QR code" });
      }

      // Security: Ensure student can only scan for themselves, or admin can scan anyone
      if (req.user.role !== 'admin' && req.user.student_id !== student_id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      // Check student status and fees
      db.get("SELECT status, paid_amount, total_fees FROM users WHERE student_id = ?", [student_id], (err, student: any) => {
        if (err || !student) {
          return res.status(404).json({ success: false, message: "Student not found" });
        }

        if (student.status !== 'Active') {
          return res.status(403).json({ success: false, message: "Account is blocked. Please contact admin." });
        }

        // Check if student has pending monthly payment
        if (student.total_fees > 0 && student.paid_amount <= 0) {
          return res.status(403).json({ success: false, message: "Pending fees. Access restricted." });
        }

        const now = new Date();
        const h = now.getHours();
        const dateStr = now.toISOString().split('T')[0];
        
        let meal = "";
        if (h >= 6 && h < 10) meal = "Breakfast";
        else if (h >= 12 && h < 15) meal = "Lunch";
        else if (h >= 19 && h < 22) meal = "Dinner";
        
        if (!meal) {
          return res.status(400).json({ success: false, message: "Meal counter is currently closed" });
        }

        db.run("INSERT INTO meal_records (student_id, meal_type, date) VALUES (?, ?, ?)", [student_id, meal, dateStr], (err) => {
          if (err) {
            res.status(400).json({ success: false, message: `Already accessed ${meal} today` });
          } else {
            res.json({ success: true, meal });
          }
        });
      });
    });

    // --- Admin Dashboard API ---
    app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
      const stats: any = { students: {}, rooms: {}, payments: {}, today_meals: {} };
      const today = new Date().toISOString().split('T')[0];

      const queries = [
        new Promise((resolve) => {
          db.get("SELECT count(*) as total, sum(case when status='Active' then 1 else 0 end) as active, sum(case when status='Blocked' then 1 else 0 end) as blocked FROM users WHERE role='student'", (err, row: any) => {
            stats.students = row || { total: 0, active: 0, blocked: 0 };
            resolve(null);
          });
        }),
        new Promise((resolve) => {
          db.get("SELECT count(*) as total, sum(occupancy) as occupied, sum(capacity - occupancy) as available FROM rooms", (err, row: any) => {
            stats.rooms = row || { total: 0, occupied: 0, available: 0 };
            resolve(null);
          });
        }),
        new Promise((resolve) => {
          db.get("SELECT sum(amount) as total_received FROM payments", (err, row: any) => {
            stats.payments.total_received = row?.total_received || 0;
            resolve(null);
          });
        }),
        new Promise((resolve) => {
          db.get("SELECT sum(total_fees - paid_amount) as pending FROM users WHERE role='student'", (err, row: any) => {
            stats.payments.pending = row?.pending || 0;
            resolve(null);
          });
        }),
        new Promise((resolve) => {
          db.all("SELECT meal_type, count(*) as count FROM meal_records WHERE date = ? GROUP BY meal_type", [today], (err, rows: any[]) => {
            stats.today_meals = {
              Breakfast: rows.find(r => r.meal_type === 'Breakfast')?.count || 0,
              Lunch: rows.find(r => r.meal_type === 'Lunch')?.count || 0,
              Dinner: rows.find(r => r.meal_type === 'Dinner')?.count || 0,
            };
            resolve(null);
          });
        })
      ];

      Promise.all(queries).then(() => {
        res.json({ success: true, stats: stats });
      }).catch(err => {
        res.status(500).json({ success: false, message: err.message });
      });
    });

    // Rooms CRUD
    app.get('/api/rooms', authenticateToken, (req, res) => {
      db.all("SELECT * FROM rooms", (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, rooms: rows || [] });
      });
    });

    app.get('/api/rooms/:roomNumber/students', authenticateToken, isAdmin, (req, res) => {
      db.all("SELECT id, full_name, student_id, status FROM users WHERE room_number = ? AND role = 'student'", 
        [req.params.roomNumber], (err, rows) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, students: rows || [] });
        });
    });

    app.post('/api/rooms', authenticateToken, isAdmin, (req, res) => {
      const { room_number, capacity, type, floor } = req.body;
      db.run("INSERT INTO rooms (room_number, capacity, type, floor) VALUES (?, ?, ?, ?)", 
        [room_number, capacity, type, floor], function(err) {
          if (err) return res.status(400).json({ success: false, message: err.message });
          res.json({ success: true, id: this.lastID });
        });
    });

    app.put('/api/rooms/:id', authenticateToken, isAdmin, (req, res) => {
      const { room_number, capacity, type, floor, status } = req.body;
      db.run("UPDATE rooms SET room_number = ?, capacity = ?, type = ?, floor = ?, status = ? WHERE id = ?",
        [room_number, capacity, type, floor, status, req.params.id], (err) => {
          res.json({ success: !err });
        });
    });

    app.delete('/api/rooms/:id', authenticateToken, isAdmin, (req, res) => {
      db.run("DELETE FROM rooms WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: !err });
      });
    });

    // Rules CRUD
    app.get('/api/rules', (req, res) => {
      db.all("SELECT * FROM rules", (err, rows) => res.json(rows || []));
    });

    app.post('/api/rules', authenticateToken, isAdmin, (req, res) => {
      const { category, content } = req.body;
      db.run("INSERT INTO rules (category, content) VALUES (?, ?)", [category, content], function(err) {
        res.json({ success: !err, id: this.lastID });
      });
    });

    app.put('/api/rules/:id', authenticateToken, isAdmin, (req, res) => {
      const { category, content } = req.body;
      db.run("UPDATE rules SET category = ?, content = ? WHERE id = ?", [category, content, req.params.id], (err) => {
        res.json({ success: !err });
      });
    });

    app.delete('/api/rules/:id', authenticateToken, isAdmin, (req, res) => {
      db.run("DELETE FROM rules WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: !err });
      });
    });

    // Menu API
    app.get('/api/menu', (req, res) => {
      db.all("SELECT * FROM menu", (err, rows) => {
        if (err) {
          res.status(500).json({ success: false, message: "Error fetching menu" });
        } else {
          res.json({ success: true, menu: rows || [] });
        }
      });
    });

    app.put('/api/menu/:id', authenticateToken, isAdmin, (req, res) => {
      const { breakfast, lunch, snacks, dinner } = req.body;
      db.run("UPDATE menu SET breakfast = ?, lunch = ?, snacks = ?, dinner = ? WHERE id = ?", 
        [breakfast, lunch, snacks, dinner, req.params.id], (err) => {
          res.json({ success: !err });
        });
    });

    // Advanced Student Management
    app.get('/api/admin/students/:id', authenticateToken, isAdmin, (req, res) => {
      db.get("SELECT * FROM users WHERE id = ? AND role = 'student'", [req.params.id], (err, row) => {
        res.json(row);
      });
    });

    app.put('/api/admin/students/:id', authenticateToken, isAdmin, (req, res) => {
      const { full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, total_fees, status, floor, bed_number } = req.body;
      db.run(`UPDATE users SET 
        full_name = ?, email = ?, phone = ?, hostel_name = ?, block = ?, 
        room_number = ?, room_type = ?, sharing_type = ?, total_fees = ?, 
        status = ?, floor = ?, bed_number = ? 
        WHERE id = ?`,
        [full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, total_fees, status, floor, bed_number, req.params.id], 
        (err) => {
          res.json({ success: !err });
        }
      );
    });

    app.delete('/api/admin/students/:id', authenticateToken, isAdmin, (req, res) => {
      db.get("SELECT room_number FROM users WHERE id = ?", [req.params.id], (err, row: any) => {
        if (row && row.room_number) {
          db.run("UPDATE rooms SET occupancy = MAX(0, occupancy - 1) WHERE room_number = ?", [row.room_number]);
        }
        db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
          res.json({ success: !err });
        });
      });
    });

    app.post('/api/admin/students/block-unblock', authenticateToken, isAdmin, (req, res) => {
      const { student_id, status } = req.body;
      db.run("UPDATE users SET status = ? WHERE student_id = ?", [status, student_id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
      });
    });

    app.post('/api/admin/students/add', authenticateToken, isAdmin, (req, res) => {
      const { username, password, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, total_fees, floor, bed_number } = req.body;
      const hashedPw = bcrypt.hashSync(password, 10);
      db.run(`INSERT INTO users (username, password, role, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, total_fees, status, floor, bed_number) 
              VALUES (?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`,
        [username, hashedPw, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, total_fees, floor, bed_number], function(err) {
          if (err) return res.status(400).json({ success: false, message: err.message });
          db.run("UPDATE rooms SET occupancy = occupancy + 1 WHERE room_number = ?", [room_number]);
          io.emit('student_registered', { student_id, full_name, username });
          res.json({ success: true, id: this.lastID });
        });
    });

    // Payment Management
    app.post('/api/admin/payments/add', authenticateToken, isAdmin, (req, res) => {
      const { student_id, amount, mode, status, date } = req.body;
      const paymentDate = date || new Date().toISOString().split('T')[0];
      db.serialize(() => {
        db.run("INSERT INTO payments (student_id, amount, date, mode, status) VALUES (?, ?, ?, ?, ?)", 
          [student_id, amount, paymentDate, mode, status]);
        if (status === 'Success') {
          db.run("UPDATE users SET paid_amount = paid_amount + ? WHERE student_id = ?", [amount, student_id]);
        }
        res.json({ success: true });
      });
    });

    // Reports API
    app.get('/api/admin/reports/meals', authenticateToken, isAdmin, (req, res) => {
      db.all(`
        SELECT date, meal_type, count(*) as count 
        FROM meal_records 
        GROUP BY date, meal_type 
        ORDER BY date DESC 
        LIMIT 30
      `, (err, rows) => res.json(rows));
    });

    app.get('/api/admin/reports/revenue', authenticateToken, isAdmin, (req, res) => {
      db.all(`
        SELECT date, sum(amount) as total 
        FROM payments 
        WHERE status = 'Success' 
        GROUP BY date 
        ORDER BY date DESC 
        LIMIT 30
      `, (err, rows) => res.json(rows));
    });

    app.post('/api/admin/notifications/broadcast', authenticateToken, isAdmin, (req, res) => {
      const { title, message, type } = req.body;
      const date = new Date().toISOString().split('T')[0];
      db.all("SELECT student_id FROM users WHERE role='student'", (err, students: any[]) => {
        const stmt = db.prepare("INSERT INTO notifications (student_id, title, message, type, date) VALUES (?, ?, ?, ?, ?)");
        students.forEach(s => stmt.run(s.student_id, title, message, type, date));
        stmt.finalize();
        res.json({ success: true });
      });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
      console.log('--- STARTING VITE IN MIDDLEWARE MODE ---');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('--- VITE MIDDLEWARE READY ---');
    } else {
      app.use(express.static(path.join(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      });
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('--- SERVER FAILED TO START ---');
    console.error(err);
  }
}

startServer();
