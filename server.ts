import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

console.log('--- SERVER STARTING ---');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.use(express.json());

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

      // Performance Indexes
      db.run("CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status)");
      db.run("CREATE INDEX IF NOT EXISTS idx_meal_records_date_type ON meal_records(date, meal_type)");
      db.run("CREATE INDEX IF NOT EXISTS idx_meal_records_student_date ON meal_records(student_id, date)");
      db.run("CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id)");
      db.run("CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id)");
      db.run("CREATE INDEX IF NOT EXISTS idx_users_room ON users(room_number)");

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
            ['student', hashedPw, 'student', 'STU001', 'John Doe', 'john@example.com', '+91 9876543210', 'North Wing', 'B-Block', '302', 'AC', 'Double', '3rd Floor', 'B1', 35000, '2024-04-15']);
          
          // Add some payments
          db.run("INSERT INTO payments (student_id, amount, date, mode, status) VALUES (?, ?, ?, ?, ?)", ['STU001', 20000, '2024-01-10', 'UPI', 'Success']);
          db.run("INSERT INTO payments (student_id, amount, date, mode, status) VALUES (?, ?, ?, ?, ?)", ['STU001', 15000, '2024-02-15', 'Card', 'Success']);

          // Add some notifications
          db.run("INSERT INTO notifications (student_id, title, message, type, date) VALUES (?, ?, ?, ?, ?)", ['STU001', 'Payment Reminder', 'Your next installment is due on 15th April.', 'payment', '2024-03-20']);
          db.run("INSERT INTO notifications (student_id, title, message, type, date) VALUES (NULL, 'Admin Announcement', 'Hostel maintenance scheduled for this Sunday.', 'admin', '2024-03-21')");
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
    });

    // API Routes
    app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;
      db.get("SELECT * FROM users WHERE username = ?", [username], (err, user: any) => {
        if (user && bcrypt.compareSync(password, user.password)) {
          res.json({ success: true, user });
        } else {
          res.status(401).json({ success: false, message: "Invalid credentials" });
        }
      });
    });

    app.post('/api/auth/signup', (req, res) => {
      const { username, password, student_id, full_name, email, phone } = req.body;
      const hashedPw = bcrypt.hashSync(password, 10);
      db.run(`INSERT INTO users 
        (username, password, role, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, floor, bed_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [username, hashedPw, 'student', student_id, full_name, email, phone, 'Main Hostel', 'A', '101', 'Non-AC', 'Triple', '1st', 'A1'], (err) => {
        if (err) {
          res.status(400).json({ success: false, message: "Username or Student ID already exists" });
        } else {
          res.json({ success: true });
        }
      });
    });

    app.get('/api/payments/:student_id', (req, res) => {
      db.all("SELECT * FROM payments WHERE student_id = ? ORDER BY date DESC", [req.params.student_id], (err, rows) => {
        res.json(rows);
      });
    });

    app.get('/api/notifications/:student_id', (req, res) => {
      db.all("SELECT * FROM notifications WHERE student_id = ? OR student_id IS NULL ORDER BY date DESC", [req.params.student_id], (err, rows) => {
        res.json(rows);
      });
    });

    app.post('/api/auth/change-password', (req, res) => {
      const { userId, oldPassword, newPassword } = req.body;
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

    app.post('/api/payments/pay', (req, res) => {
      const { student_id, amount, mode } = req.body;
      const date = new Date().toISOString().split('T')[0];
      
      db.serialize(() => {
        db.run("INSERT INTO payments (student_id, amount, date, mode, status) VALUES (?, ?, ?, ?, ?)", [student_id, amount, date, mode, 'Success']);
        db.run("UPDATE users SET paid_amount = paid_amount + ? WHERE student_id = ?", [amount, student_id], (err) => {
          if (err) {
            res.status(500).json({ success: false, message: "Error updating payment" });
          } else {
            db.get("SELECT * FROM users WHERE student_id = ?", [student_id], (err, user) => {
              res.json({ success: true, user });
            });
          }
        });
      });
    });

    app.post('/api/user/update-profile', (req, res) => {
      const { userId, full_name, email, phone, profile_photo } = req.body;
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

    app.get('/api/students', (req, res) => {
      db.all("SELECT id, username, student_id, full_name, total_fees, paid_amount, status FROM users WHERE role = 'student'", (err, rows) => {
        res.json(rows);
      });
    });

    app.get('/api/admin/payments', (req, res) => {
      db.all(`
        SELECT p.*, u.username, u.full_name 
        FROM payments p 
        JOIN users u ON p.student_id = u.student_id 
        ORDER BY p.date DESC
      `, (err, rows) => {
        res.json(rows);
      });
    });

    app.get('/api/meal-logs', (req, res) => {
      db.all(`
        SELECT m.*, u.username 
        FROM meal_records m 
        JOIN users u ON m.student_id = u.student_id 
        ORDER BY m.timestamp DESC
      `, (err, rows) => {
        res.json(rows);
      });
    });

    app.post('/api/meal-access', (req, res) => {
      const { student_id } = req.body;
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

    // --- Admin Dashboard API ---
    app.get('/api/admin/stats', (req, res) => {
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
        res.json(stats);
      }).catch(err => {
        res.status(500).json({ error: err.message });
      });
    });

    // Rooms CRUD
    app.get('/api/rooms', (req, res) => {
      db.all("SELECT * FROM rooms", (err, rows) => res.json(rows));
    });

    app.get('/api/rooms/:roomNumber/students', (req, res) => {
      db.all("SELECT id, full_name, student_id, status FROM users WHERE room_number = ? AND role = 'student'", 
        [req.params.roomNumber], (err, rows) => {
          res.json(rows);
        });
    });

    app.post('/api/rooms', (req, res) => {
      const { room_number, capacity, type, floor } = req.body;
      db.run("INSERT INTO rooms (room_number, capacity, type, floor) VALUES (?, ?, ?, ?)", 
        [room_number, capacity, type, floor], function(err) {
          if (err) return res.status(400).json({ success: false, message: err.message });
          res.json({ success: true, id: this.lastID });
        });
    });

    app.put('/api/rooms/:id', (req, res) => {
      const { room_number, capacity, type, floor, status } = req.body;
      db.run("UPDATE rooms SET room_number = ?, capacity = ?, type = ?, floor = ?, status = ? WHERE id = ?",
        [room_number, capacity, type, floor, status, req.params.id], (err) => {
          res.json({ success: !err });
        });
    });

    app.delete('/api/rooms/:id', (req, res) => {
      db.run("DELETE FROM rooms WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: !err });
      });
    });

    // Rules CRUD
    app.get('/api/rules', (req, res) => {
      db.all("SELECT * FROM rules", (err, rows) => res.json(rows));
    });

    app.post('/api/rules', (req, res) => {
      const { category, content } = req.body;
      db.run("INSERT INTO rules (category, content) VALUES (?, ?)", [category, content], function(err) {
        res.json({ success: !err, id: this.lastID });
      });
    });

    app.put('/api/rules/:id', (req, res) => {
      const { category, content } = req.body;
      db.run("UPDATE rules SET category = ?, content = ? WHERE id = ?", [category, content, req.params.id], (err) => {
        res.json({ success: !err });
      });
    });

    app.delete('/api/rules/:id', (req, res) => {
      db.run("DELETE FROM rules WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: !err });
      });
    });

    // Advanced Student Management
    app.get('/api/admin/students/:id', (req, res) => {
      db.get("SELECT * FROM users WHERE id = ? AND role = 'student'", [req.params.id], (err, row) => {
        res.json(row);
      });
    });

    app.put('/api/admin/students/:id', (req, res) => {
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

    app.delete('/api/admin/students/:id', (req, res) => {
      db.get("SELECT room_number FROM users WHERE id = ?", [req.params.id], (err, row: any) => {
        if (row && row.room_number) {
          db.run("UPDATE rooms SET occupancy = MAX(0, occupancy - 1) WHERE room_number = ?", [row.room_number]);
        }
        db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
          res.json({ success: !err });
        });
      });
    });

    app.post('/api/admin/students/add', (req, res) => {
      const { username, password, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, total_fees, floor, bed_number } = req.body;
      const hashedPw = bcrypt.hashSync(password, 10);
      db.run(`INSERT INTO users (username, password, role, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, total_fees, status, floor, bed_number) 
              VALUES (?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`,
        [username, hashedPw, student_id, full_name, email, phone, hostel_name, block, room_number, room_type, sharing_type, total_fees, floor, bed_number], function(err) {
          if (err) return res.status(400).json({ success: false, message: err.message });
          db.run("UPDATE rooms SET occupancy = occupancy + 1 WHERE room_number = ?", [room_number]);
          res.json({ success: true, id: this.lastID });
        });
    });

    // Payment Management
    app.post('/api/admin/payments/add', (req, res) => {
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
    app.get('/api/admin/reports/meals', (req, res) => {
      db.all(`
        SELECT date, meal_type, count(*) as count 
        FROM meal_records 
        GROUP BY date, meal_type 
        ORDER BY date DESC 
        LIMIT 30
      `, (err, rows) => res.json(rows));
    });

    app.get('/api/admin/reports/revenue', (req, res) => {
      db.all(`
        SELECT date, sum(amount) as total 
        FROM payments 
        WHERE status = 'Success' 
        GROUP BY date 
        ORDER BY date DESC 
        LIMIT 30
      `, (err, rows) => res.json(rows));
    });

    app.post('/api/admin/notifications/broadcast', (req, res) => {
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

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('--- SERVER FAILED TO START ---');
    console.error(err);
  }
}

startServer();
