import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CreateStore({ onStoreCreated, userId, userEmail }) {
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // إرسال البيانات مع حل مشكلة القيود الإلزامية للإيميل والباسورد القديمين
      const { error } = await supabase.from('stores').insert([
        {
          store_name: storeName,
          store_slug: storeSlug.toLowerCase().trim(),
          admin_name: adminName,
          user_id: userId,
          admin_email: userEmail,
          admin_password: 'via_supabase_auth', // 👈 القيمة السحرية لتخطي قيد الباسورد الإجباري القديم بنجاح
        },
      ]);

      if (error) throw error;

      setMessage('🎉 تم إنشاء متجرك بنجاح واستهلاك باقتك الحالية!');
      setStoreName('');
      setStoreSlug('');
      setAdminName('');

      if (onStoreCreated) onStoreCreated();
    } catch (err) {
      setMessage(`❌ فشل الإنشاء: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '20px auto',
        padding: '25px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        direction: 'rtl',
      }}
    >
      <h2
        style={{ color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}
      >
        🏗️ خطوتك الأولى: أنشئ متجرك الفريد
      </h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
      >
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            اسم المتجر:
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            placeholder="مثال: متجر الأناقة"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            رابط المتجر (Slug بالإنجليزية):
          </label>
          <input
            type="text"
            value={storeSlug}
            onChange={(e) => setStoreSlug(e.target.value)}
            required
            placeholder="مثال: elanaka-store"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            اسم المدير المسؤول:
          </label>
          <input
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            required
            placeholder="مثال: أحمد محمد"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: '#4F46E5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? 'جاري إنشاء المتجر...' : 'إطلاق المتجر الآن 🚀'}
        </button>
      </form>
      {message && (
        <p
          style={{
            marginTop: '15px',
            color: message.includes('❌') ? '#ef4444' : '#059669',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
