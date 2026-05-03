# ✈️ Traveler

A personal travel planner for two. Plan trips day-by-day with timelines, activities, food spots, Google Maps links, and expense tracking — all in a playful scrapbook-style UI.

---

## Running Locally

### Prerequisites

- [Node.js 22+](https://nodejs.org/)

### 1. Install dependencies

```bash
npm install
```

### 2. Build the CSS

```bash
node_modules/.bin/tailwindcss -i src/css/input.css -o public/css/app.css
```

### 3. Set up your environment

Copy the example env file and edit it:

```bash
cp .env.example .env
```

Open `.env` and set your values:

```env
DATABASE_PATH=./data/traveler.db
SESSION_SECRET=any-long-random-string
APP_PASSWORD=your-chosen-password
PORT=3000
NODE_ENV=development
```

### 4. Start the server

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) and log in with the password you set in `APP_PASSWORD`.

### Development mode (auto-restart on file changes)

Run the server and CSS watcher in two terminals:

**Terminal 1 — server:**
```bash
npm run dev
```

**Terminal 2 — CSS:**
```bash
npm run watch:css
```

---

## Deploying on Railway

1. Push this repo to GitHub
2. Create a new [Railway](https://railway.app) project and connect your GitHub repo
3. In the Railway dashboard, add a **Volume** mounted at `/data`
4. Set the following environment variables:

| Variable | Value |
|---|---|
| `DATABASE_PATH` | `/data/traveler.db` |
| `SESSION_SECRET` | A random 32+ character string |
| `APP_PASSWORD` | Your login password |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

5. Deploy — Railway will automatically use the `Dockerfile` to build and run the app

The SQLite database is stored on the Railway Volume and persists across redeploys.

---

## Project Structure

```
traveler/
├── src/
│   ├── index.js          # Server entry point
│   ├── app.js            # Express setup & routes
│   ├── db/
│   │   ├── client.js     # SQLite connection
│   │   └── migrate.js    # Schema migrations (run on startup)
│   ├── routes/           # auth, trips, days, items, legs, expenses
│   ├── middleware/
│   │   └── auth.js       # requireAuth middleware
│   ├── views/            # EJS templates
│   └── css/
│       └── input.css     # Tailwind CSS source
├── public/
│   ├── css/app.css       # Built CSS (generated, do not edit)
│   └── js/               # maps-helper.js, sortable.js, app.js
├── .env.example
├── Dockerfile
└── railway.json
```
