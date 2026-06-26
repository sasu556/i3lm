import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // دالة لجلب المتاجر من قاعدة البيانات
  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('خطأ في جلب المتاجر:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // جلب البيانات عند فتح الصفحة
  useEffect(() => {
    fetchStores();
  }, []);

  if (loading) {
    return <p style={{ textAlign: 'center', color: '#6b7280' }}>جاري تحميل قائمة المتاجر...</p>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', direction: 'rtl', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#1f2937' }}>🛒 المتاجر المنشأة حالياً ({stores.length})</h3>
        <button onClick={fetchStores} style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>تحديث القائمة 🔄</button>
      </div>

      {stores.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>لا توجد متاجر منشأة بعد.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', color: '#374151' }}>اسم المتجر</th>
                <th style={{ padding: '12px', color: '#374151' }}>الرابط (Slug)</th>
                <th style={{ padding: '12px', color: '#374151' }}>المدير</th>
                <th style={{ padding: '12px', color: '#374151' }}>البريد الإلكتروني</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#4f46e5' }}>{store.store_name}</td>
                  <td style={{ padding: '12px', color: '#059669', direction: 'ltr', textAlign: 'right' }}>{store.store_slug}.netlify.app</td>
                  <td style={{ padding: '12px', color: '#4b5563' }}>{store.admin_name}</td>
                  <td style={{ padding: '12px', color: '#4b5563' }}>{store.admin_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}