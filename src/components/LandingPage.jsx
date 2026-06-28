// src/components/LandingPage.jsx (نسخة مختصرة بدون أخطاء)
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';
import { 
  Mail, Lock, Store, User, Phone, Check, X, Loader2, 
  ShoppingCart, Truck, Bell, Palette, LineChart, 
  Share2, Tag, Layers, Boxes, 
  Sliders, Video, Link2, Layout, 
  Clock, Upload, FileText, CreditCard, Zap 
} from 'lucide-react';

export default function LandingPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    storeName: '',
    adminName: '',
    phone: '',
    plan: 'free',
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFileError('');
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setFileError('حجم الملف يتجاوز 5 ميجابايت');
        e.target.value = '';
        return;
      }
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
        setFileError('يُسمح فقط بملفات PDF, JPG, PNG, WEBP');
        e.target.value = '';
        return;
      }
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    if (!agreeTerms) {
      setResult({ success: false, message: '❌ يجب الموافقة على الشروط والأحكام' });
      setLoading(false);
      return;
    }

    if (!form.email || !form.password || !form.storeName) {
      setResult({ success: false, message: '❌ الرجاء تعبئة جميع الحقول المطلوبة' });
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setResult({ success: false, message: '❌ البريد الإلكتروني غير صحيح' });
      setLoading(false);
      return;
    }

    if (form.password.trim().length < 6) {
      setResult({ success: false, message: '❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      setLoading(false);
      return;
    }

    if (form.plan === 'paid' && !file) {
      setResult({ success: false, message: '❌ يجب رفع وصل الدفع للباقة المدفوعة' });
      setLoading(false);
      return;
    }

    let fileBase64 = null;
    let fileName = null;
    let fileType = null;
    if (file) {
      try {
        const reader = new FileReader();
        const fileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        fileBase64 = fileData;
        fileName = file.name;
        fileType = file.type;
      } catch (err) {
        setResult({ success: false, message: '❌ فشل قراءة الملف' });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: form.plan,
          email: form.email.trim(),
          password: form.password.trim(),
          phone: form.phone.trim() || null,
          store_name: form.storeName.trim(),
          admin_name: form.adminName.trim() || form.storeName.trim(),
          notes: '',
          file_base64: fileBase64,
          file_name: fileName,
          file_type: fileType,
          terms_accepted: agreeTerms,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'حدث خطأ');

      setResult({
        success: true,
        message: data.message,
        data: data.data,
      });

      setForm({
        email: '',
        password: '',
        storeName: '',
        adminName: '',
        phone: '',
        plan: 'free',
      });
      setFile(null);
      setFilePreview(null);
      setFileError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setAgreeTerms(false);

      if (form.plan === 'free') {
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    } catch (err) {
      setResult({ success: false, message: `❌ ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const selectPlan = (plan) => {
    setForm({ ...form, plan });
    document.getElementById('register-form').scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: <ShoppingCart size={18} />, title: 'سلة شراء متكاملة', desc: 'إضافة منتجات، تعديل الكميات، وإتمام الطلب بخطوات سلسة.' },
    { icon: <Truck size={18} />, title: 'توصيل لكامل الجزائر', desc: 'أسعار توصيل مخصصة لكل ولاية مع خيار التوصيل للمنزل أو المكتب.' },
    { icon: <Bell size={18} />, title: 'إشعارات فورية', desc: 'كل طلب جديد يصلك فوراً على بريدك الإلكتروني بتفاصيل كاملة.' },
    { icon: <Palette size={18} />, title: 'هوية بصرية خاصة', desc: 'ألوان وخطوط وبنرات تعكس علامتك التجارية وتميّزك.' },
    { icon: <LineChart size={18} />, title: 'لوحة تحليلات', desc: 'إحصائيات وتقارير عن الزوار والمبيعات داخل لوحة التحكم.' },
    { icon: <Share2 size={18} />, title: 'Facebook Pixel', desc: 'تتبع الزوار وتحسين إعلاناتك مباشرة من المتجر.' },
    { icon: <Tag size={18} />, title: 'أكواد الخصم', desc: 'أنشئ كوبونات خصم مخصصة لجذب العملاء وزيادة المبيعات.' },
    { icon: <Layers size={18} />, title: 'صفحة منتج متقدمة', desc: 'إمكانية اختيار ألوان متعددة للمنتج، وصفحة تعريفية غنية بالتفاصيل.' },
    { icon: <Zap size={18} />, title: 'TikTok Pixel', desc: 'تتبع وتحويل إعلانات تيك توك مباشرة من متجرك.' },
    { icon: <Boxes size={18} />, title: 'التحكم في المخزون', desc: 'متابعة الكميات المتوفرة وتنبيه نفاد المنتجات.' },
    { icon: <CreditCard size={18} />, title: 'منتجات رقمية', desc: 'بيع ملفات، دورات، كتب إلكترونية مع إمكانية إضافة رقم CCP/بريدي موب الخاص بك للدفع المباشر.' },
    { icon: <Sliders size={18} />, title: 'تخصيص كامل', desc: 'تعديل الألوان، الخطوط العربية، الخلفيات، والبنرات الإعلانية بسهولة.' },
    { icon: <Video size={18} />, title: 'فيديو في البنر', desc: 'أضف فيديو من YouTube أو Google Drive ليظهر في واجهة متجرك.' },
    { icon: <Link2 size={18} />, title: 'تغيير رابط المتجر', desc: 'يمكنك تعديل رابط متجرك (URL) ليتناسب مع علامتك التجارية.' },
    { icon: <Layout size={18} />, title: '9 قوالب جاهزة', desc: 'اختر من بين 9 تصاميم احترافية ومتنوعة تناسب كل أنواع المنتجات.' },
  ];

  return (
    <div style={{ fontFamily: theme.font.base, direction: 'rtl', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* ─── الهيدر ────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 20px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'Amiri, serif', fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>
          إعلم<span style={{ color: '#2563eb' }}>.</span>
        </span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/login" style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>تسجيل الدخول</a>
          <a href="https://www.facebook.com/profile.php?id=61576048735334" target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Share2 size={16} /> ماسنجر
          </a>
          <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
            style={{ padding: '10px 22px', borderRadius: '50px', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff', transition: 'all 0.25s' }}
            onMouseEnter={(e) => { e.target.style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { e.target.style.background = '#2563eb'; }}
          >
            ابدأ متجرك
          </button>
        </div>
      </header>

      {/* ─── الهيرو ────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px 60px', textAlign: 'center', background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)' }}>
        <div style={{ display: 'inline-block', background: '#dbeafe', color: '#2563eb', padding: '6px 18px', borderRadius: '50px', fontSize: '12px', fontWeight: 700, marginBottom: '24px' }}>
          🚀 منصة التجارة الإلكترونية الأولى في الجزائر
        </div>
        <h1 style={{ fontFamily: 'Amiri, serif', fontSize: 'clamp(38px, 7vw, 72px)', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, marginBottom: '16px' }}>
          متجر إلكتروني <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg, #2563eb, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>احترافي</em><br />جاهز خلال 24 ساعة
        </h1>
        <div style={{ display: 'inline-block', background: '#d1fae5', color: '#059669', fontSize: '12px', fontWeight: 700, padding: '4px 14px', borderRadius: '50px', marginBottom: '16px' }}>
          <Clock size={14} style={{ display: 'inline', marginLeft: '4px' }} /> 18 يوم تجربة مجانية – جرب قبل أن تدفع
        </div>
        <div style={{ display: 'inline-block', background: '#fee2e2', color: '#ef4444', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '50px', marginRight: '8px' }}>
          🔥 المقاعد محدودة جداً – بادر بالحجز الآن
        </div>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#64748b', maxWidth: '580px', margin: '0 auto 40px', lineHeight: 1.8 }}>
          كل ما تحتاجه للبيع عبر الإنترنت — سلة شراء، دفع إلكتروني، توصيل للـ 69 ولاية، وإشعارات فورية لكل طلب.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
            style={{ padding: '15px 36px', borderRadius: '50px', fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(37,99,235,0.25)' }}>
            اختر باقتك الآن
          </button>
          <a href="https://www.facebook.com/profile.php?id=61576048735334" target="_blank" rel="noopener noreferrer"
            style={{ padding: '15px 36px', borderRadius: '50px', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '15px', border: '1.5px solid #cbd5e1', cursor: 'pointer', background: '#fff', color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <Share2 size={18} /> تواصل معنا
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0', marginTop: '64px', maxWidth: '500px', marginInline: 'auto', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', background: '#fff' }}>
          <div style={{ flex: 1, padding: '22px 16px', textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: '34px', fontWeight: 700, color: '#2563eb' }}>24</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>ساعة كحد أقصى للتسليم</div>
          </div>
          <div style={{ flex: 1, padding: '22px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: '34px', fontWeight: 700, color: '#2563eb' }}>69</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>ولاية مدعومة بالتوصيل</div>
          </div>
        </div>
      </section>

      {/* ─── المميزات ──────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: '#dbeafe', color: '#2563eb', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '50px', marginBottom: '12px' }}>المميزات</div>
        <h2 style={{ fontFamily: 'Amiri, serif', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 700, color: '#0f172a', lineHeight: 1.25, marginBottom: '14px' }}>كل ما تحتاجه في متجرك</h2>
        <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '480px', lineHeight: 1.8 }}>جميع الباقات تتضمن هذه الأدوات الاحترافية:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: '#fff', marginTop: '32px' }}>
          {features.map((feat, i) => (
            <div key={i} style={{ padding: '30px 24px', borderLeft: i % 2 === 0 && i < 14 ? '1px solid #e2e8f0' : 'none', borderBottom: i < 14 ? '1px solid #e2e8f0' : 'none', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>{feat.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{feat.title}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── الباقات ───────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 20px', maxWidth: '1100px', margin: '0 auto' }} id="pricing">
        <div style={{ display: 'inline-block', background: '#dbeafe', color: '#2563eb', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '50px', marginBottom: '12px' }}>الأسعار</div>
        <h2 style={{ fontFamily: 'Amiri, serif', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 700, color: '#0f172a', lineHeight: 1.25, marginBottom: '14px' }}>اختر باقتك المناسبة</h2>
        <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '480px', lineHeight: 1.8 }}>جميع الباقات تشمل متجراً كاملاً مع لوحة تحكم — ابدأ فوراً.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '40px' }}>
          {/* ─── الباقة المجانية ────────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1.5px solid #059669', borderRadius: '16px', padding: '32px 24px', textAlign: 'center', position: 'relative', transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ position: 'absolute', top: '-13px', insetInline: '32px', background: '#059669', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '5px 16px', borderRadius: '50px' }}>✨ عرض خاص</div>
            <p style={{ fontFamily: 'Amiri, serif', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>تجربة مجانية ✨</p>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: '52px', fontWeight: 700, color: '#0f172a', lineHeight: 1, margin: '16px 0 4px' }}>0 <sub style={{ fontSize: '18px', color: '#64748b', fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>دج</sub></div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>لمدة 18 يوم – بدون دفع مسبق</p>
            <ul style={{ listStyle: 'none', textAlign: 'right', borderTop: '1px solid #e2e8f0', marginBottom: '24px', padding: 0 }}>
              {['كل مميزات الباقة العادية', 'متجر كامل مع سلة ودفع', 'توصيل للـ 69 ولاية', 'لوحة تحليلات وFacebook Pixel', 'أكواد الخصم وصفحة منتج متطورة', 'TikTok Pixel والتحكم بالمخزون', 'منتجات رقمية مع إمكانية إضافة رقم CCP/بريدي موب'].map((item, i) => (
                <li key={i} style={{ padding: '11px 0', borderBottom: i < 6 ? '1px solid #e2e8f0' : 'none', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#10b981', fontSize: '12px', flexShrink: 0 }}>✔</span> {item}
                </li>
              ))}
              <li style={{ padding: '11px 0', fontSize: '13px', fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', flexShrink: 0 }}>🕐</span> بدون أي التزام – جرب ثم قرر
              </li>
            </ul>
            <button onClick={() => selectPlan('free')}
              style={{ width: '100%', padding: '14px', borderRadius: '50px', fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: '14px', border: '1.5px solid #059669', cursor: 'pointer', background: '#059669', color: '#fff', transition: 'all 0.25s' }}
              onMouseEnter={(e) => { e.target.style.background = '#047857'; }}
              onMouseLeave={(e) => { e.target.style.background = '#059669'; }}>
              اطلب المتجر مجاناً
            </button>
          </div>

          {/* ─── الباقة المدفوعة ────────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1.5px solid #2563eb', borderRadius: '16px', padding: '32px 24px', textAlign: 'center', position: 'relative', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(37,99,235,0.08)' }}>
            <div style={{ position: 'absolute', top: '-13px', insetInline: '32px', background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '5px 16px', borderRadius: '50px' }}>⭐ مدفوع</div>
            <p style={{ fontFamily: 'Amiri, serif', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>باقة مدفوعة</p>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: '52px', fontWeight: 700, color: '#0f172a', lineHeight: 1, margin: '16px 0 4px' }}>600 <sub style={{ fontSize: '18px', color: '#64748b', fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>دج/شهر</sub></div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>شهري – مع وصل الدفع</p>
            <ul style={{ listStyle: 'none', textAlign: 'right', borderTop: '1px solid #e2e8f0', marginBottom: '24px', padding: 0 }}>
              {['كل مميزات العادي', 'متجر كامل مع سلة ودفع', 'توصيل للـ 69 ولاية', 'لوحة تحليلات', 'Facebook Pixel', 'تخصيص كامل', 'أكواد الخصم', 'صفحة منتج مع ألوان', 'TikTok Pixel', 'التحكم بالمخزون', 'منتجات رقمية + رقم CCP/بريدي موب'].map((item, i) => (
                <li key={i} style={{ padding: '11px 0', borderBottom: i < 10 ? '1px solid #e2e8f0' : 'none', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#10b981', fontSize: '12px', flexShrink: 0 }}>✔</span> {item}
                </li>
              ))}
            </ul>
            <button onClick={() => selectPlan('paid')}
              style={{ width: '100%', padding: '14px', borderRadius: '50px', fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: '14px', border: '1.5px solid #2563eb', cursor: 'pointer', background: '#2563eb', color: '#fff', transition: 'all 0.25s' }}
              onMouseEnter={(e) => { e.target.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { e.target.style.background = '#2563eb'; }}>
              اشتر الآن
            </button>
          </div>
        </div>
      </section>

      {/* ─── نموذج التسجيل ────────────────────────────────────────────── */}
      <section id="register-form" style={{ padding: '40px 20px 60px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontFamily: 'Amiri, serif', fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>🚀 أنشئ متجرك الآن</h2>
          <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '24px' }}>
            {form.plan === 'free' ? 'املأ البيانات وسنقوم بإنشاء متجرك خلال 24 ساعة (تجربة مجانية 18 يوم)' : 'املأ البيانات وارفع وصل الدفع وسنقوم بمراجعة طلبك وتفعيل متجرك'}
          </p>

          {result && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: result.success ? '#d1fae5' : '#fee2e2', border: `1px solid ${result.success ? '#6ee7b7' : '#fca5a5'}`, marginBottom: '20px' }}>
              <p style={{ margin: 0, color: result.success ? '#065f46' : '#991b1b', fontSize: '14px' }}>{result.message}</p>
              {result.success && result.data && result.data.storeSlug && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#065f46', background: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '6px' }}>
                  <div><strong>البريد:</strong> {result.data.email}</div>
                  <div><strong>اسم المتجر:</strong> {result.data.storeName}</div>
                  {result.data.trialEndFormatted && <div><strong>نهاية التجربة:</strong> {result.data.trialEndFormatted}</div>}
                  {result.data.storeUrl && <div><strong>رابط المتجر:</strong> <a href={result.data.storeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>{result.data.storeUrl}</a></div>}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: form.plan === 'free' ? '#d1fae5' : '#dbeafe', padding: '10px 16px', borderRadius: '10px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: form.plan === 'free' ? '#065f46' : '#1e40af' }}>
              {form.plan === 'free' ? '🆓 باقة مجانية (تجربة 18 يوم)' : '💳 باقة مدفوعة (600 دج/شهر)'}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>البريد الإلكتروني *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} color="#94a3b8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@gmail.com"
                  style={{ width: '100%', padding: '12px 42px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Cairo, sans-serif', fontSize: '14px', background: '#f9fafb', direction: 'ltr' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>كلمة المرور *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} color="#94a3b8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="•••••••• (6 أحرف على الأقل)"
                  style={{ width: '100%', padding: '12px 42px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Cairo, sans-serif', fontSize: '14px', background: '#f9fafb', direction: 'ltr' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>اسم المتجر *</label>
              <div style={{ position: 'relative' }}>
                <Store size={17} color="#94a3b8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" required value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder="متجري الإلكتروني"
                  style={{ width: '100%', padding: '12px 42px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Cairo, sans-serif', fontSize: '14px', background: '#f9fafb' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>اسمك (اختياري)</label>
              <div style={{ position: 'relative' }}>
                <User size={17} color="#94a3b8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} placeholder="أحمد محمد"
                  style={{ width: '100%', padding: '12px 42px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Cairo, sans-serif', fontSize: '14px', background: '#f9fafb' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>رقم الهاتف (اختياري)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={17} color="#94a3b8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0555 123 456"
                  style={{ width: '100%', padding: '12px 42px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Cairo, sans-serif', fontSize: '14px', background: '#f9fafb', direction: 'ltr' }} />
              </div>
            </div>

            {form.plan === 'paid' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>وصل الدفع * <span style={{ fontSize: '11px', color: '#ef4444', marginRight: '6px' }}>(مطلوب للباقة المدفوعة)</span></label>
                <div style={{ border: `2px dashed ${fileError ? '#ef4444' : file ? '#10b981' : '#cbd5e1'}`, borderRadius: '10px', padding: '20px', textAlign: 'center', background: file ? '#f0fdf4' : '#f9fafb', position: 'relative', transition: 'all 0.2s' }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#2563eb'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = file ? '#10b981' : '#cbd5e1'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = e.dataTransfer.files[0];
                    if (dropped) {
                      const input = fileInputRef.current;
                      const dt = new DataTransfer();
                      dt.items.add(dropped);
                      input.files = dt.files;
                      handleFileChange({ target: input });
                    }
                  }}>
                  <input type="file" ref={fileInputRef} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  {file ? (
                    <div>
                      <FileText size={32} color="#10b981" style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{file.name}</p>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>{(file.size / 1024).toFixed(1)} كيلوبايت</p>
                      <button type="button" onClick={removeFile} style={{ marginTop: '8px', background: '#fee2e2', border: 'none', padding: '4px 16px', borderRadius: '6px', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>إزالة</button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} color={fileError ? '#ef4444' : '#94a3b8'} style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '13px', color: fileError ? '#ef4444' : '#64748b' }}>{fileError || 'اسحب الملف هنا أو انقر للاختيار'}<br /><span style={{ fontSize: '11px', opacity: 0.7 }}>PDF أو صورة — أقصى حجم 5 ميغا</span></p>
                    </div>
                  )}
                </div>
                {fileError && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{fileError}</p>}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: '#2563eb' }} required />
              <label style={{ fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                أوافق على <button type="button" onClick={() => setShowTerms(!showTerms)} style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>الشروط والأحكام</button> وسياسة الاستخدام *
              </label>
            </div>

            {showTerms && (
              <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569', lineHeight: 1.8 }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>اتفاقية شروط الخدمة</h4>
                <p><strong>1. طبيعة الخدمة:</strong> المنصة تقدم خدمة استضافة متاجر إلكترونية فقط، ولا تتدخل في محتوى المتجر أو منتجاته.</p>
                <p><strong>2. التزامات العميل:</strong> يتحمل العميل المسؤولية الكاملة عن منتجاته، أسعاره، ومحتواه، ويجب عليه الالتزام بالقوانين الجزائرية.</p>
                <p><strong>3. التجربة المجانية:</strong> 18 يوم مجاناً، بعدها يمكن الاشتراك في باقة مدفوعة للاستمرار.</p>
                <p><strong>4. عدم الاسترداد:</strong> المبالغ المدفوعة للاشتراكات غير قابلة للاسترداد بعد التفعيل.</p>
                <p><strong>5. إخلاء المسؤولية:</strong> المنصة غير مسؤولة عن أي خسائر أو أضرار ناتجة عن استخدام المتجر.</p>
                <p><strong>6. التعاون مع السلطات:</strong> في حال طلبت الجهات الرسمية بيانات العميل، تلتزم المنصة بتقديمها.</p>
                <button type="button" onClick={() => setShowTerms(false)} style={{ marginTop: '10px', padding: '6px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>إغلاق</button>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '15px', borderRadius: '50px', fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? '#94a3b8' : (form.plan === 'free' ? '#059669' : '#2563eb'), color: '#fff', transition: 'all 0.25s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? <Loader2 size={20} style={{ animation: 'spin 0.9s linear infinite' }} /> : <Check size={20} />}
              {loading ? 'جاري الإنشاء...' : form.plan === 'free' ? 'إنشاء متجري مجاناً' : 'إرسال طلب الباقة المدفوعة'}
            </button>
          </form>
        </div>
      </section>

      {/* ─── الفوتر ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: '#fff' }}>
        <span style={{ fontFamily: 'Amiri, serif', fontSize: '20px', fontWeight: 700 }}>إعلم<span style={{ color: '#2563eb' }}>.</span></span>
        <p style={{ fontSize: '12px', color: '#64748b' }}>© 2026 منصة إعلم للمتاجر الإلكترونية — جميع الحقوق محفوظة</p>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
