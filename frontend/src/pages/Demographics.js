import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Demographics.css';

const Demographics = () => {
  const [form, setForm] = useState({ name: '', address: '', nationality: '', gender: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('testToken');

  useEffect(() => {
    if (!token) navigate('/test');
    const savedName = localStorage.getItem('candidateName');
    if (savedName) setForm(f => ({ ...f, name: savedName }));
  }, [token, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = async (e) => {
    e.preventDefault();
    const { name, address, nationality, gender } = form;
    if (!name || !address || !nationality || !gender) {
      setError('Please fill in all fields before continuing.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/candidate/save-demographics`,
        { name, address, nationality, gender },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem('candidateName', name);
      navigate('/guidelines');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-container">
      <div className="demo-box">
        <div className="demo-header">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="logo" />
          <h1>Personal Details</h1>
          <p className="demo-subtitle">Please complete your profile before starting the test</p>
        </div>

        <form onSubmit={handleNext} className="demo-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter your current address"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Nationality</label>
            <input
              type="text"
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              placeholder="e.g. Malaysian, Singaporean"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {error && <div className="demo-error">{error}</div>}

          <button type="submit" className="btn-demo-next" disabled={loading}>
            {loading ? 'Saving…' : 'Next →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Demographics;
