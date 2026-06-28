// App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { theme, inputStyle, labelStyle, cardStyle } from './lib/theme';
import StoreFront from './components/StoreFront';
import ManageProducts from './components/ManageProducts';
import ManageSettings from './components/ManageSettings';
import ManageOrders from './components/ManageOrders';
import ManageDiscountCodes from './components/ManageDiscountCodes';
import LandingPage from './components/LandingPage';
import { 
  Menu, X, Package, Palette, ExternalLink, LogOut, 
  Mail, Lock, Store, Link as LinkIcon, Copy, Check, 
  Loader as Loader2, ShoppingCart, Percent, UserPlus 
} from 'lucide-react';

// ─── مكوّن نموذج تسجيل الدخول ────────────────────────────────────────────
function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password: password.trim() 
    });
    if (error) {
      alert(`❌ خطأ في تسجيل الدخول: ${error.message}`);
    } else {
      if (onLoginSuccess) onLoginSuccess();
    }
    setAuthLoading(false);
  };

  return (
    <div style={{ ...fullScreen, backgroundColor: theme.colors.bg, direction: 'rtl', fontFamily: theme.font.base }}>
      <div style={{ ...cardStyle, padding: 40, width: '100%', maxWidth: 420, boxShadow: theme.shadow.xl }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, margin: '0 auto 16px', backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={26} color="#fff" />
          </div>
          <h2 style={{ margin: '0 0 6px', color: theme.colors.text, fontSize: 22, fontWeight: 700 }}>تسجيل الدخول</h2>
          <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: 14 }}>أدخل بياناتك للدخول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} color={theme.colors.textSubtle} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="you@store.com" 
                style={{ ...inputStyle, direction: 'ltr', paddingRight: 42 }} 
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} color={theme.colors.textSubtle} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                style={{ ...inputStyle, direction: 'ltr', paddingRight: 42 }} 
                autoComplete="current-password"
              />
            </div>
          </div>
          <button type="submit" disabled={authLoading} style={primaryButton(!!authLoading)}>
            {authLoading && <Loader2 size={17} style={{ animation: 'spin 0.9s linear infinite' }} />}
            {authLoading ? 'جاري الدخول...' : 'الدخول إلى لوحة التحكم'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <a href="/" style={{ color: theme.colors.accent, fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            ← العودة إلى الصفحة الرئيسية
          </a>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

// ─── المكوّن الرئيسي App ──────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myStore, setMyStore] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ─── قراءة المسار من الرابط ──────────────────────────────────────────
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const firstPath = pathParts[0] || '';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMerchantStore(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) fetchMerchantStore(session.user.id);
      else { setMyStore(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchMerchantStore = async (userId) => {
    try {
      const { data, error } = await supabase.from('stores').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      if (data) setMyStore(data);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  const handleCopyLink = () => {
    if (!myStore) return;
    const url = `${window.location.origin}/${myStore.store_slug}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToStore = () => {
    if (!myStore) return;
    window.location.href = `/${myStore.store_slug}`;
  };

  // ─── أثناء التحميل ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...centered, fontFamily: theme.font.base, direction: 'rtl' }}>
      <Loader2 size={28} color={theme.colors.textSubtle} style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: 12, color: theme.colors.textMuted, fontSize: 14 }}>جاري تشغيل المنصة...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  // ─── عرض صفحة تسجيل الدخول ────────────────────────────────────────────
  // ✅ الإصلاح: تمرير onLoginSuccess لتوجيه المستخدم بعد الدخول
  if (firstPath === 'login') {
    if (session) {
      // إذا كان مسجلاً مسبقاً، وجّهه مباشرة للرئيسية
      window.location.href = '/';
      return null;
    }
    return <LoginForm onLoginSuccess={() => { window.location.href = '/'; }} />;
  }

  // ─── عرض المتجر مباشرة ────────────────────────────────────────────────
  let customerStoreSlug = null;
  if (firstPath === 'store' && pathParts[1]) {
    customerStoreSlug = pathParts[1];
  } else if (firstPath) {
    customerStoreSlug = firstPath;
  }

  if (customerStoreSlug) {
    return <StoreFront slug={customerStoreSlug} />;
  }

  // ─── إذا لم يكن هناك جلسة، نعرض صفحة الهبوط ──────────────────────────
  if (!session) {
    return <LandingPage />;
  }

  // ─── إذا كان هناك جلسة ولكن لا يوجد متجر ─────────────────────────────
  if (!myStore) return (
    <div style={{ ...centered, direction: 'rtl', fontFamily: theme.font.base, minHeight: '100vh', backgroundColor: theme.colors.bg }}>
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', maxWidth: 440 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ margin: '0 0 8px', color: theme.colors.text, fontSize: 18, fontWeight: 700 }}>لم يتم العثور على متجر</h3>
        <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: 14, lineHeight: 1.6 }}>لا يوجد متجر مرتبط بهذا الحساب.</p>
        <button onClick={() => supabase.auth.signOut()} style={{ ...ghostButton, marginTop: 20 }}>
          <LogOut size={16} /> تسجيل الخروج
        </button>
      </div>
    </div>
  );

  const storeCustomerUrl = `${window.location.origin}/${myStore.store_slug}`;

  // ─── عرض لوحة التحكم ──────────────────────────────────────────────────
  const navItems = [
    { id: 'products',  label: 'إدارة المنتجات',    icon: Package,      description: 'أضف منتجاتك وحدد المخزون والتصنيفات' },
    { id: 'orders',    label: 'الطلبات الواردة',   icon: ShoppingCart, description: 'تابع طلبات الزبائن وحالات الشحن' },
    { id: 'settings',  label: 'تعديل مظهر المتجر', icon: Palette,      description: 'الخطوط، البنرات، والهوية البصرية' },
    { id: 'discounts', label: 'أكواد الخصم',       icon: Percent,      description: 'أنشئ أكواد خصم نسبة مئوية أو مبلغ ثابت' },
  ];

  return (
    <div style={{ fontFamily: theme.font.base, direction: 'rtl', minHeight: '100vh', backgroundColor: theme.colors.bg }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes drawerSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .drawer-enter { animation: drawerSlideIn 280ms cubic-bezier(0.32,0.72,0,1) both }
        .overlay-enter { animation: fadeIn 200ms ease both }
        .content-enter { animation: slideUp 240ms cubic-bezier(0.4,0,0.2,1) both }
      `}</style>

      <header style={{ backgroundColor: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'sticky', top: 0, zIndex: 50, boxShadow: theme.shadow.xs }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => setDrawerOpen(true)} style={iconButton} aria-label="فتح القائمة">
            <Menu size={20} color={theme.colors.text} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, color: theme.colors.text, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{myStore.store_name}</h2>
              <span style={{ fontSize: 12, color: theme.colors.textSubtle }}>لوحة التحكم</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: theme.colors.bg, padding: '7px 8px 7px 12px', borderRadius: theme.radius.pill, border: `1px solid ${theme.colors.border}`, overflow: 'hidden', maxWidth: '45vw' }}>
          <LinkIcon size={14} color={theme.colors.textMuted} style={{ flexShrink: 0 }} />
          <input type="text" readOnly value={storeCustomerUrl}
            style={{ border: 'none', background: 'transparent', outline: 'none', minWidth: 0, flex: 1, fontSize: 12, color: theme.colors.textMuted, direction: 'ltr' }} />
          <button onClick={handleCopyLink}
            style={{ ...pillButton, flexShrink: 0, backgroundColor: copied ? theme.colors.successSoft : theme.colors.primary, color: copied ? theme.colors.success : '#fff' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span style={{ fontSize: 12, fontWeight: 600 }}>{copied ? 'تم' : 'نسخ'}</span>
          </button>
          <button onClick={goToStore} style={{ padding: '6px 14px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            🏪 متجري
          </button>
        </div>

        <button onClick={() => supabase.auth.signOut()} style={ghostButton}>
          <LogOut size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>خروج</span>
        </button>
      </header>

      {drawerOpen && (<>
        <div className="overlay-enter" onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: theme.colors.overlay, zIndex: 90, backdropFilter: 'blur(2px)' }} />
        <aside className="drawer-enter"
          style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, maxWidth: '88vw', backgroundColor: theme.colors.surface, boxShadow: theme.shadow.xl, zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 22px', borderBottom: `1px solid ${theme.colors.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.colors.text }}>القائمة</h3>
              <span style={{ fontSize: 12, color: theme.colors.textSubtle }}>إدارة متجرك</span>
            </div>
            <button onClick={() => setDrawerOpen(false)} style={iconButton}><X size={18} color={theme.colors.textMuted} /></button>
          </div>
          <nav style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setDrawerOpen(false); }} style={drawerItem(active)}>
                  <span style={drawerIconWrap(active)}><Icon size={18} /></span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: theme.colors.textSubtle }}>{item.description}</span>
                  </span>
                </button>
              );
            })}
            <button onClick={goToStore} style={{ ...drawerItem(false), textDecoration: 'none', marginTop: 6, width: '100%', textAlign: 'right' }}>
              <span style={drawerIconWrap(false, theme.colors.successSoft, theme.colors.success)}><ExternalLink size={18} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>عرض المتجر كزبون</span>
                <span style={{ fontSize: 12, color: theme.colors.textSubtle }}>يفتح في نفس النافذة</span>
              </span>
            </button>
          </nav>
          <div style={{ padding: '16px 22px', borderTop: `1px solid ${theme.colors.borderSoft}` }}>
            <button onClick={() => supabase.auth.signOut()} style={{ ...ghostButton, width: '100%', justifyContent: 'center' }}>
              <LogOut size={16} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>تسجيل الخروج</span>
            </button>
          </div>
        </aside>
      </>)}

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 60px' }}>
        <div className="content-enter" key={activeTab}>
          {activeTab === 'products'  && <ManageProducts storeSlug={myStore.store_slug} />}
          {activeTab === 'orders'    && <ManageOrders   storeSlug={myStore.store_slug} />}
          {activeTab === 'settings'  && <ManageSettings storeSlug={myStore.store_slug} />}
          {activeTab === 'discounts' && <ManageDiscountCodes storeSlug={myStore.store_slug} />}
        </div>
      </div>
    </div>
  );
}

// ─── الأنماط المساعدة ──────────────────────────────────────────────────────
const centered    = { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const fullScreen  = { ...centered, padding: 24 };
const iconButton  = { width: 40, height: 40, flex: '0 0 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', borderRadius: theme.radius.sm, cursor: 'pointer' };
const ghostButton = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', backgroundColor: theme.colors.bg, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const pillButton  = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: 'none', borderRadius: theme.radius.pill, cursor: 'pointer' };
function primaryButton(disabled) { 
  return { 
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
    width: '100%', padding: 13, 
    backgroundColor: disabled ? theme.colors.textSubtle : theme.colors.primary, 
    color: '#fff', border: 'none', borderRadius: theme.radius.sm, 
    cursor: disabled ? 'not-allowed' : 'pointer', 
    fontSize: 14, fontWeight: 600 
  }; 
}
function drawerItem(a) { 
  return { 
    display: 'flex', alignItems: 'center', gap: 12, padding: 12, 
    backgroundColor: a ? theme.colors.accentSoft : 'transparent', 
    border: 'none', borderRadius: theme.radius.md, cursor: 'pointer', 
    textAlign: 'right', color: a ? theme.colors.accent : theme.colors.text, 
    width: '100%' 
  }; 
}
function drawerIconWrap(a, bg, color) { 
  return { 
    width: 38, height: 38, flex: '0 0 38px', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: a ? '#fff' : (bg || theme.colors.bg), 
    color: a ? theme.colors.accent : (color || theme.colors.text), 
    borderRadius: theme.radius.sm 
  }; 
}
