const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const dataFile = path.join(__dirname, 'data.json');

function readData() {
  try {
    if (fs.existsSync(dataFile)) return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch(e) {}
  return [];
}

function writeData(items) {
  fs.writeFileSync(dataFile, JSON.stringify(items, null, 2));
}

// seed if empty
if (!fs.existsSync(dataFile)) {
  writeData([
    {id:uuidv4(),emoji:'👕',name:'White Oxford shirt',category:'Tops',color:'White',location:'Bedroom wardrobe — shelf 2',image_path:null,created_at:new Date().toISOString()},
    {id:uuidv4(),emoji:'👔',name:'Navy blazer',category:'Formal',color:'Navy',location:'Bedroom wardrobe — hanging rail',image_path:null,created_at:new Date().toISOString()},
    {id:uuidv4(),emoji:'👖',name:'Dark jeans',category:'Bottoms',color:'Dark blue',location:'Bedroom wardrobe — shelf 1',image_path:null,created_at:new Date().toISOString()},
    {id:uuidv4(),emoji:'👟',name:'White sneakers',category:'Footwear',color:'White',location:'Shoe rack — entryway',image_path:null,created_at:new Date().toISOString()},
    {id:uuidv4(),emoji:'🧥',name:'Black leather jacket',category:'Outerwear',color:'Black',location:'Guest room bag — black duffel',image_path:null,created_at:new Date().toISOString()},
    {id:uuidv4(),emoji:'🧣',name:'Grey scarf',category:'Accessories',color:'Grey',location:'Bedroom drawer — top',image_path:null,created_at:new Date().toISOString()},
  ]);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
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

app.get('/api/items', (req, res) => {
  const { search, category } = req.query;
  let items = readData();
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.color||'').toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q)
    );
  }
  if (category && category !== 'All') {
    items = items.filter(i => i.category === category);
  }
  res.json(items.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
});

app.post('/api/items', upload.single('image'), (req, res) => {
  const { emoji, name, category, color, location } = req.body;
  if (!name || !category || !location)
    return res.status(400).json({ error: 'Name, category, and location are required.' });
  const items = readData();
  const item = {
    id: uuidv4(),
    emoji: emoji || '👕',
    name, category,
    color: color || '',
    location,
    image_path: req.file ? `/uploads/${req.file.filename}` : null,
    created_at: new Date().toISOString()
  };
  items.push(item);
  writeData(items);
  res.json(item);
});

app.delete('/api/items/:id', (req, res) => {
  let items = readData();
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (item.image_path) {
    const file = path.join(__dirname, item.image_path);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  writeData(items.filter(i => i.id !== req.params.id));
  res.json({ ok: true });
});

app.get('/api/categories', (req, res) => {
  const items = readData();
  const cats = [...new Set(items.map(i => i.category))].sort();
  res.json(cats);
});

app.listen(PORT, () => console.log(`Wardrobe running on port ${PORT}`));
