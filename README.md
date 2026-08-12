# 🏠 UAF — Unified Accommodation Finder
## Complete Full-Stack Project

---

## 📁 Folder Structure

```
UAF-Complete-Project/
│
├── 📄 README.md
├── 🗄️  database/
│   └── database.sql              ← MySQL schema + seed data (run this first)
├── ⚙️  backend/
│   ├── server.js                 ← Node.js + Express REST API
│   ├── package.json
│   └── .env.example              ← Copy to .env and set your DB password
├── 🌐 frontend/
│   └── index.html                ← Complete web app (HTML/CSS/JS)
└── 📱 mobile-app/
    └── uaf-app/                  ← React Native Expo mobile app
        ├── app/(auth)/           ← Login + Register
        ├── app/(student)/        ← Browse, Flatmates, Requests, Notifications
        ├── app/(owner)/          ← Dashboard, Properties, Requests, Attendance, Fees
        ├── context/AuthContext.tsx
        └── constants/theme.ts    ← Set your PC IP here!
```

---

## 🚀 Setup Order

### 1️⃣  Database
```bash
mysql -u root -p
source database/database.sql;
```

### 2️⃣  Backend
```bash
cd backend
npm install
cp .env.example .env        # then edit .env with your MySQL password
node server.js
# ✅  http://localhost:5000/api/properties should return JSON
```

### 3️⃣  Web Frontend
```bash
# Just double-click frontend/index.html
# OR: cd frontend && npx serve .
```

### 4️⃣  Mobile App
```bash
cd mobile-app/uaf-app
npm install
# Open constants/theme.ts → set API_URL to your PC's IP
# e.g. http://192.168.1.105:5000/api
npx expo start
# Install Expo Go on phone → scan QR code
```

---

## 👤 Test Login
| Role | Email | Password |
|------|-------|----------|
| Owner | alice@example.com | password123 |
| Student | bob@example.com | password123 |

---

## 🔑 Key API Endpoints
| Endpoint | Method | Who |
|----------|--------|-----|
| /api/auth/register | POST | Public |
| /api/auth/login | POST | Public |
| /api/properties | GET | Public |
| /api/properties | POST | Owner |
| /api/requests | POST | Student |
| /api/requests/my | GET | Student |
| /api/requests/owner | GET | Owner |
| /api/requests/:id/status | PUT | Owner |
| /api/flatmates | GET | Public |
| /api/flatmates | POST | Student |
| /api/flatmate-connects | POST | Student |
| /api/flatmate-connects/received | GET | Student |
| /api/flatmate-connects/sent | GET | Student |
| /api/attendance/:id | GET/POST | Owner |
| /api/fees/:id | GET/POST | Owner |
| /api/owner/stats | GET | Owner |

---

## 🔧 Common Issues
| Problem | Fix |
|---------|-----|
| Server won't start | Check .env DB_PASSWORD |
| Mobile Network Error | Set correct PC IP in constants/theme.ts |
| 409 on Register | Email already exists — use different email |
| Images not loading | Create uploads/ folder inside backend/ |
| Phone can't reach server | Phone + PC must be on same WiFi |

---
*UAF v1.0.0 — Database + Backend + Web + Mobile*
