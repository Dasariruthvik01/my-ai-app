import React, { useState } from 'react';

function App() {
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setStatus('Please enter a join code.');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/v1/auth/claim-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'Client',
          join_code: joinCode.trim(),
        }),
      });

      if (response.ok) {
        setStatus('Successfully joined the gym as a Client!');
      } else {
        const data = await response.json().catch(() => ({}));
        setStatus(`Error: ${data.message || 'Failed to join. Please check your code.'}`);
      }
    } catch (err) {
      setStatus('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Gym Onboarding</h1>
      <p>Welcome! Please enter your gym join code to get started as a Client.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="joinCode" style={{ display: 'block', marginBottom: '0.5rem' }}>Join Code</label>
          <input
            id="joinCode"
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter code here"
            disabled={loading}
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '0.75rem', 
            fontSize: '1rem', 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Join Gym'}
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          {status}
        </div>
      )}
    </div>
  );
}

export default App;
