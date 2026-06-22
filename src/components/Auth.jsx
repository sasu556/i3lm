import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // تسجيل الدخول فقط
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setMessage(`❌ فشل الدخول: تأكد من الإيميل وكلمة المرور الصحيحة.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '50px' }}>🔐</span>
        </div>
        
        <h2 style={{ textAlign: 'center', color: '#4f46e5', marginBottom: '10px' }}>بوابة مدراء المتاجر</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '0', marginBottom: '25px' }}>
          مرحباً بك! يرجى إدخال بيانات الحساب الممنوحة لك من إدارة المنصة لتفعيل متجرك.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>البريد الإلكتروني:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your-email@example.com" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>كلمة المرور المعطاة لك:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', fontSize: '15px' }}>
            {loading ? 'جاري التحقق من الحساب...' : 'تسجيل الدخول الحركي 🔑'}
          </button>
        </form>

        {message && <p style={{ textAlign: 'center', marginTop: '15px', color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>{message}</p>}
        
        <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #f3f4f6', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
          للحصول على متجر خاص بك، يرجى التواصل مع الإدارة للاشتراك والدفع 💳
        </div>
      </div>
    </div>
  );
}