// src/components/LandingPage.jsx
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
        {/* ... المحتوى ... */}
        {/* (تم حذف الهيرو والمميزات والباقات للاختصار، لكن الكود الكامل موجود في النسخة التي أعطيتها سابقاً) */}
      </section>

      {/* ─── الباقات ───────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 20px', maxWidth: '1100px', margin: '0 auto' }} id="pricing">
        {/* ... */}
      </section>

      {/* ─── نموذج التسجيل ────────────────────────────────────────────── */}
      <section id="register-form" style={{ padding: '40px 20px 60px', maxWidth: '700px', margin: '0 auto' }}>
        {/* ... */}
      </section>

      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: '#fff' }}>
        <span style={{ fontFamily: 'Amiri, serif', fontSize: '20px', fontWeight: 700 }}>إعلم<span style={{ color: '#2563eb' }}>.</span></span>
        <p style={{ fontSize: '12px', color: '#64748b' }}>© 2026 منصة إعلم للمتاجر الإلكترونية — جميع الحقوق محفوظة</p>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
