// ============================================================
// UNIFIED ACCOMMODATION FINDER — Node.js + Express + MySQL
// ============================================================
// File: server.js
// Run: npm install express mysql2 bcryptjs jsonwebtoken multer cors dotenv
//      node server.js
// ============================================================

const express    = require('express');
const mysql      = require('mysql2/promise');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const multer     = require('multer');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'uaf_super_secret_key_2024';

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── DB Pool ─────────────────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'unified_accommodation',
  waitForConnections: true,
  connectionLimit:    10,
  // Aiven requires SSL; rejectUnauthorized: false allows self-signed/managed certificates
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// ─── Multer (image upload) ───────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 }  // 5 MB
});

// ─── Auth Middleware ─────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function ownerOnly(req, res, next) {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Owner access only' });
  next();
}

// ════════════════════════════════════════════════════════════
// BASE ROUTE
// ════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.send('UAF Backend API is running successfully!');
});

// ════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Required fields missing' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name,email,password,phone,role) VALUES (?,?,?,?,?)',
      [name, email, hash, phone || null, role === 'owner' ? 'owner' : 'user']
    );
    res.status(201).json({ message: 'Registered successfully', userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [[user]] = await pool.execute('SELECT * FROM users WHERE email=?', [email]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// PROPERTY ROUTES
// ════════════════════════════════════════════════════════════

// GET /api/properties  — ALL properties
app.get('/api/properties', async (req, res) => {
  try {
    const { type, location, min_rent, max_rent, vacancy } = req.query;
    let sql = `
      SELECT p.*, u.name AS owner_name, u.phone AS owner_phone
      FROM properties p
      JOIN users u ON u.id = p.owner_id
      WHERE 1=1
    `;
    const params = [];
    if (type)     { sql += ' AND p.type=?';             params.push(type); }
    if (location) { sql += ' AND p.location LIKE ?';    params.push(`%${location}%`); }
    if (min_rent) { sql += ' AND p.rent >= ?';          params.push(min_rent); }
    if (max_rent) { sql += ' AND p.rent <= ?';          params.push(max_rent); }
    if (vacancy)  { sql += ' AND p.vacancy_status=?';   params.push(vacancy); }
    sql += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/properties/:id
app.get('/api/properties/:id', async (req, res) => {
  try {
    const [[row]] = await pool.execute(
      `SELECT p.*, u.name AS owner_name, u.phone AS owner_phone
       FROM properties p JOIN users u ON u.id=p.owner_id
       WHERE p.id=?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Property not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties  (owner only)
app.post('/api/properties', authMiddleware, ownerOnly, upload.single('image'), async (req, res) => {
  try {
    const { type, title, location, rent, total_rooms, available_rooms, vacancy_status, facilities, description } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.execute(
      `INSERT INTO properties
       (owner_id,type,title,location,rent,total_rooms,available_rooms,vacancy_status,facilities,image_path,description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, type, title, location, rent, total_rooms, available_rooms || 0,
       vacancy_status || 'available', facilities || '', image_path, description || '']
    );
    res.status(201).json({ message: 'Property added', propertyId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/properties/:id  (owner only)
app.put('/api/properties/:id', authMiddleware, ownerOnly, upload.single('image'), async (req, res) => {
  try {
    const [[prop]] = await pool.execute('SELECT * FROM properties WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
    if (!prop) return res.status(404).json({ error: 'Property not found or not yours' });

    const { type, title, location, rent, total_rooms, available_rooms, vacancy_status, facilities, description } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : prop.image_path;

    await pool.execute(
      `UPDATE properties SET type=?,title=?,location=?,rent=?,total_rooms=?,available_rooms=?,
       vacancy_status=?,facilities=?,image_path=?,description=? WHERE id=?`,
      [type, title, location, rent, total_rooms, available_rooms, vacancy_status, facilities, image_path, description, req.params.id]
    );
    res.json({ message: 'Property updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/properties/:id  (owner only)
app.delete('/api/properties/:id', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM properties WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Property not found or not yours' });
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/owner/properties  — owner's own listings
app.get('/api/owner/properties', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM properties WHERE owner_id=? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// REQUEST ROUTES  (Student → Owner)
// ════════════════════════════════════════════════════════════

// POST /api/requests  (student sends request)
app.post('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { property_id, message, contact } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO requests (user_id,property_id,message,contact) VALUES (?,?,?,?)',
      [req.user.id, property_id, message || '', contact || '']
    );
    res.status(201).json({ message: 'Request sent', requestId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/owner  — owner sees all requests for their properties
app.get('/api/requests/owner', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.name AS student_name, u.email AS student_email, p.title AS property_title
       FROM requests r
       JOIN users u ON u.id=r.user_id
       JOIN properties p ON p.id=r.property_id
       WHERE p.owner_id=?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/my  — student sees their own requests with status
app.get('/api/requests/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, p.title AS property_title, p.location AS property_location,
              p.type AS property_type, p.rent AS property_rent,
              u.name AS owner_name, u.phone AS owner_phone, u.email AS owner_email
       FROM requests r
       JOIN properties p ON p.id=r.property_id
       JOIN users u ON u.id=p.owner_id
       WHERE r.user_id=?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:id/status  (accept/reject)
app.put('/api/requests/:id/status', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await pool.execute(
      `UPDATE requests r
       JOIN properties p ON p.id=r.property_id
       SET r.status=?
       WHERE r.id=? AND p.owner_id=?`,
      [status, req.params.id, req.user.id]
    );
    res.json({ message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// FLATMATE ROUTES
// ════════════════════════════════════════════════════════════

// GET /api/flatmates  — visible to ALL students
app.get('/api/flatmates', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.*, u.email AS poster_email
       FROM flatmate_requests f
       JOIN users u ON u.id=f.user_id
       ORDER BY f.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/flatmates  (student posts)
app.post('/api/flatmates', authMiddleware, async (req, res) => {
  try {
    const { name, budget, location, gender, description, contact } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO flatmate_requests (user_id,name,budget,location,gender,description,contact) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, name, budget || null, location || '', gender || 'any', description || '', contact || '']
    );
    res.status(201).json({ message: 'Flatmate request posted', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/flatmates/:id
app.delete('/api/flatmates/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM flatmate_requests WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Post not found or not yours' });
    res.json({ message: 'Flatmate request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// FLATMATE CONNECT ROUTES
// ════════════════════════════════════════════════════════════

// POST /api/flatmate-connects  — student sends connect request
app.post('/api/flatmate-connects', authMiddleware, async (req, res) => {
  try {
    const { flatmate_request_id, message, contact } = req.body;
    const [[post]] = await pool.execute('SELECT * FROM flatmate_requests WHERE id=?', [flatmate_request_id]);
    if (!post) return res.status(404).json({ error: 'Flatmate post not found' });
    if (post.user_id === req.user.id) return res.status(400).json({ error: 'Cannot connect to your own post' });

    const [result] = await pool.execute(
      `INSERT INTO flatmate_connects (sender_id, flatmate_request_id, target_user_id, message, contact)
       VALUES (?,?,?,?,?)`,
      [req.user.id, flatmate_request_id, post.user_id, message || '', contact || '']
    );
    res.status(201).json({ message: 'Connect request sent', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/flatmate-connects/received  — see who connected to YOUR post
app.get('/api/flatmate-connects/received', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT fc.*, u.name AS sender_name, u.email AS sender_email,
              fr.name AS post_name, fr.location AS post_location, fr.budget AS post_budget
       FROM flatmate_connects fc
       JOIN users u ON u.id=fc.sender_id
       JOIN flatmate_requests fr ON fr.id=fc.flatmate_request_id
       WHERE fc.target_user_id=?
       ORDER BY fc.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/flatmate-connects/sent  — see requests YOU sent
app.get('/api/flatmate-connects/sent', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT fc.*, u.name AS target_name, u.email AS target_email,
              fr.name AS post_name, fr.location AS post_location, fr.budget AS post_budget
       FROM flatmate_connects fc
       JOIN users u ON u.id=fc.target_user_id
       JOIN flatmate_requests fr ON fr.id=fc.flatmate_request_id
       WHERE fc.sender_id=?
       ORDER BY fc.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/flatmate-connects/:id/status  — accept/reject flatmate connect
app.put('/api/flatmate-connects/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await pool.execute(
      'UPDATE flatmate_connects SET status=? WHERE id=? AND target_user_id=?',
      [status, req.params.id, req.user.id]
    );
    res.json({ message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// ATTENDANCE ROUTES  (PG & Hostel only)
// ════════════════════════════════════════════════════════════

// GET /api/attendance/:property_id
app.get('/api/attendance/:property_id', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { date } = req.query;
    let sql = 'SELECT * FROM attendance WHERE property_id=?';
    const params = [req.params.property_id];
    if (date) { sql += ' AND date=?'; params.push(date); }
    sql += ' ORDER BY date DESC, room_no';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance  — mark attendance
app.post('/api/attendance', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { property_id, tenant_name, room_no, date, status } = req.body;
    const [[prop]] = await pool.execute('SELECT type FROM properties WHERE id=? AND owner_id=?', [property_id, req.user.id]);
    if (!prop) return res.status(404).json({ error: 'Property not found' });
    if (!['PG','Hostel'].includes(prop.type)) return res.status(400).json({ error: 'Attendance only for PG or Hostel' });

    await pool.execute(
      `INSERT INTO attendance (property_id,tenant_name,room_no,date,status)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE status=VALUES(status)`,
      [property_id, tenant_name, room_no, date, status || 'present']
    );
    res.json({ message: 'Attendance marked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// FEES ROUTES
// ════════════════════════════════════════════════════════════

// GET /api/fees/:property_id
app.get('/api/fees/:property_id', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { month } = req.query;
    let sql = 'SELECT * FROM fees WHERE property_id=?';
    const params = [req.params.property_id];
    if (month) { sql += ' AND month=?'; params.push(month); }
    sql += ' ORDER BY month DESC, room_no';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees  — add/update fee record
app.post('/api/fees', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { property_id, tenant_name, room_no, rent, month, status } = req.body;
    await pool.execute(
      `INSERT INTO fees (property_id,tenant_name,room_no,rent,month,status)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE rent=VALUES(rent), status=VALUES(status)`,
      [property_id, tenant_name, room_no, rent, month, status || 'unpaid']
    );
    res.json({ message: 'Fee record saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/fees/:id/status
app.put('/api/fees/:id/status', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['paid','unpaid'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await pool.execute(
      `UPDATE fees f JOIN properties p ON p.id=f.property_id
       SET f.status=? WHERE f.id=? AND p.owner_id=?`,
      [status, req.params.id, req.user.id]
    );
    res.json({ message: 'Fee status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard Stats (owner) ────────────────────────────────
app.get('/api/owner/stats', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const [[{ total }]]       = await pool.execute('SELECT COUNT(*) AS total FROM properties WHERE owner_id=?', [req.user.id]);
    const [[{ available }]]   = await pool.execute("SELECT COUNT(*) AS available FROM properties WHERE owner_id=? AND vacancy_status='available'", [req.user.id]);
    const [[{ pending }]]     = await pool.execute(
      "SELECT COUNT(*) AS pending FROM requests r JOIN properties p ON p.id=r.property_id WHERE p.owner_id=? AND r.status='pending'",
      [req.user.id]
    );
    const [[{ unpaid_fees }]] = await pool.execute(
      "SELECT COUNT(*) AS unpaid_fees FROM fees f JOIN properties p ON p.id=f.property_id WHERE p.owner_id=? AND f.status='unpaid'",
      [req.user.id]
    );
    res.json({ total_properties: total, available_properties: available, pending_requests: pending, unpaid_fees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => console.log(`🏠 UAF Server running on http://localhost:${PORT}`));