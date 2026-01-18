# 🚀 Application Startup Guide

## Quick Start (After Laptop Restart)

Follow these steps to start your application whenever you restart your laptop.

---

## ✅ Prerequisites Check

Before starting, ensure these services are running:

### 1. **PostgreSQL Database**
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# If not running, start it:
Start-Service -Name postgresql-x64-15  # Adjust version number if different
```

### 2. **Redis Server**
```powershell
# Check if Redis is running
Get-Process redis-server -ErrorAction SilentlyContinue

# If not running, start Redis:
# Open a NEW PowerShell window and run:
cd "C:\Program Files\Redis"  # Adjust path if different
.\redis-server.exe
```

---

## 🎯 Step-by-Step Startup Process

### **Step 1: Open Two PowerShell Windows**

You'll need **two separate PowerShell windows**:
- **Window 1**: For the backend server
- **Window 2**: For testing/commands

---

### **Step 2: Start Backend Server (Window 1)**

```powershell
# Navigate to backend directory
cd "C:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI\backend"

# Start the development server
npm run dev
```

**Expected Output:**
```
[nodemon] starting `ts-node src/index.ts`
[2026-01-18 19:30:49] info: Database connected successfully
[2026-01-18 19:30:49] info: Redis connected successfully
[2026-01-18 19:30:49] info: Server started { "port": "3000", "environment": "development" }
```

⚠️ **Important**: Keep this window open! The server runs here.

---

### **Step 3: Verify Server is Running (Window 2)**

In a **new PowerShell window**, test if the server is responding:

```powershell
# Test health endpoint
curl http://localhost:3000/health
```

**Expected Response:**
```json
{"status":"ok"}
```

---

### **Step 4: Access Swagger API Documentation**

Open your browser and go to:
```
http://localhost:3000/api-docs
```

You can now test all API endpoints directly in Swagger UI!

---

## 📱 Mobile App (Optional)

If you want to test the mobile app:

```powershell
# Navigate to mobile app directory
cd "C:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI\mobile-app"

# Start Expo
npm start
```

Then scan the QR code with Expo Go app on your phone.

---

## 🛠️ Common Commands

### Run Unit Tests
```powershell
cd "C:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI\backend"
npm run test
```

### Check Server Logs
The server logs appear in **Window 1** where you ran `npm run dev`.

### Stop the Server
In **Window 1**, press `Ctrl + C` to stop the server gracefully.

### Kill All Node Processes (if server won't start)
```powershell
taskkill /F /IM node.exe /T
```

---

## 🧪 Quick API Test

Test user registration from PowerShell (Window 2):

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"testuser@example.com","password":"Test123!","firstName":"John","lastName":"Doe","phoneNumber":"1234567890"}'
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "role": "CUSTOMER"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## 🔍 Troubleshooting

### Problem: "Port 3000 is already in use"

**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /F /PID <PID>

# Or kill all Node processes
taskkill /F /IM node.exe /T

# Then restart server
npm run dev
```

### Problem: "Cannot connect to database"

**Solution:**
```powershell
# Check PostgreSQL service
Get-Service -Name postgresql*

# Start if stopped
Start-Service -Name postgresql-x64-15

# Verify connection string in .env file
cat .env | Select-String "DATABASE_URL"
```

### Problem: "Redis connection failed"

**Solution:**
```powershell
# Check if Redis is running
Get-Process redis-server -ErrorAction SilentlyContinue

# If not running, start it in a new window:
cd "C:\Program Files\Redis"
.\redis-server.exe
```

### Problem: "Swagger shows old port 5000"

**Solution:**
```powershell
# Clear browser cache and hard refresh
# Chrome: Ctrl + Shift + R
# Or use Incognito mode: Ctrl + Shift + N
```

---

## 📋 Daily Startup Checklist

- [ ] PostgreSQL service is running
- [ ] Redis server is running
- [ ] Backend server started (`npm run dev` in backend folder)
- [ ] Server logs show "Server started" on port 3000
- [ ] Health endpoint responds: http://localhost:3000/health
- [ ] Swagger UI accessible: http://localhost:3000/api-docs

---

## 🌐 Important URLs

- **API Health Check**: http://localhost:3000/health
- **Swagger API Docs**: http://localhost:3000/api-docs
- **Backend Base URL**: http://localhost:3000

---

## 💡 Pro Tips

1. **Keep Window 1 open** - This is where your server runs and shows logs
2. **Use Window 2 for commands** - Testing, git commands, npm commands
3. **Check server logs** - If APIs fail, check Window 1 for error messages
4. **Use Incognito mode** - For testing Swagger to avoid browser cache issues
5. **Test with PowerShell first** - If Swagger fails, PowerShell commands always work

---

## 📚 Additional Documentation

- [MANUAL_API_TESTING_GUIDE.md](backend/MANUAL_API_TESTING_GUIDE.md) - Complete API testing guide
- [REGISTRATION_FIX.md](backend/REGISTRATION_FIX.md) - Registration troubleshooting
- [README.md](backend/README.md) - Full backend documentation

---

## 🎉 You're Ready!

Your development environment is now fully configured. Every time you restart your laptop:

1. Start PostgreSQL (usually auto-starts)
2. Start Redis server
3. Run `npm run dev` in backend folder
4. Access Swagger UI at http://localhost:3000/api-docs

Happy coding! 🚀
