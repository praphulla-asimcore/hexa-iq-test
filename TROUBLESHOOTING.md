# Hexa IQ Test - Troubleshooting Guide

## 🔍 Common Issues & Solutions

### Installation Issues

#### Issue: "npm: command not found"
**Solution:**
1. Install Node.js from https://nodejs.org/
2. Verify installation: `node --version`
3. Restart terminal

#### Issue: Module not found errors
**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Port 3000 or 5000 already in use
**macOS/Linux Solution:**
```bash
# Find process using port
lsof -i :3000
lsof -i :5000

# Kill process (replace PID)
kill -9 <PID>
```

**Windows Solution:**
```bash
# Find process
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

### Backend Issues

#### Issue: MongoDB connection error
**Error:** `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution:**
```bash
# Start MongoDB
# macOS (if installed via brew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows (should be running as service)
# Check Services app for MongoDB
```

#### Issue: Backend won't start
**Error:** `Error: listen EADDRINUSE :::5000`

**Solution:**
1. Kill process on port 5000 (see above)
2. Try different port in `.env`:
```
PORT=5001
```

#### Issue: CORS error in frontend
**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution 1 - Check Backend URL:**
```javascript
// frontend/.env
REACT_APP_API_URL=http://localhost:5000
```

**Solution 2 - Check Backend CORS Config:**
```javascript
// backend/server.js
app.use(cors()); // Should be present
```

#### Issue: JWT Token errors
**Error:** `Invalid token` or `No token provided`

**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Login again
3. If persists, check JWT_SECRET in `.env` matches

---

### Frontend Issues

#### Issue: Blank white page / Not loading
**Solution 1:**
```bash
# Clear cache and rebuild
rm -rf node_modules
npm install
npm start
```

**Solution 2:**
- Check browser console (F12)
- Look for specific errors
- Check REACT_APP_API_URL

#### Issue: Styling not showing correctly
**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check CSS file imports

#### Issue: Timer not showing / Questions not loading
**Error:** Questions array empty or undefined

**Solution:**
1. Check backend is running: `http://localhost:5000/api/health`
2. Check network tab in DevTools
3. Verify API response includes questions

---

### Email Issues

#### Issue: Email not sending
**Error:** `Error: getaddrinfo ENOTFOUND smtp.gmail.com`

**Solution 1 - Gmail SMTP:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy 16-character password
4. Update `.env`:
```
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Solution 2 - Check SMTP Settings:**
```javascript
// Test email config
SMTP_HOST=smtp.gmail.com    ✅
SMTP_PORT=587              ✅
SMTP_USER=your-email       ✅
SMTP_PASSWORD=app-password ✅
```

**Solution 3 - Firewall/Antivirus:**
- Disable temporarily to test
- Add exception for Node.js
- Check port 587 is accessible

#### Issue: Email in spam/trash
**Solution:**
1. Check invitation email was sent (check admin dashboard)
2. Tell candidate to check spam folder
3. Use resend invitation button
4. Consider using different email service

---

### Test Execution Issues

#### Issue: Timer not starting
**Solution:**
1. Wait 2-3 seconds after clicking start
2. Refresh page if stuck
3. Check browser console for errors

#### Issue: Questions not visible / blank
**Solution:**
1. Backend API not returning questions
2. Check network tab (F12 → Network)
3. Restart backend: `npm start`
4. Check MongoDB connection

#### Issue: Anti-cheating alerts false positive
**Solution:**
1. Window blur detection is normal when switching tabs
2. Dev tools detection is expected if F12 opened
3. Activities logged but don't fail test
4. Review results after submission

#### Issue: Can't submit test
**Error:** `Error submitting test`

**Solution:**
1. Check all questions answered (not required, but recommended)
2. Check internet connection
3. Verify test token still valid
4. Try refreshing page and submitting again

---

### Result Issues

#### Issue: Score showing 0 after submission
**Solution:**
1. Answers might not be matching exactly
2. Check question IDs in answers array
3. Verify answer strings match exactly (case-sensitive)
4. Check MongoDB for test result

#### Issue: Results not showing after submit
**Solution:**
1. Test result might not be saved
2. Check database: `db.testresults.find().pretty()`
3. Clear localStorage and refresh
4. Check API response from submit endpoint

---

### Database Issues

#### Issue: MongoDB not found / connection failed
**Solution 1 - Local MongoDB:**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongod

# Windows
# Download from https://www.mongodb.com/try/download/community
# Install and start from Services
```

**Solution 2 - Use MongoDB Atlas (Cloud):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and cluster
3. Get connection string
4. Update `.env`:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/hexa-iq-test
```

#### Issue: Database empty after restart
**Solution:**
- MongoDB needs to be running continuously
- Data persists if using proper installation
- Check `/data/db` directory has write permissions

---

### Performance Issues

#### Issue: App loading slowly
**Solution:**
1. Check internet speed
2. Restart MongoDB
3. Close unnecessary applications
4. Check network tab for slow requests

#### Issue: Questions take forever to load
**Solution:**
1. Check MongoDB indexes
2. Increase Node memory: `NODE_OPTIONS=--max-old-space-size=2048 npm start`
3. Check for queries returning too much data

---

### Deployment Issues

#### Issue: Error on Heroku/DigitalOcean
**Solution:**
1. Check all environment variables are set
2. Verify MongoDB connection string correct
3. Check logs: `heroku logs --tail`
4. Verify Node version matches

#### Issue: Frontend build fails
**Solution:**
```bash
# Check for build errors
npm run build

# Look for:
- Missing imports
- Undefined variables
- CSS syntax errors
- Large bundle sizes
```

---

## 📋 Debug Checklist

When experiencing issues, check:

### Backend
- [ ] MongoDB running? (`mongo` or check service)
- [ ] Port 5000 available? (check with `lsof -i :5000`)
- [ ] .env file exists and correct?
- [ ] All dependencies installed? (`npm list`)
- [ ] Check server logs for errors
- [ ] API health: `http://localhost:5000/api/health`

### Frontend
- [ ] Port 3000 available?
- [ ] Backend URL correct in .env?
- [ ] Node modules installed? (`npm list`)
- [ ] Browser console errors? (F12)
- [ ] Network tab shows requests? (F12 → Network)
- [ ] Clear cache: `Ctrl+Shift+R`

### Database
- [ ] MongoDB running? (check service)
- [ ] Correct database: `use hexa-iq-test`
- [ ] Collections exist? (check `show collections`)
- [ ] Documents in collections? (check count)
- [ ] Connection string correct?

### Email
- [ ] SMTP credentials correct?
- [ ] Gmail 2FA enabled?
- [ ] App password generated?
- [ ] Port 587 accessible?
- [ ] Check spam folder for sent emails

---

## 🔗 Useful Commands

### Terminal Commands
```bash
# View running processes on ports
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :27017 # MongoDB

# Kill specific process
kill -9 <PID>

# Check Node version
node --version

# Check npm version
npm --version

# Start MongoDB (macOS)
brew services start mongodb-community

# View MongoDB logs
cat /usr/local/var/log/mongodb/mongo.log
```

### Browser DevTools
```javascript
// Clear all storage
localStorage.clear()
sessionStorage.clear()

// Check stored token
localStorage.getItem('adminToken')
localStorage.getItem('testToken')

// View API calls
// Open DevTools → Network tab
// Filter by XHR/Fetch
```

### MongoDB Commands
```javascript
// Connect to MongoDB
mongo

// Select database
use hexa-iq-test

// Show collections
show collections

// Count documents
db.candidates.countDocuments()
db.testresults.countDocuments()
db.invitations.countDocuments()

// Find latest test result
db.testresults.findOne({}, { sort: { submittedAt: -1 } })

// Find by email
db.testresults.findOne({ email: "candidate@example.com" })

// Find suspicious activities
db.testresults.find({ "suspiciousActivities.0": { $exists: true } })
```

---

## 📞 Getting Help

### Where to Check
1. This troubleshooting guide
2. Browser console (F12)
3. Server logs
4. MongoDB logs
5. Network tab (DevTools → Network)

### Information to Provide
When asking for help, provide:
- Error message (exact text)
- Steps to reproduce
- Browser & OS version
- Screenshots if applicable
- Relevant log excerpts

---

**Last Updated**: May 2026  
**Version**: 1.0  
**Status**: Active
