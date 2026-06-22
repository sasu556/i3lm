import React, { useState } from 'react';

export default function Gatekeeper({ onAccessGranted }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // الرمز السري الافتراضي للدخول (يمكنك تغييره هنا لأي شيء تريده)
  const SECRET_CODE = "1234"; 

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (code === SECRET_CODE) {
      setError('');
      onAccessGranted(); // فتح البوابة والدخول للمشروع
    } else {
      setError('الرمز السري غير صحيح، حاول مجدداً!');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1f2937',
      fontFamily: 'sans-serif',
      direction: 'rtl'
    }}>
      <div style={{
        backgroundColor: '#111827',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        border: '1px solid #374151'
      }}>
        <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>بوابة الحماية 🔒</h2>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '25px' }}>
          يرجى إدخال رمز الدخول السري للوصول إلى لوحة التحكم.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <label style={{ color: '#d1d5db', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              رمز الدخول:
            </label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="أدخل الرمز هنا..."
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                backgroundColor: '#374151',
                color: '#ffffff',
                boxSizing: 'border-box',
                fontSize: '16px',
                textAlign: 'center'
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '15px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
          >
            تأكيد الدخول
          </button>
        </form>
      </div>
    </div>
  );
}