import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ALGERIA_WILAYAS } from '../lib/constants';
import CartDrawer from './CartDrawer';

// ─── المساعدات ──────────────────────────────────────────────────────────────
const loadGoogleFont = (fontFamily) => {
  if (!fontFamily || fontFamily === 'system-ui') return;
  const name = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
  const id = `gf-${name.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
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

// ─── Hero Slider ──────────────────────────────────────────────────────────
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

// ─── مكوّن تفاصيل المنتج (مع كلاسات CSS ورسائل تصحيح) ────────────────────
function ProductDetailModal({ product, onClose, primaryColor, storeSlug, onAddToCart }) {
  const [colors, setColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loadingColors, setLoadingColors] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    const fetchColors = async () => {
      setLoadingColors(true);
      try {
        console.log('🔍 جلب الألوان للمنتج ID:', product.id);
        const { data, error } = await supabase
          .from('product_colors')
          .select('*')
          .eq('product_id', product.id);
        if (error) throw error;
        console.log('✅ الألوان المستلمة:', data);
        setColors(data || []);
        if (data && data.length > 0) {
          setSelectedColor(data[0]);
        } else {
          console.warn('⚠️ لا توجد ألوان لهذا المنتج');
        }
      } catch (err) {
        console.error('❌ خطأ في جلب الألوان:', err);
      } finally {
        setLoadingColors(false);
      }
    };
    fetchColors();
  }, [product]);

  const currentImage = selectedColor?.image_url || product?.image_url;

  const handleAddToCart = () => {
    const productWithColor = {
      ...product,
      color: selectedColor?.color_name || null,
      color_id: selectedColor?.id || null,
    };
    onAddToCart(productWithColor, qty);
    onClose();
  };

  return (
    <div
      className="product-modal product-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="product-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          direction: 'rtl',
          padding: '24px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <button
          className="product-modal-close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#94a3b8',
            zIndex: 10,
          }}
        >
          ×
        </button>

        <div className="product-modal-layout">
          <div className="product-modal-row" style={{ display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap' }}>
            {/* ─── الصورة (تم إصلاح الحجم) ─── */}
            <div className="product-modal-image-wrapper" style={{ 
              flex: '1 1 300px', 
              minWidth: '200px',
              aspectRatio: '1/1',
              maxHeight: '400px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}>
              <img
                className="product-modal-image"
                src={currentImage || 'https://via.placeholder.com/400'}
                alt={product.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '12px',
                }}
              />
            </div>

            {/* ─── عرض الألوان أسفل الصورة ─── */}
            <div style={{ flex: '1 1 100%', marginTop: '8px' }}>
              {loadingColors ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>جاري تحميل الألوان...</p>
              ) : colors.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>لا توجد ألوان لهذا المنتج</p>
              ) : (
                <div className="product-modal-colors" style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      className="product-modal-color-btn"
                      onClick={() => setSelectedColor(color)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: selectedColor?.id === color.id ? `3px solid ${primaryColor}` : '2px solid #e2e8f0',
                        backgroundColor: color.color_hex || '#ccc',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selectedColor?.id === color.id ? `0 0 0 2px #fff, 0 0 0 4px ${primaryColor}` : 'none',
                      }}
                      title={color.color_name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* المعلومات */}
            <div className="product-modal-details" style={{ flex: '1 1 300px', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <h2 className="product-modal-title" style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{product.title}</h2>
              <p className="product-modal-description" style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {product.description || 'لا يوجد وصف لهذا المنتج.'}
              </p>
              <div className="product-modal-price-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="product-modal-price" style={{ fontSize: '24px', fontWeight: 800, color: primaryColor }}>
                  {formatPrice(product.price)} د.ج
                </span>
                {selectedColor && (
                  <span className="product-modal-color-label" style={{ fontSize: '14px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '9999px' }}>
                    اللون: {selectedColor.color_name}
                  </span>
                )}
              </div>

              <div className="product-modal-quantity" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>الكمية:</span>
                <button
                  className="product-modal-quantity-btn product-modal-quantity-minus"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${primaryColor}`,
                    backgroundColor: 'transparent', color: primaryColor, fontSize: 16, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, lineHeight: 1, flexShrink: 0,
                  }}
                >
                  −
                </button>
                <span className="product-modal-quantity-value" style={{ fontSize: '16px', fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>{qty}</span>
                <button
                  className="product-modal-quantity-btn product-modal-quantity-plus"
                  onClick={() => setQty((q) => q + 1)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${primaryColor}`,
                    backgroundColor: 'transparent', color: primaryColor, fontSize: 16, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, lineHeight: 1, flexShrink: 0,
                  }}
                >
                  +
                </button>
              </div>

              <div className="product-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  className="product-modal-add-btn"
                  onClick={handleAddToCart}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: primaryColor,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: `0 4px 14px ${alpha(primaryColor, 0.3)}`,
                    flex: '1',
                  }}
                >
                  🛒 إضافة إلى السلة
                </button>
                <button
                  className="product-modal-close-btn"
                  onClick={onClose}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────
function ProductCard({ product, primaryColor, templateSettings, onAddToCart, onProductClick }) {
  const [hov, setHov] = useState(false);
  const [qty, setQty] = useState(1);
  const inStock = product.in_stock !== false;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (qty > 0 && onAddToCart) {
      onAddToCart(product, qty);
      setQty(1);
    }
  };

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
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
      onClick={handleCardClick}
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
        cursor: 'pointer',
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
            <button className="qty-btn qty-minus" disabled={!inStock} onClick={(e) => { e.stopPropagation(); setQty((q) => Math.max(1, q - 1)); }} style={{
              width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${primaryColor}`,
              backgroundColor: 'transparent', color: primaryColor, fontSize: 16, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, lineHeight: 1, flexShrink: 0,
            }}>−</button>
            <input className="qty-input" type="number" min="1" max={product.stock_quantity || 999} value={qty} onClick={(e) => e.stopPropagation()} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '36px', textAlign: 'center', fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 0', background: '#f8fafc', color: '#0f172a' }} />
            <button className="qty-btn qty-plus" disabled={!inStock} onClick={(e) => { e.stopPropagation(); setQty((q) => q + 1); }} style={{
              width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${primaryColor}`,
              backgroundColor: 'transparent', color: primaryColor, fontSize: 16, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, lineHeight: 1, flexShrink: 0,
            }}>+</button>
            <button className="add-to-cart-btn" disabled={!inStock} onClick={handleAdd} style={{ flexShrink: 0, padding: '6px 11px', backgroundColor: inStock ? primaryColor : '#e2e8f0', color: inStock ? '#fff' : '#94a3b8', border: 'none', borderRadius: 9999, fontSize: 11, fontWeight: 700, cursor: inStock ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: inStock ? `0 3px 10px ${alpha(primaryColor, 0.28)}` : 'none', minWidth: '44px' }}>+ سلة</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Dashboard ────────────────────────────────────────────────────
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

// ─── المكوّن الرئيسي StoreFront ─────────────────────────────────────────────
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
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const tiktokPixelId = store?.tiktok_pixel_id?.trim() || null;

  // ─── تحميل كود TikTok Pixel ──────────────────────────────────────────────
  useEffect(() => {
    if (!tiktokPixelId) return;
    if (document.getElementById('tt-pixel-script')) return;

    const script = document.createElement('script');
    script.id = 'tt-pixel-script';
    script.async = true;
    script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${tiktokPixelId}&lib=ttq`;
    document.head.appendChild(script);

    const initTikTok = () => {
      if (window.ttq) {
        window.ttq.load(tiktokPixelId);
        window.ttq.page();
      } else {
        setTimeout(initTikTok, 500);
      }
    };

    script.onload = initTikTok;
    script.onerror = () => console.warn('⚠️ فشل تحميل TikTok Pixel SDK');

    return () => {
      const el = document.getElementById('tt-pixel-script');
      if (el) document.head.removeChild(el);
      if (window.ttq) {
        try { delete window.ttq; } catch (e) {}
      }
    };
  }, [tiktokPixelId]);

  // ─── إرسال حدث AddToCart إلى TikTok ──────────────────────────────────────
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id && i.color === product.color);
      if (ex) {
        return prev.map(i =>
          i.id === product.id && i.color === product.color
            ? { ...i, qty: i.qty + qty }
            : i
        );
      }
      return [...prev, { ...product, qty }];
    });
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 380);

    // إرسال حدث TikTok
    if (tiktokPixelId && window.ttq) {
      window.ttq.track('AddToCart', {
        contents: [
          {
            content_id: product.id,
            content_name: product.title + (product.color ? ` (${product.color})` : ''),
            price: product.price,
            quantity: qty,
          }
        ],
        value: parseFloat(product.price) * qty,
        currency: 'DZD',
      });
    }
  };

  // ─── تحميل قالب CSS ──────────────────────────────────────────────────────
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

  // ─── جلب بيانات المتجر والمنتجات ──────────────────────────────────────
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

  // ─── تحميل الخطوط ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!headingFont || headingFont === 'system-ui') return;
    loadGoogleFont(headingFont);
    document.documentElement.style.fontFamily = bodyFont || headingFont;
    return () => { document.documentElement.style.fontFamily = ''; };
  }, [headingFont, bodyFont]);

  // ─── تسجيل الزيارة ──────────────────────────────────────────────────────
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

  // ─── Facebook Pixel ──────────────────────────────────────────────────────
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
          <div className="store-product-grid">
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                primaryColor={primaryColor}
                templateSettings={templateSettings}
                onAddToCart={addToCart}
                onProductClick={setSelectedProduct}
              />
            ))}
          </div>
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

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setCart={setCart}
        primaryColor={primaryColor}
        storeSlug={storeSlug}
        store={store}
        tiktokPixelId={tiktokPixelId}
      />

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          primaryColor={primaryColor}
          storeSlug={storeSlug}
          onAddToCart={addToCart}
        />
      )}

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