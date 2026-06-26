import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { theme, cardStyle } from '../lib/theme';
import { 
  Package, RefreshCw, Loader as Loader2, Trash2, Download, 
  ChevronDown, ChevronUp, User, Phone, Mail, MapPin, 
  LayoutGrid, List, Clock, Eye, EyeOff 
} from 'lucide-react';

// ─── إعدادات الحالات ──────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { 
    label: 'طلب جديد 🆕',      value: 'طلب جديد 🆕', 
    bg: '#eff6ff', color: '#2563eb', 
    cardBg: '#eff6ff', borderColor: '#93c5fd',
    tableBg: '#eff6ff' 
  },
  { 
    label: 'قيد التوصيل 🚚',   value: 'قيد التوصيل 🚚', 
    bg: '#fef3c7', color: '#92400e', 
    cardBg: '#fffbeb', borderColor: '#fcd34d',
    tableBg: '#fffbeb' 
  },
  { 
    label: 'تم التوصيل ✅',    value: 'تم التوصيل ✅', 
    bg: '#ecfdf5', color: '#065f46', 
    cardBg: '#ecfdf5', borderColor: '#6ee7b7',
    tableBg: '#ecfdf5' 
  },
  { 
    label: 'ملغي ❌',           value: 'ملغي ❌', 
    bg: '#fef2f2', color: '#991b1b', 
    cardBg: '#fef2f2', borderColor: '#fca5a5',
    tableBg: '#fef2f2' 
  },
];

const getStatusStyle = (status) => {
  const s = STATUS_OPTIONS.find(o => o.value === status);
  return s || STATUS_OPTIONS[0];
};

const fmt = (iso) => new Date(iso).toLocaleString('ar-DZ', { dateStyle: 'medium', timeStyle: 'short' });

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────────
export default function ManageOrders({ storeSlug }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // ─── جلب الطلبات ──────────────────────────────────────────────────────
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

  // ─── تحديث الحالة ──────────────────────────────────────────────────────
  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('فشل تحديث الحالة:', err);
      alert('حدث خطأ أثناء تحديث حالة الطلب');
      fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── حذف الطلب ──────────────────────────────────────────────────────────
  const handleDelete = async (orderId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    setDeletingId(orderId);
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error('فشل الحذف:', err);
      alert('حدث خطأ أثناء حذف الطلب');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── توسيع/طي المنتجات ────────────────────────────────────────────────
  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // ─── عرض تفاصيل المنتجات ──────────────────────────────────────────────
  const renderItems = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <span style={{ color: '#94a3b8', fontSize: 13 }}>لا توجد منتجات</span>;
    }
    return items.map((item, idx) => {
      const isDigital = item.is_digital === true;
      return (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
          <span>
            {item.title}
            {item.color && (
              <span style={{
                fontSize: 12,
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                padding: '1px 8px',
                borderRadius: '9999px',
                marginRight: 6,
              }}>
                {item.color}
              </span>
            )}
            <span style={{ color: '#94a3b8', fontSize: 12, marginRight: 4 }}>× {item.quantity}</span>
            {isDigital && (
              <span style={{
                fontSize: 10,
                backgroundColor: '#dbeafe',
                color: '#2563eb',
                padding: '1px 6px',
                borderRadius: '9999px',
                marginRight: 4,
              }}>
                📱 رقمي
              </span>
            )}
          </span>
          <span style={{ fontWeight: 600, color: theme.colors.accent }}>
            {Number(item.price).toLocaleString('en-US')} د.ج
          </span>
        </div>
      );
    });
  };

  // ─── التحقق من وجود منتج رقمي في الطلب ──────────────────────────────
  const hasDigitalProduct = (items) => {
    if (!items || !Array.isArray(items)) return false;
    return items.some(item => item.is_digital === true);
  };

  // ─── أثناء التحميل ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: 12, direction: 'rtl' }}>
      <Loader2 size={22} color={theme.colors.textSubtle} style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>جاري تحميل الطلبات...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  // ─── العرض الرئيسي ────────────────────────────────────────────────────
  return (
    <div style={{ direction: 'rtl', fontFamily: theme.font.base }}>

      {/* ─── الرأس مع أزرار التحكم ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, backgroundColor: theme.colors.accentSoft, borderRadius: theme.radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={18} color={theme.colors.accent} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: theme.colors.text }}>الطلبات الواردة</h2>
            <p style={{ margin: 0, fontSize: 12, color: theme.colors.textSubtle }}>{orders.length} طلب إجمالي</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* ─── زر تبديل العرض ────────────────────────────────────────── */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: theme.colors.bg,
            borderRadius: theme.radius.pill,
            border: `1px solid ${theme.colors.border}`,
            overflow: 'hidden',
            padding: '3px',
          }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '6px 14px',
                borderRadius: theme.radius.pill,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'cards' ? theme.colors.accent : 'transparent',
                color: viewMode === 'cards' ? '#fff' : theme.colors.textMuted,
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
              }}
            >
              <LayoutGrid size={16} /> بطاقات
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 14px',
                borderRadius: theme.radius.pill,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'table' ? theme.colors.accent : 'transparent',
                color: viewMode === 'table' ? '#fff' : theme.colors.textMuted,
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
              }}
            >
              <List size={16} /> جدول
            </button>
          </div>
          <button onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: theme.colors.bg, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: theme.colors.text }}>
            <RefreshCw size={14} /> تحديث
          </button>
        </div>
      </div>

      {/* ─── حالة عدم وجود طلبات ────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <div style={{ ...cardStyle, padding: '60px 20px', textAlign: 'center' }}>
          <Package size={40} color={theme.colors.textSubtle} style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: 15, fontWeight: 600 }}>لا توجد طلبات بعد</p>
          <p style={{ margin: '6px 0 0', color: theme.colors.textSubtle, fontSize: 13 }}>ستظهر طلبات الزبائن هنا فور وصولها</p>
        </div>
      ) : viewMode === 'table' ? (
        // ─── وضع الجدول (Google Sheets) ──────────────────────────────────
        <div style={{ overflowX: 'auto', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`, backgroundColor: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1000px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: `2px solid ${theme.colors.border}` }}>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>العميل</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>الهاتف</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>البريد الإلكتروني</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>الولاية</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>المنتجات</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>الألوان</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>الإجمالي</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>التاريخ</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>الحالة</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const statusStyle = getStatusStyle(order.status);
                const items = order.items || [];
                const hasDigital = hasDigitalProduct(items);
                const rowBg = statusStyle.tableBg || '#ffffff';

                return (
                  <tr key={order.id} style={{ backgroundColor: rowBg, borderBottom: `1px solid ${theme.colors.borderSoft}` }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: theme.colors.text }}>
                      {order.customer_name}
                      <br />
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>#{String(order.id).slice(0, 8)}</span>
                    </td>
                    <td style={{ padding: '8px 12px', direction: 'ltr' }}>{order.customer_phone}</td>
                    <td style={{ padding: '8px 12px', direction: 'ltr', fontSize: '12px' }}>
                      {order.customer_email ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={14} color="#64748b" />
                          {order.customer_email}
                          {hasDigital && (
                            <span style={{
                              fontSize: '10px',
                              backgroundColor: '#dbeafe',
                              color: '#2563eb',
                              padding: '1px 6px',
                              borderRadius: '9999px',
                              marginRight: 4,
                            }}>
                              📱 رقمي
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>{order.wilaya || '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                      {items.length > 0 ? (
                        <button
                          onClick={() => toggleExpand(order.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.accent, fontSize: '12px', fontWeight: 600 }}
                        >
                          {expandedOrderId === order.id ? 'إخفاء' : `عرض (${items.length})`}
                        </button>
                      ) : '—'}
                      {expandedOrderId === order.id && (
                        <div style={{ marginTop: 6, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6 }}>
                          {renderItems(items)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                      {order.color ? (
                        <span style={{ backgroundColor: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>
                          {order.color}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: theme.colors.accent }}>
                      {Number(order.total_price).toLocaleString('en-US')} د.ج
                      {order.discount_code && <span style={{ display: 'block', fontSize: '10px', color: '#059669' }}>خصم: {order.discount_code}</span>}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.colors.textSubtle }}>{fmt(order.created_at)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <select
                        value={order.status || 'طلب جديد 🆕'}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        style={{
                          padding: '4px 8px',
                          borderRadius: theme.radius.pill,
                          border: `1px solid ${theme.colors.border}`,
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
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(order.id)}
                        disabled={deletingId === order.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px 6px', borderRadius: '4px', opacity: deletingId === order.id ? 0.5 : 1 }}
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
      ) : (
        // ─── وضع البطاقات (مع خلفية ملونة حسب الحالة) ──────────────────
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const items = order.items || [];
            const statusStyle = getStatusStyle(order.status);
            const hasDigital = hasDigitalProduct(items);

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: statusStyle.cardBg,
                  border: `2px solid ${statusStyle.borderColor}`,
                  borderRadius: theme.radius.md,
                  padding: '16px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* ─── رأس البطاقة ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: theme.colors.text }}>
                      #{String(order.id).slice(0, 8)}
                    </span>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      <Clock size={12} style={{ display: 'inline', marginLeft: 4 }} />
                      {fmt(order.created_at)}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 14px',
                    borderRadius: theme.radius.pill,
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                    border: `1px solid ${statusStyle.borderColor}`,
                  }}>
                    {order.status || 'طلب جديد 🆕'}
                  </span>
                </div>

                {/* ─── معلومات العميل ────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={14} color="#64748b" />
                    <span>{order.customer_name || 'غير معروف'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={14} color="#64748b" />
                    <span>{order.customer_phone || '—'}</span>
                  </div>
                  {order.customer_email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, gridColumn: 'span 2' }}>
                      <Mail size={14} color="#64748b" />
                      <span style={{ fontSize: 12 }}>
                        {order.customer_email}
                        {hasDigital && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#dbeafe',
                            color: '#2563eb',
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            marginRight: 4,
                          }}>
                            📱 رقمي
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, gridColumn: 'span 2' }}>
                    <MapPin size={14} color="#64748b" />
                    <span>{order.wilaya || '—'}</span>
                  </div>
                </div>

                {/* ─── الألوان ──────────────────────────────────────────── */}
                {order.color && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>🎨 الألوان:</span>
                    <span style={{
                      backgroundColor: '#ede9fe',
                      color: '#7c3aed',
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {order.color}
                    </span>
                  </div>
                )}

                {/* ─── السعر والملف ────────────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${statusStyle.borderColor}`, paddingTop: 10 }}>
                  <div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: theme.colors.accent }}>
                      {Number(order.total_price).toLocaleString('en-US')} د.ج
                    </span>
                    {order.discount_code && (
                      <span style={{ display: 'block', fontSize: 11, color: '#059669' }}>
                        خصم: {order.discount_code}
                      </span>
                    )}
                  </div>
                  {order.file_url && (
                    <a href={order.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: theme.colors.accent, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      <Download size={14} /> ملف
                    </a>
                  )}
                </div>

                {/* ─── المنتجات (زر التوسيع) ───────────────────────────── */}
                {items.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleExpand(order.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: theme.colors.accent,
                        fontSize: 13,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 0,
                      }}
                    >
                      {isExpanded ? 'إخفاء المنتجات' : `عرض المنتجات (${items.length})`}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, backgroundColor: 'rgba(255,255,255,0.6)', padding: 10, borderRadius: 8 }}>
                        {renderItems(items)}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── أزرار الإجراءات ──────────────────────────────────── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', borderTop: `1px solid ${statusStyle.borderColor}`, paddingTop: 10 }}>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <select
                      value={order.status || 'طلب جديد 🆕'}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: theme.radius.pill,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: '#fff',
                        fontSize: 12,
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
                  </div>
                  <button
                    onClick={() => handleDelete(order.id)}
                    disabled={deletingId === order.id}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: theme.radius.sm,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      opacity: deletingId === order.id ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={14} /> حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .card-enter { animation: fadeIn 240ms ease both; }
      `}</style>
    </div>
  );
}