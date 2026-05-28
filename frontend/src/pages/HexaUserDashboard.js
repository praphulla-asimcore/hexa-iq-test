import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const API = process.env.REACT_APP_API_URL;

const HexaUserDashboard = () => {
  const [activeTab, setActiveTab] = useState('results');
  const [results, setResults] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [search, setSearch] = useState('');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('hexaUserToken');
  const userName = localStorage.getItem('hexaUserName') || 'User';

  const fetchAllRef = useRef(null);
  fetchAllRef.current = async () => {
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [resultsRes, invitationsRes] = await Promise.all([
        axios.get(`${API}/api/admin/results`, { headers: h }),
        axios.get(`${API}/api/admin/invitations`, { headers: h })
      ]);
      setResults(resultsRes.data);
      setInvitations(invitationsRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('hexaUserToken');
        localStorage.removeItem('hexaUserName');
        navigate('/hexauser/login');
      }
    }
  };

  const fetchAll = () => fetchAllRef.current();

  useEffect(() => {
    if (!token) { navigate('/hexauser/login'); return; }
    fetchAll();
  }, []); // eslint-disable-line

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setInviteError(''); setInviteMsg(''); setLoading(true);
    try {
      await axios.post(`${API}/api/admin/send-invitation`, { email, name, position }, { headers: { Authorization: `Bearer ${token}` } });
      setInviteMsg('Invitation sent successfully!');
      setEmail(''); setName(''); setPosition('');
      fetchAll();
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Error sending invitation');
    } finally { setLoading(false); }
  };

  const handleResend = async (invEmail) => {
    try {
      await axios.post(`${API}/api/admin/resend-invitation/${encodeURIComponent(invEmail)}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Invitation resent!');
    } catch (err) {
      alert(err.response?.data?.error || 'Error resending');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hexaUserToken');
    localStorage.removeItem('hexaUserName');
    navigate('/hexauser/login');
  };

  const toggleRow = (id) => setExpandedRow(prev => prev === id ? null : id);

  const filteredResults = results.filter(r =>
    r.candidate?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.candidate?.position?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (seconds) => {
    if (!seconds) return '-';
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const getScoreColor = (pct) => {
    if (pct >= 75) return '#28a745';
    if (pct >= 50) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="logo" />
          <div>
            <h1 style={{ margin: 0 }}>Hexamatics Dashboard</h1>
            <p style={{ margin: 0, color: '#667eea', fontSize: '0.9rem', fontWeight: 600 }}>Welcome, {userName}</p>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-content">
        <div className="tab-nav">
          <button className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            All Results {results.length > 0 && <span className="badge">{results.length}</span>}
          </button>
          <button className={`tab-btn ${activeTab === 'invite' ? 'active' : ''}`} onClick={() => setActiveTab('invite')}>Invite Candidates</button>
        </div>

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div className="tab-content">
            <div className="card">
              <div className="results-header">
                <h3>All Submitted Tests</h3>
                <input className="search-input" placeholder="Search by name, email, position..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {filteredResults.length === 0 ? (
                <p className="empty-msg">{results.length === 0 ? 'No tests submitted yet.' : 'No results match your search.'}</p>
              ) : (
                <div className="table-wrap">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Position</th>
                        <th>Score</th>
                        <th>%</th>
                        <th>Time</th>
                        <th>Submitted</th>
                        <th>Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((r, i) => {
                        const flagCount = Array.isArray(r.suspiciousActivities) ? r.suspiciousActivities.length : 0;
                        const answers = Array.isArray(r.answers) ? r.answers : [];
                        const isExpanded = expandedRow === r.id;
                        return (
                          <React.Fragment key={r.id}>
                            <tr className={isExpanded ? 'row-expanded' : ''}>
                              <td>{i + 1}</td>
                              <td>
                                <button className="btn-name-expand" onClick={() => toggleRow(r.id)} title="Click to view answers">
                                  {r.candidate?.name}
                                  <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
                                </button>
                              </td>
                              <td>{r.email}</td>
                              <td>{r.candidate?.position}</td>
                              <td><strong>{r.totalMarks}/40</strong></td>
                              <td><span className="score-badge" style={{ background: getScoreColor(r.percentage) }}>{Math.round(r.percentage || 0)}%</span></td>
                              <td>{formatTime(r.timeTaken)}</td>
                              <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.submittedAt).toLocaleString()}</td>
                              <td>{flagCount > 0 ? <span className="flag-badge">⚠️ {flagCount}</span> : <span style={{ color: '#28a745' }}>✓ Clean</span>}</td>
                            </tr>
                            {isExpanded && (
                              <tr className="answers-row">
                                <td colSpan={9}>
                                  <div className="answers-panel">
                                    <div className="answers-panel-header">
                                      <strong>Answer Breakdown — {r.candidate?.name}</strong>
                                      <span className="answers-summary">{answers.filter(a => a.isCorrect).length} correct / {answers.length} answered</span>
                                    </div>
                                    {answers.length === 0 ? (
                                      <p style={{ color: '#999', padding: '12px 0' }}>No answer data available.</p>
                                    ) : (
                                      <table className="answers-table">
                                        <thead>
                                          <tr>
                                            <th>Q#</th>
                                            <th>Question</th>
                                            <th>Candidate's Answer</th>
                                            <th>Correct Answer</th>
                                            <th>Result</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {answers.map((a, idx) => (
                                            <tr key={idx} className={a.isCorrect ? 'answer-correct' : 'answer-wrong'}>
                                              <td>{a.questionId}</td>
                                              <td className="question-text-cell">{a.questionText || `Question ${a.questionId}`}</td>
                                              <td>{a.selectedAnswer || <em style={{ color: '#999' }}>Skipped</em>}</td>
                                              <td>{a.correctAnswer}</td>
                                              <td>{a.isCorrect ? <span className="result-correct">✓ Correct</span> : <span className="result-wrong">✗ Wrong</span>}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                    {flagCount > 0 && (
                                      <div className="flags-section">
                                        <strong>⚠️ Suspicious Activity Log ({flagCount})</strong>
                                        <ul className="flag-list">
                                          {r.suspiciousActivities.map((act, idx) => (
                                            <li key={idx}><span className="flag-time">{new Date(act.timestamp).toLocaleTimeString()}</span> — {act.activity}: {act.details}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INVITE CANDIDATES TAB */}
        {activeTab === 'invite' && (
          <div className="tab-content">
            <div className="card">
              <h3>Send Candidate Invitation</h3>
              <form onSubmit={handleSendInvitation} className="invitation-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Candidate Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="candidate@example.com" required />
                  </div>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Position Applying For</label>
                  <input type="text" value={position} onChange={e => setPosition(e.target.value)} placeholder="Software Engineer" required />
                </div>
                {inviteError && <div className="error-message">{inviteError}</div>}
                {inviteMsg && <div className="success-message">{inviteMsg}</div>}
                <button type="submit" className="btn-send" disabled={loading}>{loading ? 'Sending...' : 'Send Invitation'}</button>
              </form>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
              <h3>Sent Invitations</h3>
              {invitations.length === 0 ? (
                <p className="empty-msg">No invitations sent yet.</p>
              ) : (
                <div className="table-wrap">
                  <table className="results-table">
                    <thead><tr><th>Email</th><th>Name</th><th>Position</th><th>Status</th><th>Expires</th><th>Action</th></tr></thead>
                    <tbody>
                      {invitations.map((inv) => (
                        <tr key={inv.id}>
                          <td>{inv.email}</td>
                          <td>{inv.name}</td>
                          <td>{inv.position}</td>
                          <td><span className={inv.used ? 'badge-used' : 'badge-pending'}>{inv.used ? 'Used' : 'Pending'}</span></td>
                          <td>{new Date(inv.expiryDate).toLocaleDateString()}</td>
                          <td><button className="btn-resend" onClick={() => handleResend(inv.email)}>Resend</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HexaUserDashboard;
