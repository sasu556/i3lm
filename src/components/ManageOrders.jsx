import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { theme, cardStyle } from '../lib/theme';
import { Package, RefreshCw, Loader as Loader2, Trash2, Eye, Download } from 'lucide-react';

// ─── خيارات الحالات مع ألوان للصف ──────────────────────────────────────────
const STATUS_OPTIONS = [
  { label: 'طلب جديد 🆕',      value: 'طلب جديد 🆕',      bg: '#eff6ff', color: '#2563eb', rowBg: '#eff6ff' },
  { label: 'قيد التوصيل 🚚',   value: 'قيد التوصيل 🚚',   bg: '#fef3c7', color: '#92400e', rowBg: '#fffbeb' },
  { label: 'تم التوصيل ✅',    value: 'تم التوصيل ✅',    bg: '#ecfdf5', color: '#065f46', rowBg: '#ecfdf5' },
  { label: 'ملغي ❌',           value: 'ملغي ❌',           bg: '#fef2f2', color: '#991b1b', rowBg: '#fef2f2' },
];

const statusStyle = (status) => {
  const s = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
  return { backgroundColor: s.bg, color: s.color, padding: '4px 10px', borderRadius: theme.radius.pill, fontSize: '12px', fontWeight: 700 };
};

export default function ManageOrders({ storeSlug }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_slug', storeSlug)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('خطأ في جلب الطلبات:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (storeSlug) fetchOrders(); }, [storeSlug]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch {
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    setDeletingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch {
      alert('حدث خطأ أثناء حذف الطلب');
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (iso) => new Date(iso).toLocaleString('ar-DZ', { dateStyle: 'medium', timeStyle: 'short' });

  const getRowBg = (status) => {
    const s = STATUS_OPTIONS.find(o => o.value === status);
    return s ? s.rowBg : '#ffffff';
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: 12, direction: 'rtl' }}>
      <Loader2 size={22} color={theme.colors.textSubtle} style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>جاري تحميل الطلبات...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={{ direction: 'rtl', fontFamily: theme.font.base }}>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, backgroundColor: theme.colors.accentSoft, borderRadius: theme.radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={18} color={theme.colors.accent} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: theme.colors.text }}>الطلبات الواردة</h2>
            <p style={{ margin: 0, fontSize: 12, color: theme.colors.textSubtle }}>{orders.length} طلب إجمالي</p>
          </div>
        </div>
        <button onClick={fetchOrders} style={{ 
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', 
          backgroundColor: theme.colors.bg, border: `1px solid ${theme.colors.border}`, 
          borderRadius: theme.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: theme.colors.text
        }}>
          <RefreshCw size={14} /> تحديث
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{ ...cardStyle, padding: '60px 20px', textAlign: 'center' }}>
          <Package size={40} color={theme.colors.textSubtle} style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: 15, fontWeight: 600 }}>لا توجد طلبات بعد</p>
          <p style={{ margin: '6px 0 0', color: theme.colors.textSubtle, fontSize: 13 }}>ستظهر طلبات الزبائن هنا فور وصولها</p>
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto', 
          borderRadius: theme.radius.md, 
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: '#fff'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            fontSize: '13px',
            minWidth: '1000px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${theme.colors.border}`, fontWeight: 700, color: theme.colors.textMuted }}>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>#</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>العميل</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>الهاتف</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>البريد الإلكتروني</th> {/* ← جديد */}
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>الولاية</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>الإجمالي</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>الملف</th> {/* ← جديد */}
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>التاريخ</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>الحالة</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const rowBg = getRowBg(order.status);
                return (
                  <tr key={order.id} style={{ backgroundColor: rowBg, borderBottom: `1px solid ${theme.colors.borderSoft}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: theme.colors.text }}>{order.customer_name}</td>
                    <td style={{ padding: '10px 14px', direction: 'ltr' }}>{order.customer_phone}</td>
                    <td style={{ padding: '10px 14px', direction: 'ltr', fontSize: '12px' }}>
                      {order.customer_email || '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{order.wilaya || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: theme.colors.accent }}>
                      {Number(order.total_price).toLocaleString('en-US')} د.ج
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {order.file_url ? (
                        <a 
                          href={order.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            color: theme.colors.accent,
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <Download size={14} /> تحميل
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: theme.colors.textSubtle }}>
                      {fmt(order.created_at)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        style={{
                          padding: '4px 8px',
                          borderRadius: theme.radius.pill,
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          opacity: updatingId === order.id ? 0.6 : 1,
                          outline: 'none',
                        }}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(order.id)}
                        disabled={deletingId === order.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          transition: 'all 0.2s',
                          opacity: deletingId === order.id ? 0.5 : 1,
                        }}
                        title="حذف الطلب"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        table tr:hover {
          background-color: #f1f5f9 !important;
        }
        table select:focus {
          border-color: ${theme.colors.accent};
          box-shadow: 0 0 0 2px ${theme.colors.accent}33;
        }
      `}</style>
    </div>
  );
}
