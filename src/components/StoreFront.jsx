import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ALGERIA_WILAYAS } from '../lib/constants';

// ─── المساعدات ──────────────────────────────────────────────────────────────
const loadGoogleFont = (fontFamily) => {
  if (!fontFamily || fontFamily === 'system-ui') return;
  const name = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
  const id = `gf-${name.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

const slugFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] || null;
};

const safeColor = (c) => (!c ? '#4f46e5' : c.replace(/[{};]/g, '').trim());
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

// ─── أيقونات SVG ────────────────────────────────────────────────────────────
const IconCart = ({ size = 22, color = '#0f172a' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IconSearch = ({ size = 16, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconFacebook = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconWhatsApp = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.53 3.657 1.455 5.16L2.5 21.5l4.34-0.955A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 11c.5-1 1.5-2 3-2s2.5 1 3 2" strokeLinecap="round" />
    <circle cx="9" cy="13" r="1" fill="currentColor" />
    <circle cx="15" cy="13" r="1" fill="currentColor" />
  </svg>
);

// ─── Hero Slider (معدل بالكلاسات) ──────────────────────────────────────────
function HeroSlider({ store, primaryColor }) {
  const videoUrl = store?.banner_video_url?.trim();
  const raw = store?.banner_urls;
  const banners = Array.isArray(raw) && raw.length > 0
    ? raw.filter((u) => u?.trim())
    : store?.banner_url?.trim()
    ? [store.banner_url.trim()]
    : [];

  const [cur, setCur] = useState(0);
  const timer = useRef(null);
  const total = banners.length;

  const go = useCallback((n) => setCur(((n % total) + total) % total), [total]);

  useEffect(() => {
    if (total < 2) return;
    timer.current = setInterval(() => setCur((c) => (c + 1) % total), 4500);
    return () => clearInterval(timer.current);
  }, [total]);

  const DEFAULT_BG = 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1400&auto=format&fit=crop&q=80';
  const slides = total > 0 ? banners : [DEFAULT_BG];

  const borderStyle = {
    border: `4px solid ${primaryColor}`,
    borderRadius: '16px',
    boxShadow: `0 8px 30px ${alpha(primaryColor, 0.3)}`,
  };

  if (videoUrl) {
    let finalUrl = videoUrl;
    let isYoutube = false;
    let isVimeo = false;

    if (videoUrl.includes('youtube.com/watch?v=') || videoUrl.includes('youtu.be/')) {
      isYoutube = true;
      let videoId = '';
      if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
      } else if (videoUrl.includes('youtube.com/watch?v=')) {
        videoId = videoUrl.split('v=')[1].split('&')[0];
      }
      if (videoId) {
        finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&mute=1&controls=0&rel=0`;
      }
    } else if (videoUrl.includes('youtube.com/embed/')) {
      isYoutube = true;
      const videoId = videoUrl.split('/embed/')[1].split('?')[0];
      if (videoId && !videoUrl.includes('autoplay')) {
        const separator = videoUrl.includes('?') ? '&' : '?';
        finalUrl = `${videoUrl}${separator}autoplay=1&loop=1&playlist=${videoId}&mute=1&controls=0&rel=0`;
      }
    } else if (videoUrl.includes('vimeo.com/')) {
      isVimeo = true;
      const videoId = videoUrl.split('/').pop();
      if (videoId) {
        finalUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1`;
      }
    }

    return (
      <div className="store-hero hero-slider" style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(220px, 40vw, 380px)',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        flexShrink: 0,
        ...borderStyle,
      }}>
        {isYoutube || isVimeo ? (
          <iframe
            className="hero-video"
            src={finalUrl}
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        ) : (
          <video
            className="hero-video"
            src={finalUrl}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
        <div className="hero-content" style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,36px)', display: 'flex', alignItems: 'flex-end', gap: 14, zIndex: 5 }}>
          {store?.logo_url?.trim() && (
            <img className="hero-logo" src={store.logo_url.trim()} alt="logo" style={{ width: 'clamp(48px,8vw,72px)', height: 'clamp(48px,8vw,72px)', objectFit: 'cover', borderRadius: 14, border: '2.5px solid rgba(255,255,255,0.85)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <div>
            <h1 className="hero-title" style={{ margin: 0, fontSize: 'clamp(18px,4vw,30px)', fontWeight: 800, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.5)', lineHeight: 1.25 }}>{store?.store_name}</h1>
            <p className="hero-subtitle" style={{ margin: '4px 0 0', fontSize: 'clamp(11px,2vw,14px)', color: 'rgba(255,255,255,0.75)' }}>مرحباً بك في متجرنا الإلكتروني</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-hero hero-slider" style={{
      position: 'relative',
      width: '100%',
      height: 'clamp(220px, 40vw, 380px)',
      overflow: 'hidden',
      backgroundColor: '#0f172a',
      flexShrink: 0,
      ...borderStyle,
    }}>
      {slides.map((src, i) => (
        <div key={i} className={`hero-slide ${i === cur ? 'active' : ''}`} style={{ position: 'absolute', inset: 0, opacity: i === cur ? 1 : 0, transition: 'opacity 0.75s ease', pointerEvents: i === cur ? 'auto' : 'none' }}>
          <img className="hero-image" src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} onError={(e) => { e.target.src = DEFAULT_BG; }} />
          <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
        </div>
      ))}
      <div className="hero-content" style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,36px)', display: 'flex', alignItems: 'flex-end', gap: 14, zIndex: 5 }}>
        {store?.logo_url?.trim() && (
          <img className="hero-logo" src={store.logo_url.trim()} alt="logo" style={{ width: 'clamp(48px,8vw,72px)', height: 'clamp(48px,8vw,72px)', objectFit: 'cover', borderRadius: 14, border: '2.5px solid rgba(255,255,255,0.85)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        )}
        <div>
          <h1 className="hero-title" style={{ margin: 0, fontSize: 'clamp(18px,4vw,30px)', fontWeight: 800, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.5)', lineHeight: 1.25 }}>{store?.store_name}</h1>
          <p className="hero-subtitle" style={{ margin: '4px 0 0', fontSize: 'clamp(11px,2vw,14px)', color: 'rgba(255,255,255,0.75)' }}>مرحباً بك في متجرنا الإلكتروني</p>
        </div>
      </div>
      {total > 1 && (
        <>
          <HeroArrow dir="right" className="hero-arrow hero-arrow-right" onClick={() => go(cur - 1)} />
          <HeroArrow dir="left" className="hero-arrow hero-arrow-left" onClick={() => go(cur + 1)} />
          <div className="hero-dots" style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 5 }}>
            {slides.map((_, i) => (
              <button key={i} className={`hero-dot ${i === cur ? 'active' : ''}`} onClick={() => setCur(i)} style={{ width: i === cur ? 22 : 7, height: 7, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 9999, transition: 'all 0.3s', backgroundColor: i === cur ? '#fff' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HeroArrow({ dir, onClick, className }) {
  return (
    <button className={className} onClick={onClick} style={{ position: 'absolute', top: '50%', [dir]: 12, transform: 'translateY(-50%)', width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6, transition: 'background 0.2s' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.28)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
    >
      {dir === 'right' ? '‹' : '›'}
    </button>
  );
}

// ─── Product Card (تم إصلاح استقبال onAddToCart وإضافة كلاسات) ──────────────────
function ProductCard({ product, primaryColor, templateSettings, onAddToCart }) {
  const [hov, setHov] = useState(false);
  const [qty, setQty] = useState(1);
  const inStock = product.in_stock !== false;

  const handleAdd = () => {
    if (qty > 0 && onAddToCart) {
      onAddToCart(product, qty);
      setQty(1);
    }
  };

  const cardStyle = templateSettings?.layout?.cardStyle || 'rounded';
  let cardBorderRadius = '14px';
  let cardBoxShadow = '0 2px 6px rgba(0,0,0,0.05)';
  let cardHoverTransform = 'translateY(-4px)';

  if (cardStyle === 'rounded-shadow') {
    cardBorderRadius = '16px';
    cardBoxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    cardHoverTransform = 'translateY(-6px) scale(1.01)';
  } else if (cardStyle === 'square') {
    cardBorderRadius = '0px';
    cardBoxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    cardHoverTransform = 'translateY(-2px)';
  } else if (cardStyle === 'none') {
    cardBorderRadius = '0px';
    cardBoxShadow = 'none';
    cardHoverTransform = 'none';
  }

  return (
    <div
      className="product-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: '#fff',
        borderRadius: cardBorderRadius,
        overflow: 'hidden',
        border: '1px solid #e8edf3',
        boxShadow: hov ? '0 12px 32px rgba(0,0,0,0.10)' : cardBoxShadow,
        transform: hov ? cardHoverTransform : 'translateY(0)',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
      }}
    >
      <div className="product-image" style={{ position: 'relative', width: '100%', paddingTop: '75%', backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
        {product.image_url ? (
          <img
            className="product-img"
            src={product.image_url}
            alt={product.title}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              display: 'block',
              transition: 'transform 0.35s ease',
              transform: hov ? 'scale(1.05)' : 'scale(1)',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="product-img-placeholder" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#cbd5e1' }}>📦</div>
        )}
        <span className="product-stock-badge" style={{ position: 'absolute', top: 8, left: 8, padding: '3px 9px', borderRadius: 9999, fontSize: 10, fontWeight: 700, backgroundColor: inStock ? '#ecfdf5' : '#fef2f2', color: inStock ? '#059669' : '#dc2626', border: `1px solid ${inStock ? '#bbf7d0' : '#fecaca'}`, lineHeight: 1.4 }}>{inStock ? '● متوفر' : '● نفذ'}</span>
        {product.category && <span className="product-category-badge" style={{ position: 'absolute', top: 8, right: 8, padding: '3px 9px', borderRadius: 9999, fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.92)', color: '#374151', border: '1px solid rgba(0,0,0,0.08)', lineHeight: 1.4 }}>{product.category}</span>}
        {product.is_digital && <span className="product-digital-badge" style={{ position: 'absolute', bottom: 8, right: 8, padding: '3px 9px', borderRadius: 9999, fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(59,130,246,0.9)', color: '#fff', lineHeight: 1.4 }}>📱 رقمي</span>}
      </div>
      <div className="product-body" style={{ padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 className="product-title" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.9em' }}>{product.title}</h3>
        {product.description && <p className="product-description" style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>}
        <div className="product-footer" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          <div className="product-price" style={{ lineHeight: 1 }}><span style={{ fontSize: 15, fontWeight: 800, color: primaryColor }}>{formatPrice(product.price)}</span><span style={{ fontSize: 10, color: '#94a3b8', marginRight: 2 }}>د.ج</span></div>
          <div className="product-actions" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="qty-btn qty-minus" disabled={!inStock} onClick={() => setQty((q) => Math.max(1, q - 1))} style={qtyBtnStyle(primaryColor)}>−</button>
            <input className="qty-input" type="number" min="1" max={product.stock_quantity || 999} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '36px', textAlign: 'center', fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 0', background: '#f8fafc', color: '#0f172a' }} />
            <button className="qty-btn qty-plus" disabled={!inStock} onClick={() => setQty((q) => q + 1)} style={qtyBtnStyle(primaryColor)}>+</button>
            <button className="add-to-cart-btn" disabled={!inStock} onClick={handleAdd} style={{ flexShrink: 0, padding: '6px 11px', backgroundColor: inStock ? primaryColor : '#e2e8f0', color: inStock ? '#fff' : '#94a3b8', border: 'none', borderRadius: 9999, fontSize: 11, fontWeight: 700, cursor: inStock ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: inStock ? `0 3px 10px ${alpha(primaryColor, 0.28)}` : 'none', minWidth: '44px' }}>+ سلة</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const qtyBtnStyle = (color) => ({
  width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${color}`, backgroundColor: 'transparent', color: color, fontSize: 16, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1, flexShrink: 0,
});

// ─── Cart Drawer (تم إضافة كلاسات) ────────────────────────────────────────────
function CartDrawer({ open, onClose, cart, setCart, primaryColor, storeSlug, store }) {
  const [step, setStep] = useState('cart');
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '', wilaya: '', deliveryType: 'home', file: null });
  const [submitting, setSubmitting] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const hasDigital = cart.some((item) => item.is_digital === true);

  const deliveryPrices = store?.delivery_prices || {};
  const wilayaPrices = deliveryPrices[form.wilaya] || {};
  const deliveryPrice = form.wilaya ? wilayaPrices[form.deliveryType] || 0 : 0;
  const totalWithDelivery = total + deliveryPrice;

  const updQty = (id, d) => setCart((p) => p.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i)));
  const removeItem = (id) => setCart((p) => p.filter((i) => i.id !== id));

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

      const { data: insertedOrder, error } = await supabase.from('orders').insert([{ store_slug: storeSlug, customer_name: form.name, customer_phone: form.phone, customer_address: form.address, customer_email: form.email || null, file_url: fileUrl, items: cart.map((i) => ({ title: i.title, quantity: i.qty, price: i.price })), total_price: totalWithDelivery, delivery_price: deliveryPrice, wilaya: form.wilaya, status: 'طلب جديد 🆕' }]).select().single();

      if (error) {
        console.error('Order insert error:', error);
        throw error;
      }

      console.log('✅ الطلب مُدرج:', insertedOrder);
      console.log('🆔 معرف الطلب:', insertedOrder.id);
      console.log('🏷️ رابط المتجر:', storeSlug);

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
            items: cart.map((i) => ({ title: i.title, quantity: i.qty, price: i.price })),
            total_price: totalWithDelivery,
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
    } catch (err) {
      setUploadError(err.message);
      alert(`حدث خطأ أثناء إرسال الطلب: ${err.message}`);
    } finally {
      setSubmitting(false);
      setFileUploading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="cart-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
      <div className="cart-drawer" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '92vw', maxWidth: 400, backgroundColor: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 40px rgba(0,0,0,0.12)', direction: 'rtl', animation: 'sfSlideIn 0.27s cubic-bezier(0.32,0.72,0,1)' }}>
        <div className="cart-header" style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fafbfc' }}>
          <div className="cart-icon" style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: alpha(primaryColor, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCart size={20} color={primaryColor} /></div>
          <div style={{ flex: 1 }}>
            <h3 className="cart-title" style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{step === 'cart' ? 'سلة التسوق' : step === 'checkout' ? 'بيانات الطلب' : 'تم استلام طلبك ✓'}</h3>
            {step === 'cart' && count > 0 && <p className="cart-count" style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{count} منتج في السلة</p>}
          </div>
          <button className="cart-close-btn" onClick={onClose} style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>×</button>
        </div>
        <div className="cart-body" style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {step === 'cart' && (cart.length === 0 ? (
            <div className="cart-empty" style={{ textAlign: 'center', padding: '56px 20px', color: '#94a3b8' }}><div style={{ fontSize: 48, marginBottom: 10, opacity: 0.4 }}>🛒</div><p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>السلة فارغة</p><p style={{ margin: '6px 0 0', fontSize: 13 }}>ابدأ بإضافة منتجات</p></div>
          ) : (
            <div className="cart-items" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map((item) => (
                <div key={item.id} className="cart-item" style={{ display: 'flex', gap: 12, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  {item.image_url && <img className="cart-item-image" src={item.image_url} alt={item.title} style={{ width: 58, height: 58, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: '1px solid #e2e8f0' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="cart-item-title" style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                    {item.is_digital && <p className="cart-item-digital" style={{ margin: '0 0 4px', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>📱 رقمي</p>}
                    <p className="cart-item-price" style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: primaryColor }}>{formatPrice(item.price * item.qty)} د.ج</p>
                    <div className="cart-item-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="qty-btn qty-minus" onClick={() => updQty(item.id, -1)} style={qtyBtnStyle(primaryColor)}>−</button>
                      <span className="qty-value" style={{ fontSize: 14, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                      <button className="qty-btn qty-plus" onClick={() => updQty(item.id, 1)} style={qtyBtnStyle(primaryColor)}>+</button>
                      <button className="cart-item-remove" onClick={() => removeItem(item.id)} style={{ marginRight: 'auto', background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>× حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {step === 'checkout' && (
            <form id="sf-order-form" className="checkout-form" onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[{ label: 'الاسم الكامل', key: 'name', type: 'text', ph: 'أحمد محمد' }, { label: 'رقم الهاتف', key: 'phone', type: 'tel', ph: '0555 123 456' }].map((f) => (
                <div key={f.key} className={`form-group form-group-${f.key}`}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} required placeholder={f.ph} value={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', direction: 'rtl', transition: 'border-color 0.2s' }} onFocus={(e) => (e.target.style.borderColor = primaryColor)} onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')} />
                </div>
              ))}
              <div className="form-group form-group-wilaya">
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>الولاية</label>
                <select value={form.wilaya} onChange={(e) => setForm((p) => ({ ...p, wilaya: e.target.value }))} required style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', direction: 'rtl', backgroundColor: '#fff' }}>
                  <option value="">-- اختر الولاية --</option>
                  {ALGERIA_WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group form-group-delivery-type">
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>نوع العنوان</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className={`delivery-type-btn ${form.deliveryType === 'home' ? 'active' : ''}`} onClick={() => setForm((p) => ({ ...p, deliveryType: 'home' }))} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${form.deliveryType === 'home' ? primaryColor : '#e5e7eb'}`, backgroundColor: form.deliveryType === 'home' ? alpha(primaryColor, 0.1) : '#f8fafc', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>🏠 منزل</button>
                  <button type="button" className={`delivery-type-btn ${form.deliveryType === 'office' ? 'active' : ''}`} onClick={() => setForm((p) => ({ ...p, deliveryType: 'office' }))} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${form.deliveryType === 'office' ? primaryColor : '#e5e7eb'}`, backgroundColor: form.deliveryType === 'office' ? alpha(primaryColor, 0.1) : '#f8fafc', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>🏢 مكتب</button>
                </div>
              </div>
              <div className="form-group form-group-address">
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>العنوان التفصيلي</label>
                <input type="text" required placeholder="الشارع، الحي، البلدية..." value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', direction: 'rtl', transition: 'border-color 0.2s' }} onFocus={(e) => (e.target.style.borderColor = primaryColor)} onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')} />
              </div>
              {hasDigital && (
                <>
                  <div className="form-group form-group-email">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>البريد الإلكتروني (لتسليم المنتج الرقمي)</label>
                    <input type="email" required placeholder="example@mail.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', direction: 'ltr', transition: 'border-color 0.2s' }} onFocus={(e) => (e.target.style.borderColor = primaryColor)} onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')} />
                  </div>
                  <div className="form-group form-group-file">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>رفع ملف (PDF أو صورة)</label>
                    <input type="file" accept=".pdf,.jpg,.png,.jpeg" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files[0] }))} style={{ width: '100%', padding: '8px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fafbfc' }} />
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>الحد الأقصى 10 ميجابايت.</p>
                    {uploadError && <p className="upload-error" style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{uploadError}</p>}
                  </div>
                  <div className="digital-payment-info" style={{ backgroundColor: '#eef2ff', borderRadius: 10, padding: 14, border: '1px solid #c7d2fe' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#4338ca' }}>معلومات الدفع للمنتجات الرقمية:</p>
                    {store?.ccp_account && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#1e293b' }}>CCP: {store.ccp_account}</p>}
                    {store?.mobile_payment && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#1e293b' }}>رقم الهاتف: {store.mobile_payment}</p>}
                    {!store?.ccp_account && !store?.mobile_payment && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>لم يحدد المتجر معلومات الدفع بعد.</p>}
                  </div>
                </>
              )}
              <div className="cart-summary" style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 15, border: '1px solid #f1f5f9', marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}><span>عدد المنتجات</span><span style={{ fontWeight: 700 }}>{count}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 4 }}><span>مجموع المشتريات</span><span style={{ fontWeight: 700 }}>{formatPrice(total)} د.ج</span></div>
                {form.wilaya && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 4 }}><span>سعر التوصيل ({form.deliveryType === 'home' ? 'منزل' : 'مكتب'})</span><span style={{ fontWeight: 700 }}>{deliveryPrice > 0 ? formatPrice(deliveryPrice) : 'مجاني'} د.ج</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: '#0f172a', paddingTop: 8, borderTop: '1px solid #e5e7eb' }}><span>الإجمالي الكلي</span><span style={{ color: primaryColor }}>{formatPrice(totalWithDelivery)} د.ج</span></div>
              </div>
            </form>
          )}
          {step === 'success' && (
            <div className="cart-success" style={{ textAlign: 'center', padding: '52px 20px' }}>
              <div style={{ width: 76, height: 76, backgroundColor: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 34 }}>🎉</div>
              <h3 style={{ margin: '0 0 8px', color: '#059669', fontSize: 20, fontWeight: 800 }}>تم استلام طلبك!</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>سيتواصل معك فريقنا قريباً لتأكيد التوصيل.</p>
              <button className="back-to-shop-btn" onClick={() => { setStep('cart'); onClose(); }} style={{ marginTop: 22, padding: '12px 32px', backgroundColor: primaryColor, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${alpha(primaryColor, 0.32)}` }}>العودة للتسوق ←</button>
            </div>
          )}
        </div>
        {step !== 'success' && (
          <div className="cart-footer" style={{ padding: '14px 18px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafbfc' }}>
            {step === 'cart' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 13, color: '#64748b' }}>الإجمالي</span><span style={{ fontSize: 19, fontWeight: 800, color: '#0f172a' }}>{formatPrice(total)} <span style={{ fontSize: 12, color: '#94a3b8' }}>د.ج</span></span></div>
                <button className="checkout-btn" disabled={cart.length === 0} onClick={() => setStep('checkout')} style={{ width: '100%', padding: 13, backgroundColor: cart.length ? primaryColor : '#e2e8f0', color: cart.length ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: cart.length ? 'pointer' : 'not-allowed', boxShadow: cart.length ? `0 4px 16px ${alpha(primaryColor, 0.3)}` : 'none', transition: 'all 0.2s' }}>متابعة الطلب ←</button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="back-btn" onClick={() => setStep('cart')} style={{ flex: 1, padding: 12, backgroundColor: '#f1f5f9', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>→ رجوع</button>
                <button type="submit" form="sf-order-form" className="submit-order-btn" disabled={submitting || fileUploading} style={{ flex: 2, padding: 12, backgroundColor: submitting || fileUploading ? '#94a3b8' : primaryColor, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: submitting || fileUploading ? 'not-allowed' : 'pointer', boxShadow: submitting || fileUploading ? 'none' : `0 4px 14px ${alpha(primaryColor, 0.3)}` }}>{fileUploading ? 'جاري رفع الملف...' : submitting ? 'جاري الإرسال...' : 'تأكيد الطلب ✓'}</button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes sfSlideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>
    </>
  );
}

// ─── Analytics Dashboard (تم إضافة كلاسات) ────────────────────────────────────
function AnalyticsDashboard({ storeSlug, primaryColor, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { count: visitsCount, error: vErr } = await supabase.from('visits').select('*', { count: 'exact', head: true }).eq('store_slug', storeSlug);
        if (vErr) throw vErr;
        const { count: ordersCount, error: oErr } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_slug', storeSlug);
        if (oErr) throw oErr;
        const { data: wilayaData, error: wErr } = await supabase.from('orders').select('wilaya').eq('store_slug', storeSlug).not('wilaya', 'is', null);
        if (wErr) throw wErr;
        const wilayaCounts = {};
        wilayaData.forEach((row) => { const w = row.wilaya || 'غير معروف'; wilayaCounts[w] = (wilayaCounts[w] || 0) + 1; });
        setStats({ visits: visitsCount || 0, orders: ordersCount || 0, wilayaCounts });
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [storeSlug]);

  if (loading) return <div className="analytics-loading" style={{ padding: 20, textAlign: 'center' }}>جاري تحميل الإحصائيات...</div>;
  if (error) return <div className="analytics-error" style={{ padding: 20, color: 'red' }}>خطأ: {error}</div>;

  const maxWilaya = Math.max(0, ...Object.values(stats.wilayaCounts));

  return (
    <div className="analytics-overlay" style={{ position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="analytics-modal" style={{ backgroundColor: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div className="analytics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>📊 إحصائيات المتجر</h2>
          <button className="analytics-close-btn" onClick={onClose} style={{ width: 32, height: 32, border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>×</button>
        </div>
        <div className="analytics-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="stat-box" style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 800, color: primaryColor }}>{stats.visits}</div><div style={{ fontSize: 13, color: '#64748b' }}>عدد الزيارات</div></div>
          <div className="stat-box" style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 800, color: primaryColor }}>{stats.orders}</div><div style={{ fontSize: 13, color: '#64748b' }}>عدد الطلبات</div></div>
        </div>
        <h3 className="analytics-subtitle" style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>الطلبات حسب الولاية</h3>
        {Object.keys(stats.wilayaCounts).length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>لا توجد طلبات مسجلة بعد.</p>
        ) : (
          <div className="wilaya-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(stats.wilayaCounts).sort((a, b) => b[1] - a[1]).map(([wilaya, count]) => (
              <div key={wilaya} className="wilaya-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="wilaya-name" style={{ width: '100px', fontSize: 13, fontWeight: 500, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wilaya}</span>
                <div className="wilaya-bar" style={{ flex: 1, height: 8, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}><div style={{ height: '100%', width: `${maxWilaya > 0 ? (count / maxWilaya) * 100 : 0}%`, backgroundColor: primaryColor, borderRadius: 999, transition: 'width 0.4s' }} /></div>
                <span className="wilaya-count" style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── المكوّن الرئيسي StoreFront (تم إضافة كلاسات) ─────────────────────────────
export default function StoreFront({ storeSlugProp, slug }) {
  const storeSlug = storeSlugProp || slug || slugFromUrl();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [cartBounce, setCartBounce] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsPassword, setAnalyticsPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const templateSettings = store?.template_settings || {};
  const templateId = templateSettings.templateId || 'default';
  const templateColors = templateSettings.colors || {};
  const templateFonts = templateSettings.fonts || {};

  const primaryColor = safeColor(templateColors.primary || store?.primary_color);
  const bgColor = templateColors.background || store?.bg_color || '#f8fafc';
  const headingFont = templateFonts.heading || store?.font_family || 'system-ui';
  const bodyFont = templateFonts.body || store?.font_family || 'system-ui';

  useEffect(() => {
    if (!templateId || templateId === 'default' || templateId === 'custom') return;
    const linkId = `template-${templateId}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `/templates/${templateId}.css`;
    document.head.appendChild(link);
  }, [templateId]);

  useEffect(() => {
    if (!storeSlug) { setError('لم يتم تحديد المتجر'); setLoading(false); return; }
    (async () => {
      try {
        const [{ data: st, error: stErr }, { data: pr, error: prErr }] = await Promise.all([
          supabase.from('stores').select('*').eq('store_slug', storeSlug).maybeSingle(),
          supabase.from('products').select('*').eq('store_slug', storeSlug).order('created_at', { ascending: false }),
        ]);
        if (stErr) throw stErr;
        if (prErr) throw prErr;
        if (!st) throw new Error('المتجر غير موجود');
        setStore(st);
        setProducts(pr || []);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [storeSlug]);

  useEffect(() => {
    if (!headingFont || headingFont === 'system-ui') return;
    loadGoogleFont(headingFont);
    document.documentElement.style.fontFamily = bodyFont || headingFont;
    return () => { document.documentElement.style.fontFamily = ''; };
  }, [headingFont, bodyFont]);

  useEffect(() => {
    if (!storeSlug) return;
    const logVisit = async () => {
      try {
        const ip = await fetch('https://api.ipify.org?format=json')
          .then((res) => res.json())
          .then((data) => data.ip)
          .catch(() => null);
        await supabase.from('visits').insert([
          { store_slug: storeSlug, visitor_ip: ip, user_agent: navigator.userAgent },
        ]);
      } catch (e) { /* تجاهل */ }
    };
    logVisit();
  }, [storeSlug]);

  useEffect(() => {
    if (!store?.facebook_pixel_id) return;
    if (document.getElementById('fb-pixel-script')) return;
    const script = document.createElement('script');
    script.id = 'fb-pixel-script';
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${store.facebook_pixel_id}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('fb-pixel-script');
      if (el) document.head.removeChild(el);
    };
  }, [store?.facebook_pixel_id]);

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 380);
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filtered = products.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    const matchS = !q || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const matchC = activeCat === 'all' || p.category === activeCat;
    return matchS && matchC;
  });

  const handleAnalyticsLogin = (e) => {
    e.preventDefault();
    if (store?.admin_password && analyticsPassword === store.admin_password) {
      setIsAuthenticated(true);
      setShowAnalytics(true);
      setAnalyticsPassword('');
    } else alert('كلمة المرور غير صحيحة.');
  };

  if (loading) return (
    <div className="store-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 14, fontFamily: 'system-ui', direction: 'rtl' }}>
      <div style={{ width: 34, height: 34, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'sfSpin 0.8s linear infinite' }} />
      <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>جاري تحميل المتجر...</p>
      <style>{`@keyframes sfSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (error) return (
    <div className="store-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', padding: 32 }}><div style={{ fontSize: 52, marginBottom: 12 }}>😕</div><p style={{ color: '#64748b', fontSize: 15 }}>{error}</p></div>
    </div>
  );

  return (
    <div className="store-root" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: bgColor,
      backgroundImage: store?.bg_image_url?.trim() ? `url("${store.bg_image_url.trim()}")` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: bodyFont || headingFont || 'system-ui',
      direction: 'rtl',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes sfSpin { to { transform: rotate(360deg) } }
        @keyframes sfSlideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }
        .store-product-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 500px)  { .store-product-grid { gap: 14px; } }
        @media (min-width: 700px)  { .store-product-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; } }
        @media (min-width: 1024px) { .store-product-grid { grid-template-columns: repeat(4, 1fr); gap: 22px; } }
        .store-header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 10px; padding: 0 16px; height: 62px; }
        @media (max-width: 540px) { .store-header-inner { flex-wrap: wrap; height: auto; padding: 10px 14px 10px; gap: 8px; } .store-search-wrapper { order: 3; flex: 0 0 100%; max-width: 100% !important; } }
        .store-categories { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .store-categories::-webkit-scrollbar { display: none; }
        .store-category-btn { flex-shrink: 0; padding: 7px 16px; border-radius: 9999px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all 0.18s; white-space: nowrap; background: none; font-family: inherit; }
        .store-search-input:focus { outline: none; }
      `}</style>

      <header className="store-header-wrapper" style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(226,232,240,0.7)', boxShadow: '0 1px 16px rgba(0,0,0,0.04)' }}>
        <div className="store-header-inner">
          <div className="store-logo" style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `linear-gradient(135deg, ${primaryColor} 0%, ${alpha(primaryColor, 0.6)} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, boxShadow: `0 3px 10px ${alpha(primaryColor, 0.3)}` }}>{store?.store_name?.[0] || '🛍'}</div>
            <span className="store-name" style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', maxWidth: '30vw', overflow: 'hidden', textOverflow: 'ellipsis' }}>{store?.store_name}</span>
          </div>
          <div className="store-search-wrapper" style={{ flex: 1, position: 'relative', maxWidth: 420 }}>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}><IconSearch size={15} color={searchFocus ? primaryColor : '#94a3b8'} /></span>
            <input className="store-search-input" type="text" placeholder="ابحث عن منتج..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)} style={{ width: '100%', padding: '9px 36px 9px 32px', border: `1.5px solid ${searchFocus ? primaryColor : '#e2e8f0'}`, borderRadius: 10, fontSize: 13, backgroundColor: searchFocus ? '#fff' : '#f8fafc', color: '#0f172a', transition: 'all 0.2s', boxShadow: searchFocus ? `0 0 0 3px ${alpha(primaryColor, 0.1)}` : 'none', fontFamily: 'inherit' }} />
            {searchQuery && <button className="clear-search-btn" onClick={() => setSearchQuery('')} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 17, lineHeight: 1, display: 'flex' }}>×</button>}
          </div>
          {store?.admin_password && <button className="analytics-trigger-btn" onClick={() => setShowAnalytics(true)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>📊</button>}
          <button className="store-cart-button" onClick={() => setCartOpen(true)} aria-label="فتح سلة التسوق" style={{ position: 'relative', flexShrink: 0, width: 42, height: 42, borderRadius: 10, border: `1.5px solid ${alpha(primaryColor, 0.2)}`, backgroundColor: alpha(primaryColor, 0.06), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', transform: cartBounce ? 'scale(1.2)' : 'scale(1)' }}>
            {store?.cart_icon_url?.trim() ? <img src={store.cart_icon_url.trim()} alt="cart" style={{ width: 24, height: 24, objectFit: 'contain', display: 'block', border: 'none' }} onError={(e) => { e.target.style.display = 'none'; }} /> : <IconCart size={20} color={primaryColor} />}
            {cartCount > 0 && <span className="cart-badge" style={{ position: 'absolute', top: -5, left: -5, backgroundColor: '#ef4444', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(239,68,68,0.4)', lineHeight: 1 }}>{cartCount > 99 ? '99+' : cartCount}</span>}
          </button>
        </div>
      </header>

      <HeroSlider store={store} primaryColor={primaryColor} />

      <main className="store-main" style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: 'clamp(16px,3vw,28px) clamp(12px,3vw,24px) 72px' }}>
        {categories.length > 1 && (
          <div className="store-categories" style={{ marginBottom: 20 }}>
            {categories.map(cat => {
              const active = activeCat === cat;
              return <button key={cat} className={`store-category-btn ${active ? 'active' : ''}`} onClick={() => setActiveCat(cat)} style={{ backgroundColor: active ? primaryColor : '#fff', color: active ? '#fff' : '#374151', borderColor: active ? primaryColor : '#e2e8f0', boxShadow: active ? `0 3px 10px ${alpha(primaryColor, 0.28)}` : '0 1px 3px rgba(0,0,0,0.04)' }}>{cat === 'all' ? '🛍 الكل' : cat}</button>;
            })}
          </div>
        )}
        <div className="store-section-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div><h2 className="store-section-title" style={{ margin: 0, fontSize: 'clamp(16px,3vw,20px)', fontWeight: 800, color: '#0f172a' }}>{searchQuery ? `نتائج "${searchQuery}"` : activeCat === 'all' ? 'جميع المنتجات' : activeCat}</h2><p className="store-product-count" style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>{filtered.length} منتج</p></div>
          <div className="store-accent-bar" style={{ width: 38, height: 3, backgroundColor: primaryColor, borderRadius: 9999, flexShrink: 0 }} />
        </div>
        {filtered.length === 0 ? (
          <div className="no-results" style={{ textAlign: 'center', padding: '64px 20px', color: '#94a3b8', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 18 }}><div style={{ fontSize: 44, marginBottom: 10, opacity: 0.45 }}>🔍</div><p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>لا توجد منتجات تطابق بحثك</p></div>
        ) : (
          <div className="store-product-grid">{filtered.map(p => <ProductCard key={p.id} product={p} primaryColor={primaryColor} templateSettings={templateSettings} onAddToCart={addToCart} />)}</div>
        )}
      </main>

      <footer className="store-footer" style={{ backgroundColor: '#1e293b', color: '#f1f5f9', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px)', direction: 'rtl' }}>
        <div className="store-footer-inner" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          {(store?.facebook_url || store?.whatsapp_url) && (
            <div className="store-social-icons" style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 22 }}>
              {store?.facebook_url && <a href={store.facebook_url} target="_blank" rel="noopener noreferrer" className="social-icon facebook-icon" style={{ color: '#94a3b8', transition: 'color 0.2s' }}><IconFacebook size={28} color="#94a3b8" /></a>}
              {store?.whatsapp_url && <a href={store.whatsapp_url} target="_blank" rel="noopener noreferrer" className="social-icon whatsapp-icon" style={{ color: '#94a3b8', transition: 'color 0.2s' }}><IconWhatsApp size={28} color="#94a3b8" /></a>}
            </div>
          )}
          {store?.store_policies?.trim() && <div className="store-policies" style={{ marginBottom: 22 }}><h4 className="policies-title" style={{ color: '#94a3b8', marginBottom: 10, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>سياسات المتجر</h4><p className="policies-text" style={{ whiteSpace: 'pre-line', lineHeight: 1.75, margin: 0, opacity: 0.75, fontSize: 13 }}>{store.store_policies}</p></div>}
          {store?.privacy_policy?.trim() && <div className="store-privacy" style={{ borderTop: '1px solid #334155', paddingTop: 22, marginBottom: 22 }}><h4 className="privacy-title" style={{ color: '#94a3b8', marginBottom: 10, fontSize: 14, fontWeight: 700 }}>سياسة الخصوصية</h4><p className="privacy-text" style={{ whiteSpace: 'pre-line', lineHeight: 1.75, margin: 0, opacity: 0.75, fontSize: 13 }}>{store.privacy_policy}</p></div>}
          <div className="store-copyright" style={{ borderTop: '1px solid #334155', paddingTop: 18, opacity: 0.45, fontSize: 12 }}>© {new Date().getFullYear()} {store?.store_name}. جميع الحقوق محفوظة.</div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} primaryColor={primaryColor} storeSlug={storeSlug} store={store} />

      {showAnalytics && (isAuthenticated ? (
        <AnalyticsDashboard storeSlug={storeSlug} primaryColor={primaryColor} onClose={() => { setShowAnalytics(false); setIsAuthenticated(false); }} />
      ) : (
        <div className="analytics-overlay" style={{ position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowAnalytics(false)}>
          <div className="analytics-login-modal" style={{ backgroundColor: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 400, width: '100%', direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>🔐 أدخل كلمة المرور</h3>
            <form onSubmit={handleAnalyticsLogin}>
              <input type="password" placeholder="كلمة المرور" value={analyticsPassword} onChange={(e) => setAnalyticsPassword(e.target.value)} style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} autoFocus />
              <button type="submit" style={{ width: '100%', padding: 12, backgroundColor: primaryColor, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${alpha(primaryColor, 0.3)}` }}>عرض الإحصائيات</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
