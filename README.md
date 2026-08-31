# My Wardrobe

A personal wardrobe manager that works like a shopping site. Browse your clothes, select items, and find out exactly which room or bag they are in.

## Features

- Browse all clothes in a grid like a shopping site
- Upload a photo for each item
- Filter by category, search by name / colour / location
- Select items and hit **Find in room** to see exactly where they are
- Add and delete items at any time

## Run locally

```bash
npm install
node server.js
```

Then open `http://localhost:3000`

## Deploy to Render (free)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) and sign in
3. Click **New** → **Web Service**
4. Connect your GitHub repo
5. Render auto-detects `render.yaml` — click **Deploy**
6. Your app will be live at `https://wardrobe-app.onrender.com` (or similar)

> **Important:** The `render.yaml` includes a persistent disk so your database and uploaded photos survive deploys and restarts. Without this, data resets on every deploy.

## Project structure

```
wardrobe/
├── server.js          # Express API + SQLite database
├── public/
│   └── index.html     # Full frontend (vanilla JS, no build step)
├── uploads/           # Uploaded photos (created automatically)
├── render.yaml        # Render deployment config
├── package.json
└── .gitignore
```
