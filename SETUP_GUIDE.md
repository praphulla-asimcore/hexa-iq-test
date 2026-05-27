# Hexa IQ Test Platform - Complete Setup Guide

## 📋 Project Overview

A comprehensive online IQ test platform for candidate recruitment with:
- **Admin Dashboard**: Send invitations and manage candidates
- **Test Interface**: Secure 45-minute timed test with 60 questions
- **Anti-Cheating**: Browser fingerprinting, window switching detection, developer tools detection
- **Results Tracking**: Detailed scoring and performance analytics
- **Email System**: Automated invitation emails with expiring tokens

## 🏗️ Project Structure

```
Hexa IQ Test/
├── backend/                    # Node.js Express API
│   ├── models/                 # MongoDB schemas
│   ├── routes/                 # API endpoints
│   ├── server.js               # Main server file
│   ├── package.json            # Dependencies
│   └── .env.example            # Environment template
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/              # React components
│   │   ├── styles/             # CSS files
│   │   ├── App.js              # Main component
│   │   └── index.js            # Entry point
│   ├── public/                 # Static files
│   └── package.json
├── config/                     # Configuration files
└── Hexa Logo.png               # Brand logo
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (Local or Atlas cloud)
- npm or yarn
- Git

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Update .env with your settings:**
```
MONGODB_URI=mongodb://localhost:27017/hexa-iq-test
JWT_SECRET=your_super_secret_key_change_this
ADMIN_EMAIL=praphulla@hexamatics.com
ADMIN_PASSWORD=Asim@1212
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

5. **Start MongoDB:**
```bash
# If using local MongoDB
mongod
```

6. **Start the backend server:**
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
echo "REACT_APP_API_URL=http://localhost:5000" > .env
```

4. **Copy Hexa Logo:**
```bash
cp ../Hexa\ Logo.png public/hexa-logo.png
```

5. **Start the frontend:**
```bash
npm start
```

The frontend will open at `http://localhost:3000`

## 🔐 Email Configuration

### Gmail SMTP Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password
3. **Update .env:**
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  (paste 16-char password)
   ```

### Alternative: Using SendGrid or Mailgun
Update the nodemailer configuration in `backend/routes/auth.js` and `backend/routes/admin.js`

## 📱 Features & Usage

### Admin Panel
1. Navigate to `http://localhost:3000`
2. Login with credentials:
   - Email: `praphulla@hexamatics.com`
   - Password: `Asim@1212`
3. **Send Invitations:**
   - Enter candidate email, name, and position
   - Email invitation sent automatically
   - Invitation valid for 7 days
   - Link format: `http://localhost:3000/test?token=UUID&email=candidate@example.com`

### Candidate Test Flow
1. Receive email invitation with secure link
2. Click link or enter email on test page
3. Review instructions (45 minutes, 60 questions)
4. Start test - timer begins
5. Answer questions (can review any question)
6. Submit test (cannot restart)
7. View results with score, percentage, and grade

### Anti-Cheating Features
- ✅ **Browser Fingerprinting**: Detects browser/device changes
- ✅ **Window Focus Tracking**: Logs when user leaves tab
- ✅ **Developer Tools Detection**: Prevents F12/DevTools
- ✅ **Session Verification**: One test per invitation
- ✅ **Time Monitoring**: Strict 45-minute timer
- ✅ **Activity Logging**: All suspicious activities recorded

### Test Results
- **Scoring**: 1 mark per correct answer (max 60)
- **Grading Scale**:
  - A: 90-100%
  - B: 80-89%
  - C: 70-79%
  - D: 60-69%
  - F: Below 60%
- **Results Recorded**: Email, answers, time taken, fingerprint, suspicious activities

## 🗄️ Database Schema

### Candidate Collection
```javascript
{
  email: String,
  name: String,
  position: String,
  testStarted: Boolean,
  testCompleted: Boolean,
  testStartTime: Date,
  testEndTime: Date,
  browserFingerprint: String,
  suspiciousActivities: [{
    timestamp: Date,
    activity: String,
    details: String
  }],
  createdAt: Date
}
```

### TestResult Collection
```javascript
{
  candidateId: ObjectId,
  email: String,
  answers: [{
    questionId: Number,
    questionText: String,
    selectedAnswer: String,
    isCorrect: Boolean,
    marks: Number
  }],
  totalMarks: Number,
  percentage: Number,
  timeTaken: Number,
  browserFingerprint: String,
  suspiciousActivities: Array,
  submittedAt: Date
}
```

### Invitation Collection
```javascript
{
  email: String,
  name: String,
  position: String,
  token: String,
  expiryDate: Date,
  used: Boolean,
  usedAt: Date,
  createdAt: Date
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/candidate/verify-invitation` - Verify invitation token
- `POST /api/auth/candidate/start-test` - Start test

### Admin
- `POST /api/admin/send-invitation` - Send candidate invitation
- `GET /api/admin/invitations` - Get all invitations
- `POST /api/admin/resend-invitation/:email` - Resend invitation

### Test
- `GET /api/test/questions` - Get all questions
- `GET /api/test/info` - Get test info (timer, questions count)
- `POST /api/test/validate-answer` - Validate single answer
- `POST /api/test/log-activity` - Log suspicious activity
- `POST /api/test/set-fingerprint` - Set browser fingerprint

### Results
- `POST /api/results/submit` - Submit test answers
- `GET /api/results/my-result` - Get candidate's result

## 🧪 Testing the Application

### Test Admin Flow
1. Start both frontend and backend
2. Go to Admin Login (`http://localhost:3000`)
3. Use demo credentials (see above)
4. Send test invitation to any email
5. Check email for invitation link

### Test Candidate Flow
1. Open invitation link from email
2. Enter email and click "Start Test"
3. Answer 3-5 questions as test
4. Submit test
5. View results

### Monitor Suspicious Activities
1. During test, try:
   - Switch tabs/windows (logs as "Window lost focus")
   - Press F12 (logs as "Developer tools detected")
2. View in TestResult.suspiciousActivities

## 🚨 Troubleshooting

### MongoDB Connection Error
```
Solution: Ensure MongoDB is running
macOS: brew services start mongodb-community
Windows: MongoDB service should be running
```

### Email Not Sending
```
Solutions:
1. Check SMTP credentials in .env
2. Verify Gmail app password (not regular password)
3. Enable "Less secure apps" if not using app password
4. Check firewall/antivirus blocking SMTP
```

### CORS Errors
```
Solution: Update FRONTEND_URL in .env to match your frontend URL
```

### Port Already in Use
```
Backend (5000): lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill
Frontend (3000): lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill
```

## 📊 Monitoring & Analytics

### View Candidate Results
1. Connect to MongoDB
2. Query TestResult collection:
```javascript
db.testresults.find({
  email: "candidate@example.com"
})
```

### Track Suspicious Activities
```javascript
db.testresults.find({
  "suspiciousActivities.0": { $exists: true }
})
```

## 🔒 Security Best Practices

1. **Change default admin credentials** immediately
2. **Use strong JWT_SECRET** in production
3. **Enable HTTPS** in production
4. **Implement rate limiting** on API endpoints
5. **Use HTTPS SMTP** (update nodemailer config)
6. **Validate all inputs** on backend
7. **Use environment variables** for secrets
8. **Implement CSRF protection** in production
9. **Set secure MongoDB authentication**
10. **Regular security audits**

## 🚀 Deployment

### Deploy Backend (Heroku)
```bash
cd backend
heroku login
heroku create your-app-name
git push heroku main
```

### Deploy Frontend (Vercel)
```bash
cd frontend
npm install -g vercel
vercel
```

## 📝 Questions & Support

For questions or issues:
1. Check the Troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Check server logs

## 📄 License

Proprietary - Hexa Matics
Do not distribute without permission

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Status**: Production Ready
