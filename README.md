# Hexa IQ Test Platform - Quick Start Guide

## 🎯 What's Included

This is a complete IQ test platform with:
- ✅ Admin dashboard for managing candidates
- ✅ Secure 45-minute timed test with 60 IQ questions
- ✅ Anti-cheating detection (window switching, dev tools, fingerprinting)
- ✅ Email invitation system with 7-day expiry
- ✅ Automated result calculation and grading
- ✅ Detailed activity logging for compliance

## ⚡ Quick Start (3 Minutes)

### 1. Prerequisites
- Node.js installed (`node --version` should show v16+)
- MongoDB running locally (or update connection string)

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
✅ Backend runs on http://localhost:5000

### 3. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm start
```
✅ Frontend opens at http://localhost:3000

### 4. First Login
- **URL**: http://localhost:3000
- **Email**: praphulla@hexamatics.com
- **Password**: Asim@1212

## 📧 Send Test Invitations

1. Click "Send Candidate Invitation"
2. Enter: Email, Name, Position
3. Click "Send Invitation"
4. Candidate receives email with secure link
5. Candidate can start test from link

## 🎓 How to Access Test as Candidate

### Option 1: Via Email Link
- Candidate receives email with link
- Clicks link
- Test starts directly

### Option 2: Manual Entry
- Go to http://localhost:3000/test
- Enter email address
- Click "Start Test"

## 📊 Key Features

### Test Interface
- 60 questions covering logical reasoning, patterns, analogies
- 45-minute timer (auto-submit when time expires)
- Question navigator to jump between questions
- Real-time marking
- No restart allowed after submission

### Anti-Cheating
- Browser fingerprinting (detects device changes)
- Window switching detection (logs when user leaves tab)
- Developer tools detection (prevents F12 access)
- Activity logging (all suspicious behavior recorded)

### Results
- Instant scoring out of 60
- Percentage and grade (A-F)
- Detailed activity report
- Cannot retake test

## 🔐 Admin Credentials
```
Email: praphulla@hexamatics.com
Password: Asim@1212
```

## 📱 Test Candidates (Demo)

Create test invitations for:
- test1@example.com - Position: "Software Engineer"
- test2@example.com - Position: "Data Scientist"
- test3@example.com - Position: "Product Manager"

## 📝 Test Questions
All 60 questions from your Google Form are included with correct answers.

## 🛠️ Customize Questions

To add/modify questions, edit: `backend/routes/test.js`

Look for the `iqTestQuestions` array and modify as needed.

## 📧 Email Setup

To enable email invitations:

1. **Gmail Setup:**
   - Enable 2FA: https://myaccount.google.com/security
   - Generate app password: https://myaccount.google.com/apppasswords
   - Update backend/.env:
     ```
     SMTP_USER=your-email@gmail.com
     SMTP_PASSWORD=xxxx xxxx xxxx xxxx
     ```

2. **Test Email Sending:**
   - Send invitation to any email
   - Check inbox (might be in spam)

## 🐛 Common Issues

**Q: "Cannot GET /test"**
A: Make sure frontend is running and you're at http://localhost:3000

**Q: "Email not sending"**
A: Check Gmail app password setup or check SMTP credentials

**Q: "MongoDB connection error"**
A: Ensure MongoDB is running: `brew services start mongodb-community`

**Q: Questions not loading**
A: Backend might not be running. Check http://localhost:5000/api/health

## 📊 Database

All data stored in MongoDB:
- **Candidates**: Registration and test progress
- **TestResults**: Answers, scores, activity logs
- **Invitations**: Email invites and status

MongoDB automatically stores data in `hexa-iq-test` database.

## 🚀 Next Steps

1. ✅ Get email working properly
2. ✅ Test with real candidates
3. ✅ Review suspicious activity logs
4. ✅ Monitor test results in MongoDB
5. ✅ Deploy to production

## 📞 Support

For detailed setup: Read `SETUP_GUIDE.md`
For API docs: Check backend routes in `backend/routes/`

---

**Ready to go!** Start testing now at http://localhost:3000
