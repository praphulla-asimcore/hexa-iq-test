# Hexa IQ Test - Anti-Cheating & Security Features

## 🔒 Overview

The Hexa IQ Test platform incorporates multiple layers of security and anti-cheating mechanisms to ensure test integrity and candidate authenticity.

## 🛡️ Security Features

### 1. Browser Fingerprinting

**What It Does:**
- Creates a unique fingerprint of the candidate's browser/device
- Detects changes in device, browser, or system configuration
- Alerts if fingerprint doesn't match between invitation and test

**Technical Details:**
- Captures: User Agent, Language, Timezone, Screen Resolution, Timestamp
- Stored for comparison throughout test session
- Changes logged as suspicious activity

**Implementation:**
```javascript
const fingerprint = {
  userAgent: navigator.userAgent,
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  screenResolution: `${window.screen.width}x${window.screen.height}`,
  timestamp: new Date().getTime()
};
```

### 2. Window Switching Detection

**What It Does:**
- Monitors when candidate switches away from test tab/window
- Logs every instance with timestamp
- Counts total switches for review

**How It Works:**
- Uses `window.addEventListener('blur')` to detect when user leaves tab
- Uses `window.addEventListener('focus')` to detect when user returns
- Records: Timestamp, Event Type, Tab Name

**Review After Test:**
- Admin can see suspicious activities in results
- Pattern Analysis: Multiple switches may indicate collaboration or cheating

### 3. Developer Tools Detection

**What It Does:**
- Detects if candidate opens browser Developer Tools
- Blocks keyboard shortcuts (F12, Ctrl+Shift+I, etc.)
- Logs attempt for review

**Prevented Actions:**
- F12 Key
- Ctrl+Shift+I (Inspect Element)
- Ctrl+Shift+J (Console)
- Ctrl+Shift+C (Selector)

**Limitation:**
- Can be bypassed by advanced users
- Works as deterrent, not absolute prevention

### 4. Session Management

**What It Does:**
- One-time use invitations
- Tokens expire after 7 days
- Test cannot be restarted after submission
- Session locked to single candidate

**Features:**
- Invalid if: Already used, Expired, Wrong email
- After submission: Test cannot be redone
- Results locked for audit trail

### 5. Time Monitoring

**What It Does:**
- Strict 45-minute timer
- Auto-submit if time expires
- Cannot extend or pause timer
- Records exact time spent

**Timer Behavior:**
- Counts down in real-time
- Visible to candidate
- Auto-submits at 0:00
- Recorded to nearest second

## 🚨 Suspicious Activities Tracked

| Activity | Trigger | Severity | Action |
|----------|---------|----------|--------|
| Window Lost Focus | Tab switch/Alt+Tab | Medium | Logged |
| Developer Tools Detected | F12 or keyboard shortcut | Medium | Logged, Blocked |
| Browser Fingerprint Change | Device/browser change | High | Logged, Flagged |
| Multiple Quick Switches | 3+ switches in 1 minute | Medium | Logged |
| Session Timeout | No activity for 15+ min | Low | Auto-submit |
| Rapid Answers | <5s per question average | Medium | Flagged |

## 📊 Activity Report

After test submission, admin can review:
- Total window switches
- Developer tools attempts
- Fingerprint changes
- Time patterns
- Answer speed analysis

**Sample Report:**
```
Candidate: john.doe@example.com
Test Duration: 42 minutes 15 seconds
Score: 45/60 (75%)

Suspicious Activities:
1. Window lost focus (14:23)
2. Window lost focus (22:45)
3. Developer tools detected (28:10)
4. Window lost focus (35:02)

Risk Level: MEDIUM
Note: 3 window switches and 1 dev tools attempt detected
Recommendation: Verify with candidate
```

## 🔐 Data Security

### Encryption
- JWT tokens for session management
- HTTPS recommended for production
- Password hashing with bcryptjs

### Data Storage
- MongoDB encrypted at rest (recommended)
- Separate collections for candidates, results, invitations
- Audit trail for all activities

### Access Control
- Role-based access (Admin/Candidate)
- Token expiration after 1 hour
- IP tracking (optional enhancement)

## ⚙️ Configuration

### Email Verification
```
Only candidates with valid invitation can start test
Email must match invitation token
Verification required before test access
```

### Fingerprint Validation
```
Initial fingerprint captured at test start
Compared against invitation fingerprint
Mismatch triggers warning
```

### Activity Logging
```
All activities logged in real-time
Sent to server after test submission
Cannot be deleted by candidate
```

## 📋 Admin Monitoring Dashboard

Future Enhancement: Add admin view for:
- Real-time test monitoring
- Live activity feeds
- Candidate progress tracking
- Instant alerts for suspicious activity

## 🔄 Fraud Detection Algorithm

**Current (Phase 1):**
- Activity counting
- Pattern detection
- Manual review

**Planned (Phase 2):**
- Machine learning scoring
- Behavioral analysis
- Peer comparison
- Statistical anomalies

## ⚠️ Limitations & Workarounds

### Current Limitations:
1. **Dev Tools Detection**: Can be bypassed on some browsers
   - Workaround: Monitor activity logs after test
2. **Window Switching**: Only detects tab blur, not screen recording
   - Workaround: Consider video monitoring for sensitive roles
3. **Fingerprinting**: Basic implementation
   - Workaround: Manual verification for high-stakes positions

### Recommendations:
- Use in combination with scheduled interviews
- Consider video proctoring for senior positions
- Manual review of high-risk candidates
- Don't rely solely on anti-cheating for hiring decisions

## 🔍 How to Review Suspicious Activities

### Access Activities:
1. **Via Admin Dashboard:**
   - View all candidate results
   - Click on result to see details
   - Review "Activities Detected" section

2. **Via Database Query:**
```javascript
db.testresults.find({
  email: "candidate@example.com",
  "suspiciousActivities.0": { $exists: true }
}).pretty()
```

3. **Export for Analysis:**
```javascript
db.testresults.find(
  { "suspiciousActivities.0": { $exists: true } },
  { email: 1, suspiciousActivities: 1, totalMarks: 1 }
).toArray()
```

## 🚀 Future Enhancements

### Phase 2:
- [ ] Video proctoring integration
- [ ] AI-powered fraud detection
- [ ] Keystroke dynamics analysis
- [ ] Facial recognition
- [ ] Sound analysis for collaboration detection

### Phase 3:
- [ ] Blockchain verification
- [ ] Biometric authentication
- [ ] Advanced ML models
- [ ] Geographic tracking

## 📞 Support

For questions about anti-cheating:
1. Review this document
2. Check browser console for errors
3. Check server logs for activity records

---

**Last Updated**: May 2026  
**Version**: 1.0  
**Status**: Active
