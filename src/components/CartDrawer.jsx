import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ALGERIA_WILAYAS } from '../lib/constants';

// ─── دوال مساعدة ────────────────────────────────────────────────────────────
const alpha = (hex, a) => {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  } catch {
    return `rgba(79,70,229,${a})`;
  }
};

const formatPrice = (num) => Number(num).toLocaleString('en-US');

const qtyBtnStyle = (color) => ({
  width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${color}`,
  backgroundColor: 'transparent', color: color, fontSize: 16, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, lineHeight: 1, flexShrink: 0,
});

const IconCart = ({ size = 22, color = '#0f172a' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export default function CartDrawer({ open, onClose, cart, setCart, primaryColor, storeSlug, store, tiktokPixelId }) {
  const [step, setStep] = useState('cart');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    wilaya: '',
    deliveryType: 'home',
    file: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // ─── كود الخصم ──────────────────────────────────────────────────────────
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const hasDigital = cart.some((item) => item.is_digital === true);

  const deliveryPrices = store?.delivery_prices || {};
  const wilayaPrices = deliveryPrices[form.wilaya] || {};
  const deliveryPrice = form.wilaya ? wilayaPrices[form.deliveryType] || 0 : 0;
  const totalWithDelivery = total + deliveryPrice;

  const getDiscountedTotal = () => {
    if (!appliedDiscount) {
      console.log('لا يوجد خصم مطبق، الإجمالي:', totalWithDelivery);
      return totalWithDelivery;
    }
    const discount = appliedDiscount.discount_type === 'percentage'
      ? (totalWithDelivery * appliedDiscount.discount_value / 100)
      : appliedDiscount.discount_value;
    const final = Math.max(0, totalWithDelivery - discount);
    console.log('الخصم المطبق:', discount, 'الإجمالي بعد الخصم:', final);
    return final;
  };

  // ─── تطبيق الخصم ─────────────────────────────────────────────────────────
  const applyDiscount = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!discountCode.trim()) {
      setDiscountError('❌ الرجاء إدخال كود الخصم');
      return;
    }
    setDiscountError('');

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.trim().toUpperCase())
        .eq('store_slug', storeSlug)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        setDiscountError('❌ كود غير صحيح أو منتهي الصلاحية');
        setAppliedDiscount(null);
        return;
      }

      if (data.usage_limit && data.used_count >= data.usage_limit) {
        setDiscountError('❌ تم استنفاذ عدد مرات استخدام هذا الكود');
        setAppliedDiscount(null);
        return;
      }

      console.log('✅ تم العثور على الكود:', data);
      setAppliedDiscount(data);
      setDiscountError('✅ كود صحيح!');

      // تحديث عدد الاستخدامات (اختياري)
      await supabase
        .from('discount_codes')
        .update({ used_count: data.used_count + 1 })
        .eq('id', data.id);

    } catch (err) {
      console.error('خطأ في تطبيق الخصم:', err);
      setDiscountError('❌ حدث خطأ، حاول مجدداً');
      setAppliedDiscount(null);
    }
  };

  const updQty = (id, d) => setCart((p) => p.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i)));
  const removeItem = (id) => setCart((p) => p.filter((i) => i.id !== id));

  // ─── إرسال الطلب ──────────────────────────────────────────────────────────
  const handleOrder = async (e) => {
    e.preventDefault();
    setUploadError(null);

    if (!form.name || !form.phone || !form.address || !form.wilaya) {
      alert('يرجى تعبئة جميع الحقول المطلوبة (الاسم، الهاتف، الولاية، العنوان التفصيلي).');
      return;
    }
    if (hasDigital && !form.email) {
      alert('يرجى إدخال البريد الإلكتروني لتلقي المنتج الرقمي.');
      return;
    }

    setSubmitting(true);
    setFileUploading(true);

    try {
      let fileUrl = null;
      if (form.file) {
        const maxSize = 10 * 1024 * 1024;
        if (form.file.size > maxSize) throw new Error('حجم الملف يتجاوز الحد الأقصى (10 ميجابايت).');
        const fileExt = form.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('order-files').upload(`${storeSlug}/${fileName}`, form.file);
        if (uploadErr) {
          if (uploadErr.message.includes('Bucket not found')) throw new Error('مساحة التخزين غير جاهزة. يرجى التواصل مع إدارة المتجر.');
          throw new Error(`فشل رفع الملف: ${uploadErr.message}`);
        }
        const { data: { publicUrl } } = supabase.storage.from('order-files').getPublicUrl(`${storeSlug}/${fileName}`);
        fileUrl = publicUrl;
      }

      const finalTotal = getDiscountedTotal();

      const orderItems = cart.map((i) => ({
        title: i.title,
        quantity: i.qty,
        price: i.price,
        color: i.color || null
      }));

      const allColors = cart.map(i => i.color).filter(Boolean).join(', ') || null;

      const { data: insertedOrder, error } = await supabase.from('orders').insert([{
        store_slug: storeSlug,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        customer_email: form.email || null,
        file_url: fileUrl,
        items: orderItems,
        total_price: finalTotal,
        original_total: totalWithDelivery,
        discount_code: appliedDiscount?.code || null,
        discount_amount: appliedDiscount ? (totalWithDelivery - finalTotal) : 0,
        delivery_price: deliveryPrice,
        wilaya: form.wilaya,
        color: allColors,
        status: 'طلب جديد 🆕',
      }]).select().single();

      if (error) {
        console.error('Order insert error:', error);
        throw error;
      }

      console.log('✅ الطلب مُدرج:', insertedOrder);

      if (tiktokPixelId && window.ttq) {
        window.ttq.track('Purchase', {
          value: finalTotal,
          currency: 'DZD',
          contents: cart.map(item => ({
            content_id: item.id,
            content_name: item.title + (item.color ? ` (${item.color})` : ''),
            price: item.price,
            quantity: item.qty
          })),
        });
      }

      try {
        const proxyUrl = '/.netlify/functions/order-proxy';
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeSlug: storeSlug,
            customer_name: form.name,
            customer_phone: form.phone,
            customer_email: form.email || null,
            wilaya: form.wilaya,
            customer_address: form.address,
            items: orderItems,
            total_price: finalTotal,
          }),
        });
        const result = await response.json();
        if (!response.ok) console.warn('⚠️ فشل إرسال الإشعار:', result.error);
        else console.log('✅ تم إرسال الطلب عبر الوكيل');
      } catch (notifError) {
        console.warn('⚠️ خطأ في إرسال الإشعار:', notifError.message);
      }

      setStep('success');
      setCart([]);
      setForm({ name: '', phone: '', address: '', email: '', wilaya: '', deliveryType: 'home', file: null });
      setAppliedDiscount(null);
      setDiscountCode('');
    } catch (err) {
      setUploadError(err.message);
      alert(`حدث خطأ أثناء إرسال الطلب: ${err.message}`);
    } finally {
      setSubmitting(false);
      setFileUploading(false);
    }
  };

  if (!open) return null;

  const renderCartItems = () => {
    return cart.map((item) => (
      <div key={item.id + (item.color || '')} className="cart-item" style={{
        display: 'flex', gap: 12, padding: 12,
        backgroundColor: '#f8fafc', borderRadius: 12,
        border: '1px solid #f1f5f9'
      }}>
        {item.image_url && (
          <img
            className="cart-item-image"
            src={item.image_url}
            alt={item.title}
            style={{
              width: 58, height: 58, objectFit: 'cover',
              borderRadius: 10, flexShrink: 0,
              border: '1px solid #e2e8f0'
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="cart-item-title" style={{
            margin: '0 0 4px', fontSize: 13, fontWeight: 700,
            color: '#0f172a', lineHeight: 1.35
          }}>
            {item.title}
            {item.color && (
              <span style={{
                fontSize: '12px', color: '#64748b',
                fontWeight: 400, marginRight: '6px'
              }}>
                ({item.color})
              </span>
            )}
          </p>
          {item.is_digital && (
            <p className="cart-item-digital" style={{
              margin: '0 0 4px', fontSize: 11,
              color: '#2563eb', fontWeight: 600
            }}>
              📱 رقمي
            </p>
          )}
          <p className="cart-item-price" style={{
            margin: '0 0 8px', fontSize: 13,
            fontWeight: 800, color: primaryColor
          }}>
            {formatPrice(item.price * item.qty)} د.ج
          </p>
          <div className="cart-item-actions" style={{
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <button
              className="qty-btn qty-minus"
              onClick={() => updQty(item.id, -1)}
              style={qtyBtnStyle(primaryColor)}
            >
              −
            </button>
            <span className="qty-value" style={{
              fontSize: 14, fontWeight: 800,
              minWidth: 20, textAlign: 'center'
            }}>
              {item.qty}
            </span>
            <button
              className="qty-btn qty-plus"
              onClick={() => updQty(item.id, 1)}
              style={qtyBtnStyle(primaryColor)}
            >
              +
            </button>
            <button
              className="cart-item-remove"
              onClick={() => removeItem(item.id)}
              style={{
                marginRight: 'auto', background: 'none',
                border: 'none', color: '#ef4444',
                fontSize: 12, cursor: 'pointer', fontWeight: 600
              }}
            >
              × حذف
            </button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <div
        className="cart-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(4px)', zIndex: 1000
        }}
      />
      <div
        className="cart-drawer"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: '92vw', maxWidth: 400, backgroundColor: '#fff',
          zIndex: 1001, display: 'flex', flexDirection: 'column',
          boxShadow: '4px 0 40px rgba(0,0,0,0.12)',
          direction: 'rtl',
          animation: 'sfSlideIn 0.27s cubic-bezier(0.32,0.72,0,1)'
        }}
      >
        <div
          className="cart-header"
          style={{
            padding: '16px 18px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: 12,
            backgroundColor: '#fafbfc'
          }}
        >
          <div
            className="cart-icon"
            style={{
              width: 38, height: 38, borderRadius: 10,
              backgroundColor: alpha(primaryColor, 0.1),
              display: 'flex', alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconCart size={20} color={primaryColor} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 className="cart-title" style={{
              margin: 0, fontSize: 15, fontWeight: 800,
              color: '#0f172a'
            }}>
              {step === 'cart' ? 'سلة التسوق' :
                step === 'checkout' ? 'بيانات الطلب' :
                  'تم استلام طلبك ✓'}
            </h3>
            {step === 'cart' && count > 0 && (
              <p className="cart-count" style={{
                margin: 0, fontSize: 11, color: '#94a3b8'
              }}>
                {count} منتج في السلة
              </p>
            )}
          </div>
          <button
            className="cart-close-btn"
            onClick={onClose}
            style={{
              width: 32, height: 32, border: 'none',
              background: 'none', cursor: 'pointer',
              fontSize: 22, color: '#94a3b8',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 8
            }}
          >
            ×
          </button>
        </div>

        <div
          className="cart-body"
          style={{ flex: 1, overflowY: 'auto', padding: 18 }}
        >
          {step === 'cart' && (cart.length === 0 ? (
            <div
              className="cart-empty"
              style={{
                textAlign: 'center', padding: '56px 20px',
                color: '#94a3b8'
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 10, opacity: 0.4 }}>
                🛒
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                السلة فارغة
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                ابدأ بإضافة منتجات
              </p>
            </div>
          ) : (
            <div
              className="cart-items"
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {renderCartItems()}
            </div>
          ))}

          {step === 'checkout' && (
            <form
              id="sf-order-form"
              className="checkout-form"
              onSubmit={handleOrder}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {[
                { label: 'الاسم الكامل', key: 'name', type: 'text', ph: 'أحمد محمد' },
                { label: 'رقم الهاتف', key: 'phone', type: 'tel', ph: '0555 123 456' }
              ].map((f) => (
                <div key={f.key} className={`form-group form-group-${f.key}`}>
                  <label style={{
                    display: 'block', fontSize: 13, fontWeight: 700,
                    color: '#374151', marginBottom: 6
                  }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    required
                    placeholder={f.ph}
                    value={form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    style={{
                      width: '100%', padding: '11px 13px', borderRadius: 10,
                      border: '1.5px solid #e5e7eb', fontSize: 14,
                      outline: 'none', boxSizing: 'border-box',
                      direction: 'rtl', transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = primaryColor)}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                </div>
              ))}

              <div className="form-group form-group-wilaya">
                <label style={{
                  display: 'block', fontSize: 13, fontWeight: 700,
                  color: '#374151', marginBottom: 6
                }}>
                  الولاية
                </label>
                <select
                  value={form.wilaya}
                  onChange={(e) => setForm((p) => ({ ...p, wilaya: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '11px 13px', borderRadius: 10,
                    border: '1.5px solid #e5e7eb', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                    direction: 'rtl', backgroundColor: '#fff'
                  }}
                >
                  <option value="">-- اختر الولاية --</option>
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group-delivery-type">
                <label style={{
                  display: 'block', fontSize: 13, fontWeight: 700,
                  color: '#374151', marginBottom: 6
                }}>
                  نوع العنوان
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className={`delivery-type-btn ${form.deliveryType === 'home' ? 'active' : ''}`}
                    onClick={() => setForm((p) => ({ ...p, deliveryType: 'home' }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8,
                      border: `1.5px solid ${form.deliveryType === 'home' ? primaryColor : '#e5e7eb'}`,
                      backgroundColor: form.deliveryType === 'home' ? alpha(primaryColor, 0.1) : '#f8fafc',
                      fontWeight: 600, cursor: 'pointer', fontSize: 13
                    }}
                  >
                    🏠 منزل
                  </button>
                  <button
                    type="button"
                    className={`delivery-type-btn ${form.deliveryType === 'office' ? 'active' : ''}`}
                    onClick={() => setForm((p) => ({ ...p, deliveryType: 'office' }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8,
                      border: `1.5px solid ${form.deliveryType === 'office' ? primaryColor : '#e5e7eb'}`,
                      backgroundColor: form.deliveryType === 'office' ? alpha(primaryColor, 0.1) : '#f8fafc',
                      fontWeight: 600, cursor: 'pointer', fontSize: 13
                    }}
                  >
                    🏢 مكتب
                  </button>
                </div>
              </div>

              <div className="form-group form-group-address">
                <label style={{
                  display: 'block', fontSize: 13, fontWeight: 700,
                  color: '#374151', marginBottom: 6
                }}>
                  العنوان التفصيلي
                </label>
                <input
                  type="text"
                  required
                  placeholder="الشارع، الحي، البلدية..."
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  style={{
                    width: '100%', padding: '11px 13px', borderRadius: 10,
                    border: '1.5px solid #e5e7eb', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                    direction: 'rtl', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = primaryColor)}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {hasDigital && (
                <>
                  <div className="form-group form-group-email">
                    <label style={{
                      display: 'block', fontSize: 13, fontWeight: 700,
                      color: '#374151', marginBottom: 6
                    }}>
                      البريد الإلكتروني (لتسليم المنتج الرقمي)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="example@mail.com"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      style={{
                        width: '100%', padding: '11px 13px', borderRadius: 10,
                        border: '1.5px solid #e5e7eb', fontSize: 14,
                        outline: 'none', boxSizing: 'border-box',
                        direction: 'ltr', transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = primaryColor)}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                    />
                  </div>
                  <div className="form-group form-group-file">
                    <label style={{
                      display: 'block', fontSize: 13, fontWeight: 700,
                      color: '#374151', marginBottom: 6
                    }}>
                      رفع ملف (PDF أو صورة)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={(e) => setForm((p) => ({ ...p, file: e.target.files[0] }))}
                      style={{
                        width: '100%', padding: '8px', borderRadius: 10,
                        border: '1.5px solid #e5e7eb', fontSize: 14,
                        background: '#fafbfc'
                      }}
                    />
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      الحد الأقصى 10 ميجابايت.
                    </p>
                    {uploadError && (
                      <p className="upload-error" style={{
                        fontSize: 12, color: '#ef4444', marginTop: 4
                      }}>
                        {uploadError}
                      </p>
                    )}
                  </div>
                  <div className="digital-payment-info" style={{
                    backgroundColor: '#eef2ff', borderRadius: 10,
                    padding: 14, border: '1px solid #c7d2fe'
                  }}>
                    <p style={{
                      margin: 0, fontSize: 13, fontWeight: 700,
                      color: '#4338ca'
                    }}>
                      معلومات الدفع للمنتجات الرقمية:
                    </p>
                    {store?.ccp_account && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#1e293b' }}>
                        CCP: {store.ccp_account}
                      </p>
                    )}
                    {store?.mobile_payment && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#1e293b' }}>
                        رقم الهاتف: {store.mobile_payment}
                      </p>
                    )}
                    {!store?.ccp_account && !store?.mobile_payment && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                        لم يحدد المتجر معلومات الدفع بعد.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ─── حقل كود الخصم ─── */}
              <div className="discount-section" style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="أدخل كود الخصم"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #e2e8f0', fontSize: 13
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applyDiscount(e);
                    }}
                    style={{
                      padding: '8px 16px', backgroundColor: primaryColor,
                      color: '#fff', border: 'none', borderRadius: 8,
                      cursor: 'pointer', fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    تطبيق
                  </button>
                  {appliedDiscount && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAppliedDiscount(null);
                        setDiscountCode('');
                        setDiscountError('');
                      }}
                      style={{
                        padding: '8px 12px', backgroundColor: '#f1f5f9',
                        border: 'none', borderRadius: 8, cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      إلغاء
                    </button>
                  )}
                </div>
                {discountError && (
                  <p style={{
                    fontSize: 12, marginTop: 6,
                    color: discountError.includes('✅') ? '#059669' : '#ef4444'
                  }}>
                    {discountError}
                  </p>
                )}
                {appliedDiscount && (
                  <p style={{
                    fontSize: 13, marginTop: 6, color: '#059669',
                    fontWeight: 700
                  }}>
                    خصم {appliedDiscount.discount_type === 'percentage'
                      ? `${appliedDiscount.discount_value}%`
                      : `${formatPrice(appliedDiscount.discount_value)} د.ج`}
                  </p>
                )}
              </div>

              {/* ─── ملخص الطلب ─── */}
              <div className="cart-summary" style={{
                backgroundColor: '#f8fafc', borderRadius: 12,
                padding: 15, border: '1px solid #f1f5f9', marginTop: 8
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, color: '#64748b', marginBottom: 8
                }}>
                  <span>عدد المنتجات</span>
                  <span style={{ fontWeight: 700 }}>{count}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, color: '#64748b', marginBottom: 4
                }}>
                  <span>مجموع المشتريات</span>
                  <span style={{ fontWeight: 700 }}>{formatPrice(total)} د.ج</span>
                </div>
                {form.wilaya && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 13, color: '#64748b', marginBottom: 4
                  }}>
                    <span>سعر التوصيل ({form.deliveryType === 'home' ? 'منزل' : 'مكتب'})</span>
                    <span style={{ fontWeight: 700 }}>
                      {deliveryPrice > 0 ? formatPrice(deliveryPrice) : 'مجاني'} د.ج
                    </span>
                  </div>
                )}
                {appliedDiscount && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 13, color: '#059669', marginBottom: 4
                  }}>
                    <span>الخصم</span>
                    <span style={{ fontWeight: 700 }}>
                      - {formatPrice(totalWithDelivery - getDiscountedTotal())} د.ج
                    </span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 17, fontWeight: 800, color: '#0f172a',
                  paddingTop: 8, borderTop: '1px solid #e5e7eb'
                }}>
                  <span>الإجمالي الكلي</span>
                  <span style={{ color: primaryColor }}>
                    {formatPrice(getDiscountedTotal())} د.ج
                  </span>
                </div>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="cart-success" style={{
              textAlign: 'center', padding: '52px 20px'
            }}>
              <div style={{
                width: 76, height: 76, backgroundColor: '#ecfdf5',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 18px',
                fontSize: 34
              }}>
                🎉
              </div>
              <h3 style={{
                margin: '0 0 8px', color: '#059669',
                fontSize: 20, fontWeight: 800
              }}>
                تم استلام طلبك!
              </h3>
              <p style={{
                margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.7
              }}>
                سيتواصل معك فريقنا قريباً لتأكيد التوصيل.
              </p>
              <button
                className="back-to-shop-btn"
                onClick={() => { setStep('cart'); onClose(); }}
                style={{
                  marginTop: 22, padding: '12px 32px',
                  backgroundColor: primaryColor, color: '#fff',
                  border: 'none', borderRadius: 12, fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 4px 14px ${alpha(primaryColor, 0.32)}`
                }}
              >
                العودة للتسوق ←
              </button>
            </div>
          )}
        </div>

        {step !== 'success' && (
          <div className="cart-footer" style={{
            padding: '14px 18px', borderTop: '1px solid #f1f5f9',
            backgroundColor: '#fafbfc'
          }}>
            {step === 'cart' ? (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 12
                }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>الإجمالي</span>
                  <span style={{ fontSize: 19, fontWeight: 800, color: '#0f172a' }}>
                    {formatPrice(total)} <span style={{ fontSize: 12, color: '#94a3b8' }}>د.ج</span>
                  </span>
                </div>
                <button
                  className="checkout-btn"
                  disabled={cart.length === 0}
                  onClick={() => setStep('checkout')}
                  style={{
                    width: '100%', padding: 13,
                    backgroundColor: cart.length ? primaryColor : '#e2e8f0',
                    color: cart.length ? '#fff' : '#94a3b8',
                    border: 'none', borderRadius: 12, fontSize: 14,
                    fontWeight: 700, cursor: cart.length ? 'pointer' : 'not-allowed',
                    boxShadow: cart.length ? `0 4px 16px ${alpha(primaryColor, 0.3)}` : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  متابعة الطلب ←
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="back-btn"
                  onClick={() => setStep('cart')}
                  style={{
                    flex: 1, padding: 12, backgroundColor: '#f1f5f9',
                    border: 'none', borderRadius: 12, fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', color: '#374151'
                  }}
                >
                  → رجوع
                </button>
                <button
                  type="submit"
                  form="sf-order-form"
                  className="submit-order-btn"
                  disabled={submitting || fileUploading}
                  style={{
                    flex: 2, padding: 12,
                    backgroundColor: submitting || fileUploading ? '#94a3b8' : primaryColor,
                    color: '#fff', border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 700,
                    cursor: submitting || fileUploading ? 'not-allowed' : 'pointer',
                    boxShadow: submitting || fileUploading ? 'none' : `0 4px 14px ${alpha(primaryColor, 0.3)}`
                  }}
                >
                  {fileUploading ? 'جاري رفع الملف...' :
                    submitting ? 'جاري الإرسال...' :
                      'تأكيد الطلب ✓'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes sfSlideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>
    </>
  );
}