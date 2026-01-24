# 📱 Running Ladoo Business App on Android Phone

This guide provides step-by-step instructions to run the application on your Android device using Expo.

---

## 🎯 Prerequisites

Before starting, ensure you have:

1. **Node.js + npm** installed on your laptop
2. **Android phone** with Android 6.0 or higher
3. **Expo Go app** installed on your Android phone
   - Download from: [Google Play Store - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
4. **Laptop and Android phone on same WiFi network**
5. **PostgreSQL and Redis running** on your laptop (for backend)

---

## 🚀 Step 1: Start the Backend Server

Open **PowerShell Window 1** and start the backend:

```powershell
# Navigate to backend directory
cd "C:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI\backend"

# Ensure .env file exists with proper database and Redis configuration
# If not, copy from .env.example and update values:
# - DATABASE_URL: PostgreSQL connection string
# - REDIS_HOST: localhost
# - REDIS_PORT: 6379

# Start the backend server
npm run dev
```

**Expected Output:**
```
[nodemon] starting `ts-node src/index.ts`
[2026-01-18 19:30:49] info: Database connected successfully
[2026-01-18 19:30:49] info: Redis connected successfully
[2026-01-18 19:30:49] info: Server started { "port": "3000", "environment": "development" }
```

✅ **Backend is running at**: `http://localhost:3000`

---

## 🚀 Step 2: Configure Mobile App Environment

Open **PowerShell Window 2** and configure the mobile app:

```powershell
# Navigate to mobile app directory
cd "C:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI\mobile-app"

# Check if .env file exists
# If not, create it by copying from .env.example:
# copy .env.example .env

# Edit .env and update the backend API URL
# You need your laptop's local IP address (not localhost)
```

### 🔍 Find Your Laptop's Local IP Address

Run this in PowerShell:
```powershell
# Method 1: Get all network adapters with IP addresses
Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4" -and $_.InterfaceAlias -like "*Ethernet*" -or $_.InterfaceAlias -like "*WiFi*"} | Select-Object IPAddress, InterfaceAlias

# Common output:
# IPAddress       InterfaceAlias
# ---------       --------------
# 192.168.1.100   WiFi
```

**Example**: If your IP is `192.168.1.100`, use `http://192.168.1.100:3000`

### ✏️ Update .env File

Open `mobile-app/.env` and update:

```dotenv
# Replace localhost with your laptop's IP address
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAPTOP_IP:3000/api
EXPO_PUBLIC_API_TIMEOUT=30000

# Example:
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000/api
```

⚠️ **Important**: 
- Use your laptop's **actual IP address** (not `localhost` or `127.0.0.1`)
- Ensure your Android phone is on the **same WiFi network** as your laptop

---

## 🚀 Step 3: Install Dependencies

In **PowerShell Window 2**:

```powershell
# Make sure you're in mobile-app directory
cd "C:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI\mobile-app"

# Install all dependencies
npm install
```

---

## 🚀 Step 4: Start Expo Development Server

In **PowerShell Window 2**:

```powershell
# Start the Expo development server
npm start
```

**Expected Output:**
```
expo-cli start command
Tunnel ready
Logs for your project will appear below. Press Ctrl+C to exit.

To open app in Expo Go app, scan the QR code below with Expo Go app or web browser.

┌─────────────────────────────────────┐
│ Expo Go                             │
│ http://localhost:19000              │
│ exp://192.168.1.100:19000?...       │
├─────────────────────────────────────┤
│ You can open this project in another development client.
│
│ Use Expo Dev Client:
│ eas build --platform android --profile preview
│ eas build --platform ios --profile preview
│
│ Use web: w
│ Use Android: a
│ Use iOS: i
│ Use Expo Go: s
└─────────────────────────────────────┘
```

✅ **Expo server is running** and ready for connection!

---

## 📱 Step 5: Connect Android Phone to Expo

### Option A: Using QR Code (Recommended)

1. **Open Expo Go app** on your Android phone
2. **Tap "Scan QR code"** button
3. **Scan the QR code** displayed in PowerShell
4. **Wait for app to load** (first load takes 1-2 minutes)

### Option B: Manual Connection (If QR code doesn't work)

1. **Open Expo Go app** on your Android phone
2. **Go to Projects tab** → **Recent** or **Add**
3. **Enter the connection string**: `exp://192.168.1.100:19000`
   - Replace `192.168.1.100` with your actual laptop IP
4. **Wait for app to load**

### ✅ Verification

Once connected:
- You should see the Ladoo Business app loading on your Android phone
- The app will display:
  - Login/Register screen
  - Products listing
  - Shopping cart
  - Profile section
  - Admin dashboard (if applicable)

---

## 🧪 Testing the App on Android

### 1. **Test Login/Registration**
- Register a new account
- Login with credentials
- Verify authentication works

### 2. **Test Products Feature**
- Browse products
- View product details
- Check images load correctly
- Verify sorting/filtering

### 3. **Test Cart Functionality**
- Add products to cart
- View cart items
- Update quantities
- Remove items

### 4. **Test Other Features**
- Wishlist functionality
- Profile management
- Order history
- Notifications

### 5. **Check Backend Connectivity**
- All API calls should work (no CORS errors)
- Authentication tokens should be properly stored
- Real-time updates should function

---

## 🔧 Troubleshooting

### ❌ "Cannot connect to server"
**Solution**:
- Verify backend is running: `curl http://localhost:3000/health`
- Check your laptop IP address is correct in `.env`
- Ensure laptop and phone are on the same WiFi
- Check Windows Firewall isn't blocking port 3000:
  ```powershell
  # Allow Node.js through firewall
  New-NetFirewallRule -DisplayName "Node.js" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
  ```

### ❌ "QR code doesn't work"
**Solution**:
- Use Option B (manual connection with IP address)
- Or restart Expo: Press `C` in PowerShell, then `npm start` again

### ❌ "App keeps loading or crashes"
**Solution**:
- Check backend logs for errors
- Verify all required environment variables in `.env`
- Clear Expo cache:
  ```powershell
  npm start -- --clear
  ```

### ❌ "Images not loading"
**Solution**:
- Check Cloudinary is configured in backend `.env`
- Verify `CLOUDINARY_CLOUD_NAME` is correct
- Check internet connection on phone

### ❌ "Authentication failing"
**Solution**:
- Verify JWT_SECRET in backend `.env` is set
- Check token storage is working (check browser DevTools in Expo)
- Clear app cache: Long press app → App info → Clear cache

---

## 📊 Development Workflow

### Making Code Changes

1. **Edit mobile app code** in `mobile-app/src/`
2. **Save the file** - Expo will auto-refresh
3. **Check Android phone** - Changes appear automatically (hot reload)

### Viewing Logs

In the Expo terminal, logs from your Android phone appear in real-time:
```
[user] login successful
[api] GET /api/products 200
[error] Network timeout
```

### Debugging

- **In Expo**: Press `J` to open debugger menu
- **Shake phone**: Opens developer menu with debug options
- **DevTools**: Available at `http://localhost:19002`

---

## 🎯 Quick Reference Commands

```powershell
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Mobile App
cd mobile-app
npm install
npm start

# Find laptop IP
Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4"}

# Test backend health
curl http://localhost:3000/health
```

---

## 📋 Checklist Before Testing

- [ ] PostgreSQL is running
- [ ] Redis is running
- [ ] Backend server is running on port 3000
- [ ] Backend `.env` has correct database and Redis configuration
- [ ] Mobile app `.env` has correct backend IP address (not localhost)
- [ ] Laptop and Android phone are on same WiFi network
- [ ] Expo Go app is installed on Android phone
- [ ] Node.js firewall rule is added (if using Windows Firewall)
- [ ] QR code is showing in PowerShell terminal

---

## 🚀 Next Steps

After successful testing:

1. **Test all features** thoroughly on Android
2. **Report any bugs** with device logs
3. **Prepare for production deployment** using Docker
4. **Set up CI/CD pipeline** for automated testing

---

For more information:
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- Backend API Docs: `http://localhost:3000/api-docs`
