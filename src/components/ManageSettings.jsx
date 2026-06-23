import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { theme, inputStyle, labelStyle, cardStyle } from '../lib/theme';
import {
  Palette, Image as ImageIcon, Store, Loader as Loader2,
  Check, Type, CheckCheck, Plus, Trash2, Megaphone, Link as LinkIcon,
  Globe, Smartphone, Key, Map, House, BriefcaseBusiness, DollarSign,
  FileText, Video,
} from 'lucide-react';
import { ALGERIA_WILAYAS } from '../lib/constants';

const FONT_OPTIONS = [
  { value: 'system-ui',              label: 'System UI (الافتراضي)', preview: '—' },
  { value: "'Cairo', sans-serif",    label: 'Cairo (كاير)',           preview: 'تجربة النص' },
  { value: "'Tajawal', sans-serif",  label: 'Tajawal (تجوال)',        preview: 'تجربة النص' },
  { value: "'Inter', sans-serif",    label: 'Inter (إنتر)',           preview: 'Sample text' },
];

// ─── مدير البنرات ────────────────────────────────────────────────────────────
function BannerManager({ bannerUrls, onChange }) {
  const add    = ()      => onChange([...bannerUrls, '']);
  const remove = (i)     => onChange(bannerUrls.filter((_, idx) => idx !== i));
  const update = (i, v)  => onChange(bannerUrls.map((b, idx) => idx === i ? v : b));

  return (
    <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <span style={iconWrap(theme.colors.accentSoft, theme.colors.accent)}><Megaphone size={16} /></span>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.text }}>بنرات الإعلانات المتحركة</span>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: theme.colors.textSubtle }}>تظهر هذه الصور في الـ Hero Slider على واجهة متجرك</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {bannerUrls.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, border: `1px dashed ${theme.colors.border}` }}>
            <ImageIcon size={28} color={theme.colors.textSubtle} style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: '13px', color: theme.colors.textSubtle }}>لم تُضف أي بنرات بعد — أضف روابط صور إعلانية أدناه</p>
          </div>
        )}
        {bannerUrls.map((url, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={15} color={theme.colors.textSubtle} style={iconRight} />
                <input type="url" value={url} onChange={e => update(i, e.target.value)}
                  placeholder={`رابط البنر ${i + 1} — https://...`}
                  style={{ ...inputStyle, paddingRight: '36px', direction: 'ltr', textAlign: 'left' }} />
              </div>
              {url && (
                <div style={{ height: '72px', borderRadius: theme.radius.sm, overflow: 'hidden', border: `1px solid ${theme.colors.borderSoft}`, backgroundColor: theme.colors.bg }}>
                  <img src={url} alt={`بنر ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.colors.textSubtle, fontSize: '12px', gap: '6px' }}>
                    <ImageIcon size={14} /><span>رابط الصورة غير صالح</span>
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => remove(i)} style={deleteBtn} title="حذف البنر"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} disabled={bannerUrls.length >= 8}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px',
          backgroundColor: 'transparent', color: bannerUrls.length >= 8 ? theme.colors.textSubtle : theme.colors.accent,
          border: `1.5px dashed ${bannerUrls.length >= 8 ? theme.colors.border : theme.colors.accent}`,
          borderRadius: theme.radius.sm, cursor: bannerUrls.length >= 8 ? 'not-allowed' : 'pointer',
          fontSize: '13px', fontWeight: 600, transition: theme.transition,
        }}>
        <Plus size={15} />
        {bannerUrls.length >= 8 ? 'الحد الأقصى 8 بنرات' : 'إضافة بنر جديد'}
      </button>
      {bannerUrls.length > 0 && (
        <p style={{ margin: 0, fontSize: '12px', color: theme.colors.textSubtle, textAlign: 'center' }}>
          {bannerUrls.length} / 8 بنرات — الترتيب يعكس ترتيب العرض في السلايدر
        </p>
      )}
    </div>
  );
}

// ─── مدير أسعار التوصيل ──────────────────────────────────────────────────────
function DeliveryManager({ deliveryPrices = {}, onChange }) {
  const updatePrice = (wilaya, type, value) => {
    const num = parseFloat(value) || 0;
    const newPrices = { ...deliveryPrices };
    if (!newPrices[wilaya]) newPrices[wilaya] = { home: 0, office: 0 };
    newPrices[wilaya][type] = num;
    onChange(newPrices);
  };

  return (
    <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <span style={iconWrap(theme.colors.accentSoft, theme.colors.accent)}><Map size={16} /></span>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.text }}>أسعار التوصيل حسب الولاية</span>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: theme.colors.textSubtle }}>أدخل سعر التوصيل للمنزل والمكتب لكل ولاية (اتركه فارغاً إذا كان مجانياً)</p>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px', 
        maxHeight: '400px', 
        overflowY: 'auto',
        border: '1px solid #f1f5f9',
        borderRadius: '8px',
        padding: '8px'
      }}>
        {ALGERIA_WILAYAS.map(w => {
          const prices = deliveryPrices[w] || { home: 0, office: 0 };
          return (
            <div key={w} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '6px 4px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <span style={{ 
                width: '110px', 
                fontSize: '13px', 
                fontWeight: 600, 
                color: '#0f172a',
                flexShrink: 0
              }}>{w}</span>
              <input
                type="number"
                value={prices.home || ''}
                onChange={e => updatePrice(w, 'home', e.target.value)}
                placeholder="المنزل"
                style={{ 
                  ...inputStyle, 
                  width: '90px', 
                  padding: '6px 8px', 
                  fontSize: '13px',
                  flexShrink: 0
                }}
              />
              <input
                type="number"
                value={prices.office || ''}
                onChange={e => updatePrice(w, 'office', e.target.value)}
                placeholder="المكتب"
                style={{ 
                  ...inputStyle, 
                  width: '90px', 
                  padding: '6px 8px', 
                  fontSize: '13px',
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: 'auto' }}>د.ج</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
        {ALGERIA_WILAYAS.length} ولاية — قم بتحديد الأسعار ثم احفظ التعديلات
      </div>
    </div>
  );
}

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────────────
export default function ManageSettings({ storeSlug }) {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // الحقول الأساسية
  const [storeName, setStoreName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [bgColor, setBgColor] = useState('#f9fafb');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [fontFamily, setFontFamily] = useState('system-ui');
  const [bannerUrls, setBannerUrls] = useState([]);

  // الحقول الأخرى
  const [facebookUrl, setFacebookUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [ccpAccount, setCcpAccount] = useState('');
  const [mobilePayment, setMobilePayment] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [deliveryPrices, setDeliveryPrices] = useState({});
  
  // حقل Google Script (VIP)
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');
  
  // حقل Facebook Pixel
  const [facebookPixelId, setFacebookPixelId] = useState('');

  // الحقول الجديدة
  const [storePolicies, setStorePolicies] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [bannerVideoUrl, setBannerVideoUrl] = useState('');

  // ─── تغيير رابط المتجر ──────────────────────────────────────────────────
  const [newSlug, setNewSlug] = useState('');
  const [changingSlug, setChangingSlug] = useState(false);

  // ── جلب الإعدادات ──
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('store_name, primary_color, bg_color, bg_image_url, font_family, banner_urls, facebook_url, whatsapp_url, ccp_account, mobile_payment, admin_password, delivery_prices, google_script_url, facebook_pixel_id, store_policies, privacy_policy, banner_video_url')
          .eq('store_slug', storeSlug)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setStoreName(data.store_name || '');
          setPrimaryColor(data.primary_color || '#4f46e5');
          setBgColor(data.bg_color || '#f9fafb');
          setBgImageUrl(data.bg_image_url || '');
          setFontFamily(data.font_family || 'system-ui');
          setBannerUrls(Array.isArray(data.banner_urls) ? data.banner_urls : []);
          setFacebookUrl(data.facebook_url || '');
          setWhatsappUrl(data.whatsapp_url || '');
          setCcpAccount(data.ccp_account || '');
          setMobilePayment(data.mobile_payment || '');
          setAdminPassword(data.admin_password || '');
          setDeliveryPrices(data.delivery_prices || {});
          setGoogleScriptUrl(data.google_script_url || '');
          setFacebookPixelId(data.facebook_pixel_id || '');
          setStorePolicies(data.store_policies || '');
          setPrivacyPolicy(data.privacy_policy || '');
          setBannerVideoUrl(data.banner_video_url || '');
        }
      } catch (err) {
        console.error('خطأ في جلب الإعدادات:', err.message);
      } finally {
        setLoading(false);
      }
    };
    if (storeSlug) fetchSettings();
  }, [storeSlug]);

  // ── حفظ الإعدادات ──
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const cleanBanners = bannerUrls.filter(u => u.trim() !== '');
      const { error } = await supabase
        .from('stores')
        .update({
          store_name: storeName,
          primary_color: primaryColor,
          bg_color: bgColor,
          bg_image_url: bgImageUrl,
          font_family: fontFamily,
          banner_urls: cleanBanners,
          facebook_url: facebookUrl,
          whatsapp_url: whatsappUrl,
          ccp_account: ccpAccount,
          mobile_payment: mobilePayment,
          admin_password: adminPassword,
          delivery_prices: deliveryPrices,
          google_script_url: googleScriptUrl,
          facebook_pixel_id: facebookPixelId,
          store_policies: storePolicies,
          privacy_policy: privacyPolicy,
          banner_video_url: bannerVideoUrl,
        })
        .eq('store_slug', storeSlug);

      if (error) throw error;
      setBannerUrls(cleanBanners);
      alert('✅ تم حفظ التعديلات بنجاح!');
    } catch (err) {
      alert(`❌ فشل حفظ الإعدادات: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // ─── تغيير الرابط (بدون redirects) ──────────────────────────────────────
  const handleChangeSlug = async () => {
    const slug = newSlug.trim().toLowerCase();
    if (!slug) return alert('الرجاء إدخال رابط جديد');
    if (slug === storeSlug) return alert('الرابط الجديد مطابق للرابط الحالي');
    if (!/^[a-z0-9_-]+$/.test(slug)) {
      return alert('الرابط يجب أن يحتوي فقط على أحرف إنجليزية وأرقام و _ و -');
    }

    // التحقق من عدم استخدام الرابط
    const { data: existing } = await supabase
      .from('stores')
      .select('store_slug')
      .eq('store_slug', slug)
      .maybeSingle();

    if (existing) return alert('هذا الرابط مستخدم من قبل متجر آخر');

    if (!window.confirm(`⚠️ هل أنت متأكد من تغيير رابط المتجر إلى "${slug}"؟\n\nالروابط القديمة لن تعمل بعد الآن، وسيكون عليك تحديثها يدوياً.`)) return;

    setChangingSlug(true);
    try {
      // 1. تحديث جدول المتجر
      const { error: storeErr } = await supabase
        .from('stores')
        .update({ store_slug: slug })
        .eq('store_slug', storeSlug);
      if (storeErr) throw storeErr;

      // 2. تحديث الجداول المرتبطة
      const tables = ['orders', 'visits', 'products'];
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .update({ store_slug: slug })
          .eq('store_slug', storeSlug);
        if (error) throw new Error(`فشل تحديث جدول ${table}: ${error.message}`);
      }

      alert(`✅ تم تغيير رابط المتجر إلى "${slug}" بنجاح!`);
      window.location.href = `/${slug}`;
    } catch (err) {
      alert(`❌ فشل تغيير الرابط: ${err.message}`);
    } finally {
      setChangingSlug(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontFamily: theme.font.base, direction: 'rtl' }}>
        <Loader2 size={24} color={theme.colors.textSubtle} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px', color: theme.colors.textMuted, fontSize: '14px' }}>جاري تحميل إعدادات المظهر...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', direction: 'rtl', fontFamily: theme.font.base }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <span style={iconWrap(theme.colors.accentSoft, theme.colors.accent)}><Palette size={18} /></span>
        <div>
          <h2 style={{ margin: 0, color: theme.colors.text, fontSize: '18px', fontWeight: 700 }}>تخصيص مظهر وهوية المتجر</h2>
          <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: '13px' }}>طبق الهوية البصرية وأضف معلومات التواصل والدفع</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* معلومات أساسية */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionLabel icon={<Store size={15} />} label="المعلومات الأساسية" />
          <div>
            <label style={labelStyle}>اسم المتجر</label>
            <div style={{ position: 'relative' }}>
              <Store size={15} color={theme.colors.textSubtle} style={iconRight} />
              <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} required placeholder="اسم المتجر" style={{ ...inputStyle, paddingRight: '38px' }} />
            </div>
          </div>
        </div>

        {/* الألوان */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SectionLabel icon={<Palette size={15} />} label="الألوان" />
          <ColorPicker label="اللون الرئيسي (الأزرار والحدود)" value={primaryColor} onChange={setPrimaryColor} />
          <ColorPicker label="لون خلفية المتجر كاملة" value={bgColor} onChange={setBgColor} withBorder />
        </div>

        {/* خلفية */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionLabel icon={<ImageIcon size={15} />} label="خلفية المتجر" />
          <div>
            <label style={labelStyle}>رابط صورة الخلفية (اختياري)</label>
            <div style={{ position: 'relative' }}>
              <ImageIcon size={15} color={theme.colors.textSubtle} style={iconRight} />
              <input type="url" value={bgImageUrl} onChange={e => setBgImageUrl(e.target.value)} placeholder="https://example.com/bg.jpg" style={{ ...inputStyle, direction: 'ltr', textAlign: 'left', paddingRight: '38px' }} />
            </div>
          </div>
        </div>

        {/* الخط */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionLabel icon={<Type size={15} />} label="خط المتجر" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FONT_OPTIONS.map(font => {
              const isSelected = fontFamily === font.value;
              return (
                <button key={font.value} type="button" onClick={() => setFontFamily(font.value)} style={fontOptionBtn(isSelected)}>
                  <span style={{ fontFamily: font.value, fontSize: '15px', fontWeight: isSelected ? 700 : 500, color: isSelected ? theme.colors.accent : theme.colors.text }}>{font.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {font.preview !== '—' && <span style={{ fontFamily: font.value, fontSize: '14px', color: theme.colors.textSubtle }}>{font.preview}</span>}
                    {isSelected && <CheckCheck size={16} color={theme.colors.accent} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* البنرات */}
        <BannerManager bannerUrls={bannerUrls} onChange={setBannerUrls} />

        {/* ─── فيديو البنر ─── */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionLabel icon={<Video size={15} />} label="فيديو البنر (خلفية متحركة)" />
          <p style={{ margin: 0, color: theme.colors.textSubtle, fontSize: '12px' }}>
            أضف رابط فيديو ليظهر كخلفية في البنر بدلاً من الصور.
            <br />
            يدعم روابط MP4 المباشرة، وروابط تضمين YouTube و Vimeo.
          </p>
          <div>
            <label style={labelStyle}>رابط الفيديو</label>
            <input
              type="url"
              value={bannerVideoUrl}
              onChange={e => setBannerVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4 أو https://www.youtube.com/embed/..."
              style={inputStyle}
            />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
              اتركه فارغاً لعرض الصور بدلاً من الفيديو.
            </p>
          </div>
        </div>

        {/* وسائل التواصل الاجتماعي */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionLabel icon={<Globe size={15} />} label="وسائل التواصل الاجتماعي" />
          <div>
            <label style={labelStyle}>رابط صفحة فيسبوك</label>
            <input type="url" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>رابط واتساب (للتواصل المباشر)</label>
            <input type="url" value={whatsappUrl} onChange={e => setWhatsappUrl(e.target.value)} placeholder="https://wa.me/..." style={inputStyle} />
          </div>
        </div>

        {/* معلومات الدفع للمنتجات الرقمية */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionLabel icon={<Smartphone size={15} />} label="معلومات الدفع للمنتجات الرقمية" />
          <p style={{ margin: 0, color: theme.colors.textSubtle, fontSize: '12px' }}>ستظهر هذه المعلومات للزبون عند شراء منتج رقمي</p>
          <div>
            <label style={labelStyle}>رقم حساب CCP</label>
            <input type="text" value={ccpAccount} onChange={e => setCcpAccount(e.target.value)} placeholder="مثال: 12345678" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>رقم الهاتف للدفع (بريدي موب)</label>
            <input type="text" value={mobilePayment} onChange={e => setMobilePayment(e.target.value)} placeholder="مثال: 0555 123 456" style={inputStyle} />
          </div>
        </div>

        {/* كلمة مرور التحليلات */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionLabel icon={<Key size={15} />} label="كلمة مرور لوحة التحليلات" />
          <p style={{ margin: 0, color: theme.colors.textSubtle, fontSize: '12px' }}>استخدم هذه الكلمة للوصول إلى إحصائيات المتجر (عدد الزيارات، الطلبات حسب الولاية)</p>
          <div>
            <label style={labelStyle}>كلمة المرور</label>
            <input type="text" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="أدخل كلمة مرور قوية" style={inputStyle} />
          </div>
        </div>

        {/* أسعار التوصيل */}
        <DeliveryManager deliveryPrices={deliveryPrices} onChange={setDeliveryPrices} />

        {/* ─── سياسات المتجر ─── */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionLabel icon={<FileText size={15} />} label="سياسات المتجر" />
          <p style={{ margin: 0, color: theme.colors.textSubtle, fontSize: '12px' }}>
            أدخل شروط البيع، سياسات التوصيل، الإرجاع، وغيرها.
          </p>
          <div>
            <label style={labelStyle}>سياسات المتجر</label>
            <textarea
              value={storePolicies}
              onChange={e => setStorePolicies(e.target.value)}
              placeholder="أدخل سياسات متجرك هنا..."
              style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={labelStyle}>سياسة الخصوصية</label>
            <textarea
              value={privacyPolicy}
              onChange={e => setPrivacyPolicy(e.target.value)}
              placeholder="أدخل سياسة الخصوصية هنا..."
              style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* ─── تغيير رابط المتجر ─── */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '2px solid #f59e0b' }}>
          <SectionLabel icon={<LinkIcon size={15} />} label="تغيير رابط المتجر (متقدم)" />
          <p style={{ margin: 0, color: '#d97706', fontSize: '12px' }}>
            ⚠️ تغيير الرابط سيؤدي إلى تغيير عنوان متجرك. <strong>الروابط القديمة لن تعمل بعد الآن</strong>، وسيكون عليك تحديثها يدوياً في حساباتك وإعلاناتك.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={newSlug}
              onChange={e => setNewSlug(e.target.value.toLowerCase())}
              placeholder="الرابط الجديد (أحرف إنجليزية وأرقام فقط)"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleChangeSlug}
              disabled={changingSlug || !newSlug.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: changingSlug ? '#94a3b8' : '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: theme.radius.sm,
                cursor: changingSlug ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {changingSlug ? 'جاري التغيير...' : 'تغيير الرابط'}
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            الرابط الحالي: <strong style={{ color: '#0f172a' }}>/{storeSlug}</strong>
          </div>
        </div>

        {/* ─── إعدادات Google Sheets (VIP) ─── */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '2px solid #fbbf24' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: '#fbbf24', color: '#78350f', padding: '2px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
              VIP
            </span>
            <SectionLabel icon={<LinkIcon size={15} />} label="إشعارات Google Sheets (ميزة متقدمة)" />
          </div>
          <p style={{ margin: 0, color: theme.colors.textSubtle, fontSize: '12px' }}>
            قم بإنشاء Google Apps Script واحصل على رابط Web App لتلقي إشعارات الطلبات عبر الإيميل وإضافتها إلى Google Sheets.
            <br />
            <a href="#" style={{ color: theme.colors.accent }}>طريقة الحصول على الرابط ←</a>
          </p>
          <div>
            <label style={labelStyle}>رابط Google Sheets Web App</label>
            <input
              type="url"
              value={googleScriptUrl}
              onChange={e => setGoogleScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              style={inputStyle}
            />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
              اتركه فارغاً إذا لم ترغب في تفعيل الإشعارات.
            </p>
          </div>
        </div>

        {/* ─── إعدادات Facebook Pixel ─── */}
        <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionLabel icon={<Globe size={15} />} label="Facebook Pixel" />
          <p style={{ margin: 0, color: theme.colors.textSubtle, fontSize: '12px' }}>
            أدخل رقم Facebook Pixel ID لتتبع زوار متجرك وإعادة الاستهداف.
            <br />
            <a href="https://www.facebook.com/business/help/952192354843755" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.accent }}>
              كيف تحصل على Pixel ID؟ ←
            </a>
          </p>
          <div>
            <label style={labelStyle}>رقم Facebook Pixel ID</label>
            <input
              type="text"
              value={facebookPixelId}
              onChange={e => setFacebookPixelId(e.target.value)}
              placeholder="مثال: 123456789012345"
              style={inputStyle}
            />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
              اتركه فارغاً إذا لم ترغب في تفعيل التتبع.
            </p>
          </div>
        </div>

        {/* زر الحفظ */}
        <button type="submit" disabled={saveLoading} style={primaryBtn(!!saveLoading)}>
          {saveLoading ? <Loader2 size={17} style={{ animation: 'spin 0.9s linear infinite' }} /> : <Check size={17} />}
          {saveLoading ? 'جاري الحفظ...' : 'تطبيق وحفظ التعديلات'}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ─── المكوّنات المساعدة ──────────────────────────────────────────────────────
function SectionLabel({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: theme.colors.textMuted }}>{icon}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.text }}>{label}</span>
    </div>
  );
}

function ColorPicker({ label, value, onChange, withBorder = false }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ border: `1px solid ${theme.colors.border}`, width: '52px', height: '38px', cursor: 'pointer', borderRadius: theme.radius.sm, padding: '3px' }} />
        <span style={{ fontFamily: 'monospace', color: theme.colors.textMuted, fontSize: '13px' }}>{value}</span>
        <div style={{ marginLeft: 'auto', width: '56px', height: '22px', backgroundColor: value, borderRadius: theme.radius.sm, border: withBorder ? `1px solid ${theme.colors.border}` : 'none' }} />
      </div>
    </div>
  );
}

// ─── الثوابت المساعدة ──────────────────────────────────────────────────────
const iconRight = { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' };
const iconWrap = (bg, color) => ({ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bg, color, borderRadius: theme.radius.sm, flexShrink: 0 });
const deleteBtn = { width: '36px', height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.dangerSoft, color: theme.colors.danger, border: 'none', borderRadius: theme.radius.sm, cursor: 'pointer', transition: theme.transition };
function fontOptionBtn(isSelected) {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '13px 16px',
    backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.bg,
    border: `1px solid ${isSelected ? theme.colors.accent : theme.colors.border}`,
    borderRadius: theme.radius.md, cursor: 'pointer', transition: theme.transition, textAlign: 'right',
  };
}
function primaryBtn(disabled) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    width: '100%', padding: '13px',
    backgroundColor: disabled ? theme.colors.textSubtle : theme.colors.primary,
    color: '#fff', border: 'none', borderRadius: theme.radius.sm,
    cursor: disabled ? 'not-allowed' : 'pointer', transition: theme.transition,
    fontSize: '14px', fontWeight: 600,
  };
}
