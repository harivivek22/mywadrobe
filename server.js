const express = require('express');
const multer = require('multer');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ensure uploads dir exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// database
const db = new Database(path.join(__dirname, 'wardrobe.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    emoji TEXT NOT NULL DEFAULT '👕',
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT,
    location TEXT NOT NULL,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// seed some items if empty
const count = db.prepare('SELECT COUNT(*) as c FROM items').get().c;
if (count === 0) {
  const insert = db.prepare('INSERT INTO items (id,emoji,name,category,color,location) VALUES (?,?,?,?,?,?)');
  const seed = [
    ['👕','White Oxford shirt','Tops','White','Bedroom wardrobe — shelf 2'],
    ['👔','Navy blazer','Formal','Navy','Bedroom wardrobe — hanging rail'],
    ['👖','Dark jeans','Bottoms','Dark blue','Bedroom wardrobe — shelf 1'],
    ['👟','White sneakers','Footwear','White','Shoe rack — entryway'],
    ['🧥','Black leather jacket','Outerwear','Black','Guest room bag — black duffel'],
    ['🧣','Grey scarf','Accessories','Grey','Bedroom drawer — top'],
  ];
  seed.forEach(s => insert.run(uuidv4(), ...s));
}

// multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

// GET all items
app.get('/api/items', (req, res) => {
  const { search, category } = req.query;
  let sql = 'SELECT * FROM items WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (name LIKE ? OR color LIKE ? OR location LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// POST add item (with optional image)
app.post('/api/items', upload.single('image'), (req, res) => {
  const { emoji, name, category, color, location } = req.body;
  if (!name || !category || !location) {
    return res.status(400).json({ error: 'Name, category, and location are required.' });
  }
  const id = uuidv4();
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;
  db.prepare(
    'INSERT INTO items (id,emoji,name,category,color,location,image_path) VALUES (?,?,?,?,?,?,?)'
  ).run(id, emoji || '👕', name, category, color || '', location, image_path);
  res.json(db.prepare('SELECT * FROM items WHERE id=?').get(id));
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (item.image_path) {
    const file = path.join(__dirname, item.image_path);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  db.prepare('DELETE FROM items WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// GET categories
app.get('/api/categories', (req, res) => {
  const cats = db.prepare('SELECT DISTINCT category FROM items ORDER BY category').all().map(r => r.category);
  res.json(cats);
});

app.listen(PORT, () => console.log(`Wardrobe running on port ${PORT}`));
