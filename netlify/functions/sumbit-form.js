// netlify/functions/submit-form.js
const { createClient } = require('@supabase/supabase-js');

// ─── متغيرات البيئة ──────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const APP_URL = process.env.APP_URL || 'https://yourdomain.com';

// ─── دالة التحقق من صحة البريد الإلكتروني ──────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── دالة توليد slug فريد ──────────────────────────────────────────────
const generateSlug = (email, storeName) => {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
  const random = Date.now().toString(36).slice(-6);
  const name = storeName.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '-').slice(0, 20);
  return `${base}-${name || 'store'}-${random}`;
};

// ─── المعالج الرئيسي ─────────────────────────────────────────────────────
exports.handler = async (event) => {
  // ─── إعدادات CORS ────────────────────────────────────────────────────
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // ─── معالجة طلب OPTIONS (CORS) ──────────────────────────────────────
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // ─── التحقق من طريقة الطلب ──────────────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    // ─── التحقق من متغيرات البيئة ──────────────────────────────────────
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ متغيرات البيئة SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير مضبوطة');
      throw new Error('تكوين الخادم غير مكتمل. يرجى التواصل مع الدعم الفني.');
    }

    // ─── إنشاء عميل Supabase ────────────────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ─── قراءة البيانات من الطلب ──────────────────────────────────────
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (parseError) {
      console.error('❌ خطأ في تحليل JSON:', parseError.message);
      throw new Error('بيانات الطلب غير صالحة');
    }

    console.log('📩 استلام طلب جديد:', {
      plan: data.plan,
      email: data.email,
      store_name: data.store_name,
    });

    // ─── استخراج البيانات ──────────────────────────────────────────────
    const plan         = data.plan || 'free';
    const email        = data.email?.trim() || '';
    const password     = data.password?.trim() || '';
    const phone        = data.phone?.trim() || null;
    const storeName    = data.store_name?.trim() || 'متجري';
    const adminName    = data.admin_name?.trim() || storeName;
    const notes        = data.notes?.trim() || '';
    const fileBase64   = data.file_base64 || null;
    const fileName     = data.file_name || 'receipt.pdf';
    const fileType     = data.file_type || 'application/pdf';
    const termsAccepted = data.terms_accepted === true;

    // ─── التحقق من صحة البيانات ────────────────────────────────────────
    if (!email) {
      throw new Error('البريد الإلكتروني مطلوب');
    }
    if (!isValidEmail(email)) {
      throw new Error('البريد الإلكتروني غير صحيح');
    }
    if (!password || password.length < 6) {
      throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }
    if (!storeName) {
      throw new Error('اسم المتجر مطلوب');
    }
    if (!termsAccepted) {
      throw new Error('يجب الموافقة على الشروط والأحكام');
    }
    if (plan === 'paid' && !fileBase64) {
      throw new Error('يجب رفع وصل الدفع للباقة المدفوعة');
    }

    // ─── التحقق من عدم وجود بريد مكرر ──────────────────────────────────
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('admin_email')
      .eq('admin_email', email)
      .maybeSingle();

    if (checkError) {
      console.warn('⚠️ خطأ في التحقق من البريد المكرر:', checkError.message);
      // لا نوقف العملية، نكمل
    }
    if (existingStore) {
      throw new Error('هذا البريد الإلكتروني مستخدم بالفعل في متجر آخر');
    }

    // ─── حساب التواريخ ──────────────────────────────────────────────────
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 18); // 18 يوم تجربة

    let planType = 'مجاني';
    let status = 'trial';
    let subscriptionStart = null;
    let subscriptionEnd = null;
    let lastPaymentDate = null;

    if (plan === 'free') {
      planType = 'مجاني';
      status = 'trial';
    } else if (plan === 'paid') {
      planType = 'مدفوع';
      status = 'pending_payment';
      // الباقة المدفوعة تنتظر التفعيل من المسؤول
    } else {
      throw new Error(`نوع الباقة "${plan}" غير معروف`);
    }

    // ─── 1. إنشاء حساب المستخدم في Supabase Auth ──────────────────────
    console.log('🔐 جاري إنشاء حساب المستخدم...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        phone: phone,
        plan: planType,
      },
    });

    if (authError) {
      console.error('❌ فشل إنشاء حساب Auth:', authError.message);
      throw new Error(`فشل إنشاء الحساب: ${authError.message}`);
    }

    if (!authData || !authData.user) {
      throw new Error('فشل إنشاء الحساب: لم يتم إرجاع بيانات المستخدم');
    }

    const userId = authData.user.id;
    console.log(`✅ تم إنشاء حساب المستخدم: ${userId}`);

    // ─── 2. إنشاء المتجر في جدول stores ──────────────────────────────
    const storeSlug = generateSlug(email, storeName);
    console.log(`🏪 جاري إنشاء المتجر: ${storeSlug}`);

    const { error: storeError } = await supabase.from('stores').insert([{
      user_id: userId,
      store_name: storeName,
      store_slug: storeSlug,
      admin_email: email,
      admin_password: password,
      admin_name: adminName,
      phone: phone,
      plan: planType,
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      subscription_start: subscriptionStart,
      subscription_end: subscriptionEnd,
      last_payment_date: lastPaymentDate,
      status: status,
      notes: notes || null,
      primary_color: '#4f46e5',
      bg_color: '#f9fafb',
      font_family: 'system-ui',
      banner_urls: [],
      template_settings: {
        templateId: 'default',
        fonts: { heading: 'system-ui', body: 'system-ui' },
        colors: { primary: '#4f46e5', background: '#f8fafc' },
        layout: { cardStyle: 'rounded', productGrid: '3cols' },
      },
    }]);

    if (storeError) {
      console.error('❌ فشل إنشاء المتجر:', storeError.message);
      throw new Error(`فشل إنشاء المتجر: ${storeError.message}`);
    }
    console.log(`✅ تم إنشاء المتجر بنجاح: ${storeSlug}`);

    // ─── 3. إرسال الإشعار إلى Google Apps Script (للمسؤول) ─────────────
    let notificationResult = { success: true, message: 'تم الإرسال' };
    if (GOOGLE_SCRIPT_URL) {
      try {
        console.log('📧 جاري إرسال الإشعار إلى Google Script...');
        const notifyResponse = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: planType,
            is_free_trial: plan === 'free',
            email,
            password,
            phone,
            store_name: storeName,
            admin_name: adminName,
            notes,
            file_base64: fileBase64,
            file_name: fileName,
            file_type: fileType,
            terms_accepted: termsAccepted,
            user_id: userId,
            store_slug: storeSlug,
          }),
        });
        notificationResult = await notifyResponse.json();
        console.log('✅ تم إرسال الإشعار بنجاح');
      } catch (notifyErr) {
        console.error('⚠️ فشل إرسال الإشعار إلى Google Script:', notifyErr.message);
        // لا نوقف العملية إذا فشل الإشعار
        notificationResult = { success: false, error: notifyErr.message };
      }
    } else {
      console.warn('⚠️ GOOGLE_SCRIPT_URL غير مضبوط، لن يتم إرسال الإشعارات');
    }

    // ─── 4. تسجيل الدخول التلقائي (للباقة المجانية فقط) ──────────────
    let loginData = null;
    let loginError = null;
    if (plan === 'free') {
      try {
        console.log('🔓 جاري تسجيل الدخول التلقائي...');
        const { data: login, error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          loginError = err;
          console.warn('⚠️ فشل تسجيل الدخول التلقائي:', err.message);
        } else {
          loginData = login;
          console.log('✅ تم تسجيل الدخول التلقائي');
        }
      } catch (err) {
        loginError = err;
        console.warn('⚠️ خطأ في تسجيل الدخول التلقائي:', err.message);
      }
    }

    // ─── 5. الرد على العميل ─────────────────────────────────────────────
    const responseData = {
      success: true,
      message: plan === 'free'
        ? '✅ تم إنشاء متجرك بنجاح! يتم توجيهك إلى لوحة التحكم...'
        : '✅ تم استلام طلب الباقة المدفوعة، سنقوم بمراجعته وتفعيله قريباً.',
      data: {
        email,
        storeName,
        storeSlug,
        userId,
        plan: planType,
        trialEnd: trialEnd.toISOString(),
        trialEndFormatted: trialEnd.toLocaleDateString('ar-EG'),
        status: status,
        isFreeTrial: plan === 'free',
        dashboardUrl: APP_URL,
        storeUrl: `${APP_URL}/${storeSlug}`,
      },
      notification: notificationResult,
    };

    // إذا كان تسجيل الدخول التلقائي ناجحاً، نرسل الجلسة
    if (loginData) {
      responseData.session = loginData.session;
    }
    if (loginError) {
      responseData.loginError = loginError.message;
    }

    console.log('✅ تم الانتهاء من معالجة الطلب بنجاح');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData),
    };

  } catch (error) {
    // ─── معالجة الأخطاء ──────────────────────────────────────────────────
    console.error('❌ خطأ عام في المعالج:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        code: 'INTERNAL_ERROR',
      }),
    };
  }
};