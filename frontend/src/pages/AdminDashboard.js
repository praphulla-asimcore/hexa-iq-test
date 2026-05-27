import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [invitations, setInvitations] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchInvitations();
  }, [token, navigate]);

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/invitations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvitations(response.data);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/send-invitation`,
        { email, name, position },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Invitation sent successfully!');
      setEmail('');
      setName('');
      setPosition('');
      fetchInvitations();
    } catch (err) {
      setError(err.response?.data?.error || 'Error sending invitation');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="logo" />
          <h1>Admin Dashboard - IQ Test Management</h1>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-content">
        <div className="invitation-section">
          <h2>Send Candidate Invitation</h2>
          <form onSubmit={handleSendInvitation} className="invitation-form">
            <div className="form-row">
              <div className="form-group">
                <label>Candidate Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Position Applying For:</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Software Engineer"
                  required
                />
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            <button type="submit" className="btn-send">Send Invitation</button>
          </form>
        </div>

        <div className="invitations-list">
          <h2>Sent Invitations</h2>
          <table className="invitations-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Position</th>
                <th>Status</th>
                <th>Expires In</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.email}</td>
                  <td>{inv.name}</td>
                  <td>{inv.position}</td>
                  <td className={inv.used ? 'used' : 'pending'}>{inv.used ? 'Used' : 'Pending'}</td>
                  <td>{new Date(inv.expiryDate).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-resend" onClick={() => handleResendInvitation(inv.email)}>
                      Resend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  function handleResendInvitation(email) {
    // TODO: Implement resend functionality
    console.log('Resend to:', email);
  }
};

export default AdminDashboard;
