import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { theme, inputStyle, labelStyle, cardStyle } from '../lib/theme';
import { Plus, Trash2, Edit2, Check, X, Calendar, Percent, DollarSign, Hash, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

// ─── دوال مساعدة ────────────────────────────────────────────────────────────
const formatPrice = (num) => Number(num).toLocaleString('en-US');
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
};
const isExpired = (dateStr) => new Date(dateStr) < new Date();

export default function ManageDiscountCodes({ storeSlug }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    expires_at: '',
    usage_limit: '',
    is_active: true,
  });

  const fetchCodes = async () => {
    if (!storeSlug) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('store_slug', storeSlug)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (err) {
      console.error('خطأ في جلب الأكواد:', err);
      alert('❌ فشل تحميل الأكواد');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [storeSlug]);

  const resetForm = () => {
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      expires_at: '',
      usage_limit: '',
      is_active: true,
    });
    setEditingId(null);
  };

  const openModal = (code = null) => {
    if (code) {
      setEditingId(code.id);
      setForm({
        code: code.code,
        discount_type: code.discount_type,
        discount_value: code.discount_value.toString(),
        expires_at: code.expires_at ? code.expires_at.split('T')[0] : '',
        usage_limit: code.usage_limit?.toString() || '',
        is_active: code.is_active,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (!form.code.trim() || !form.discount_value || !form.expires_at) {
      alert('❌ يرجى تعبئة جميع الحقول المطلوبة (الكود، القيمة، تاريخ الانتهاء).');
      setSaving(false);
      return;
    }

    const codeUpper = form.code.trim().toUpperCase();
    const discountValue = parseFloat(form.discount_value);
    if (discountValue <= 0) {
      alert('❌ قيمة الخصم يجب أن تكون أكبر من صفر.');
      setSaving(false);
      return;
    }
    if (form.discount_type === 'percentage' && discountValue > 100) {
      alert('❌ النسبة المئوية يجب أن تكون 100 أو أقل.');
      setSaving(false);
      return;
    }

    const payload = {
      store_slug: storeSlug,
      code: codeUpper,
      discount_type: form.discount_type,
      discount_value: discountValue,
      expires_at: new Date(form.expires_at).toISOString(),
      is_active: form.is_active,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
    };

    try {
      let error;
      if (editingId) {
        const { error: updateErr } = await supabase
          .from('discount_codes')
          .update(payload)
          .eq('id', editingId);
        error = updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('discount_codes')
          .insert([payload]);
        error = insertErr;
      }

      if (error) throw error;

      alert(editingId ? '✅ تم تحديث الكود بنجاح!' : '✅ تم إضافة الكود بنجاح!');
      setShowModal(false);
      resetForm();
      fetchCodes();
    } catch (err) {
      console.error('خطأ في الحفظ:', err);
      alert(`❌ فشل الحفظ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchCodes();
    } catch (err) {
      alert(`❌ فشل التحديث: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ هل أنت متأكد من حذف هذا الكود نهائياً؟')) return;
    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchCodes();
      alert('✅ تم حذف الكود');
    } catch (err) {
      alert(`❌ فشل الحذف: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontFamily: theme.font.base, direction: 'rtl' }}>
        <Loader2 size={28} color={theme.colors.textSubtle} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px', color: theme.colors.textMuted, fontSize: '14px' }}>جاري تحميل أكواد الخصم...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', direction: 'rtl', fontFamily: theme.font.base, padding: '0 12px' }}>
      {/* رأس الصفحة */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: theme.colors.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.accent }}>
            <Percent size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: theme.colors.text }}>أكواد الخصم</h2>
            <p style={{ margin: 0, fontSize: '13px', color: theme.colors.textSubtle }}>إدارة أكواد الخصم للترويج والمبيعات</p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px',
            backgroundColor: theme.colors.accent,
            color: '#fff',
            border: 'none',
            borderRadius: theme.radius.sm,
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${theme.colors.accent}40`,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Plus size={18} /> إضافة كود جديد
        </button>
      </div>

      {/* قائمة الأكواد */}
      {codes.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px', opacity: 0.4 }}>🏷️</div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: theme.colors.text, margin: 0 }}>لا توجد أكواد خصم بعد</p>
          <p style={{ fontSize: '13px', color: theme.colors.textSubtle, margin: '6px 0 0' }}>أضف أول كود خصم لبدء العروض الترويجية</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {codes.map((code) => {
            const expired = isExpired(code.expires_at);
            return (
              <div
                key={code.id}
                style={{
                  ...cardStyle,
                  padding: '16px 18px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  backgroundColor: code.is_active && !expired ? '#fff' : '#fafafb',
                  border: `1px solid ${code.is_active && !expired ? '#e2e8f0' : '#f1f5f9'}`,
                  opacity: code.is_active && !expired ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '2 1 200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: theme.colors.text }}>
                      {code.code}
                    </span>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: code.is_active && !expired ? '#ecfdf5' : '#fef2f2',
                      color: code.is_active && !expired ? '#059669' : '#dc2626',
                    }}>
                      {code.is_active && !expired ? '🟢 نشط' : expired ? '🔴 منتهي' : '⛔ معطل'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: theme.colors.textSubtle, flexWrap: 'wrap' }}>
                    <span>
                      {code.discount_type === 'percentage' ? `% ${code.discount_value}% خصم` : `💰 ${formatPrice(code.discount_value)} د.ج خصم`}
                    </span>
                    <span>
                      <Calendar size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                      ينتهي: {formatDate(code.expires_at)}
                    </span>
                    {code.usage_limit && (
                      <span>
                        <Hash size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                        استخدم: {code.used_count || 0} / {code.usage_limit}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => toggleActive(code.id, code.is_active)}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: 'transparent',
                      border: '1px solid #e2e8f0',
                      borderRadius: theme.radius.sm,
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: code.is_active ? '#059669' : '#94a3b8',
                    }}
                    title={code.is_active ? 'تعطيل الكود' : 'تفعيل الكود'}
                  >
                    {code.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {code.is_active ? 'نشط' : 'معطل'}
                  </button>
                  <button
                    onClick={() => openModal(code)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #e2e8f0',
                      borderRadius: theme.radius.sm,
                      cursor: 'pointer',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <Edit2 size={15} /> تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(code.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #fecaca',
                      borderRadius: theme.radius.sm,
                      cursor: 'pointer',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <Trash2 size={15} /> حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة الإضافة / التعديل */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              ...cardStyle,
              padding: '28px 24px',
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#fff',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: theme.colors.text }}>
                {editingId ? '✏️ تعديل كود الخصم' : '➕ إضافة كود خصم جديد'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>كود الخصم <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: SALE20"
                  style={inputStyle}
                  required
                  disabled={!!editingId}
                />
                {editingId && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>لا يمكن تعديل الكود بعد الإنشاء.</p>}
              </div>

              <div>
                <label style={labelStyle}>نوع الخصم <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discount_type: 'percentage' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: theme.radius.sm,
                      border: `2px solid ${form.discount_type === 'percentage' ? theme.colors.accent : '#e2e8f0'}`,
                      backgroundColor: form.discount_type === 'percentage' ? theme.colors.accentSoft : '#fff',
                      cursor: 'pointer',
                      fontWeight: form.discount_type === 'percentage' ? 700 : 500,
                      color: form.discount_type === 'percentage' ? theme.colors.accent : '#64748b',
                    }}
                  >
                    <Percent size={16} style={{ display: 'inline', marginLeft: '6px' }} />
                    نسبة مئوية
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discount_type: 'fixed' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: theme.radius.sm,
                      border: `2px solid ${form.discount_type === 'fixed' ? theme.colors.accent : '#e2e8f0'}`,
                      backgroundColor: form.discount_type === 'fixed' ? theme.colors.accentSoft : '#fff',
                      cursor: 'pointer',
                      fontWeight: form.discount_type === 'fixed' ? 700 : 500,
                      color: form.discount_type === 'fixed' ? theme.colors.accent : '#64748b',
                    }}
                  >
                    <DollarSign size={16} style={{ display: 'inline', marginLeft: '6px' }} />
                    مبلغ ثابت
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  {form.discount_type === 'percentage' ? 'النسبة المئوية (%)' : 'المبلغ (د.ج)'}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  placeholder={form.discount_type === 'percentage' ? 'مثال: 20' : 'مثال: 500'}
                  style={inputStyle}
                  required
                  min="0.01"
                  step={form.discount_type === 'percentage' ? '1' : '0.01'}
                />
                {form.discount_type === 'percentage' && (
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>أدخل رقماً بين 1 و 100</p>
                )}
              </div>

              <div>
                <label style={labelStyle}>تاريخ الانتهاء <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  style={inputStyle}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>سيصبح الكود غير صالح بعد هذا التاريخ.</p>
              </div>

              <div>
                <label style={labelStyle}>حد الاستخدام (اختياري)</label>
                <input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                  placeholder="اتركه فارغاً لغير محدود"
                  style={inputStyle}
                  min="1"
                />
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>عدد المرات التي يمكن استخدام هذا الكود فيها.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>الحالة:</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  style={{
                    padding: '6px 14px',
                    borderRadius: theme.radius.pill,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: form.is_active ? '#ecfdf5' : '#fef2f2',
                    color: form.is_active ? '#059669' : '#dc2626',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {form.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {form.is_active ? 'مفعّل' : 'معطّل'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 2,
                    padding: '12px',
                    backgroundColor: saving ? '#94a3b8' : theme.colors.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: theme.radius.sm,
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {saving ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={18} />}
                  {saving ? 'جاري الحفظ...' : editingId ? 'تحديث الكود' : 'إضافة الكود'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: theme.radius.sm,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}