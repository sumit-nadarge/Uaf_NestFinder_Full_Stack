# 🏠 UAF Mobile App — React Native (Expo)

A full-featured mobile app for the Unified Accommodation Finder, built with **React Native + Expo**.

---

## 📁 Project Structure

```
uaf-app/
├── app/
│   ├── _layout.tsx              ← Root layout + auth routing
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx            ← Login screen
│   │   └── register.tsx         ← Register screen
│   ├── (student)/
│   │   ├── _layout.tsx          ← Bottom tab navigator
│   │   ├── browse.tsx           ← Browse PG/Hostel/Flat + send request
│   │   ├── flatmates.tsx        ← Find/post/delete flatmate + send request
│   │   ├── my-requests.tsx      ← Own requests with owner contact on accept
│   │   ├── notifications.tsx    ← All notifications (stays + flatmate)
│   │   └── profile.tsx          ← Profile + logout
│   └── (owner)/
│       ├── _layout.tsx          ← Bottom tab navigator
│       ├── dashboard.tsx        ← Stats overview
│       ├── properties.tsx       ← Add/edit/delete properties + image upload
│       ├── requests.tsx         ← View/accept/reject student requests
│       ├── attendance.tsx       ← Mark PG/Hostel attendance
│       └── fees.tsx             ← Track & toggle fee payments
├── context/
│   └── AuthContext.tsx          ← JWT auth + API helper
├── constants/
│   └── theme.ts                 ← Colors + API URL
├── app.json
├── package.json
└── babel.config.js
```

---

## ⚙️ Setup Instructions

### Step 1 — Install Node.js & Expo CLI
```bash
# Install Expo CLI globally
npm install -g expo-cli eas-cli
```

### Step 2 — Install dependencies
```bash
cd uaf-app
npm install
```

### Step 3 — Set your backend IP address
Open `constants/theme.ts` and update:
```ts
export const API_URL = 'http://YOUR_PC_IP:5000/api';
```

**Find your PC's IP:**
- Windows: Open CMD → type `ipconfig` → look for **IPv4 Address**
- Example: `http://192.168.1.105:5000/api`

> ⚠️ Do NOT use `localhost` — the phone and PC must use the real local IP!

### Step 4 — Make sure backend is running
```bash
# In your uaf project folder
node server.js
```

### Step 5 — Start the Expo app
```bash
npx expo start
```

---

## 📱 Run on Your Phone

### Option A — Expo Go (Easiest, no setup)
1. Install **Expo Go** from Play Store / App Store
2. Run `npx expo start`
3. Scan the **QR code** with Expo Go
4. App loads instantly on your phone!

### Option B — Android APK (Standalone)
```bash
# Install EAS
npm install -g eas-cli

# Login to Expo account (free)
eas login

# Build APK
eas build -p android --profile preview

# Download APK from the link provided, install on phone
```

### Option C — Run on Android Emulator
```bash
# Install Android Studio + emulator
npx expo start --android
```

---

## 🔗 Connect App to Backend

| App Screen | Backend API |
|------------|-------------|
| Login/Register | `/api/auth/login`, `/api/auth/register` |
| Browse Properties | `GET /api/properties` |
| Send Request | `POST /api/requests` |
| My Requests | `GET /api/requests/my` |
| Flatmate List | `GET /api/flatmates` |
| Post Flatmate | `POST /api/flatmates` |
| Send Flatmate Connect | `POST /api/flatmate-connects` |
| Notifications | `GET /api/requests/my` + `GET /api/flatmate-connects/*` |
| Owner Dashboard | `GET /api/owner/stats` |
| Owner Properties | `GET/POST/PUT/DELETE /api/properties` |
| Owner Requests | `GET /api/requests/owner` |
| Accept/Reject | `PUT /api/requests/:id/status` |
| Attendance | `GET/POST /api/attendance/:id` |
| Fees | `GET/POST/PUT /api/fees` |

---

## 📲 App Features

### 👨‍🎓 Student
| Feature | Screen |
|---------|--------|
| Browse PG/Hostel/Flat with images | Browse |
| Filter by type & search by location | Browse |
| Send accommodation request to owner | Browse |
| View all flatmate posts | Flatmates |
| Post flatmate request | Flatmates |
| Send flatmate connect request | Flatmates |
| Delete own flatmate post | Flatmates |
| Track request status (pending/accepted/rejected) | My Requests |
| See owner contact when accepted | My Requests |
| Accommodation notifications | Notifications |
| Flatmate received requests (accept/decline) | Notifications |
| Flatmate sent requests status | Notifications |

### 🏠 Owner
| Feature | Screen |
|---------|--------|
| Stats dashboard | Dashboard |
| Add property with image | Properties |
| Edit / Delete property | Properties |
| View student requests | Requests |
| Filter by status | Requests |
| Accept / Reject requests | Requests |
| Mark tenant attendance | Attendance |
| View attendance records | Attendance |
| Add fee records | Fees |
| Toggle paid/unpaid status | Fees |
| Revenue summary | Fees |

---

## 🚨 Common Issues

| Problem | Fix |
|---------|-----|
| "Network request failed" | Make sure backend is running and IP is correct in `theme.ts` |
| Images not loading | Check `API_URL` in `theme.ts` — must be your PC's IP, not localhost |
| App stuck on loading | Check if server is running: `node server.js` |
| QR code not scanning | Make sure phone and PC are on same WiFi network |
| "Module not found" | Run `npm install` again |
