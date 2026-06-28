// netlify/functions/submit-form.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('متغيرات Supabase غير مضبوطة');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data = JSON.parse(event.body);

    const { plan, email, password, phone, store_name, admin_name, notes, file_base64, file_name, file_type, terms_accepted } = data;

    if (!email || !password) throw new Error('البريد وكلمة المرور مطلوبان');
    if (!terms_accepted) throw new Error('يجب الموافقة على الشروط');
    if (plan === 'paid' && !file_base64) throw new Error('يجب رفع وصل الدفع');

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 18);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        full_name: admin_name || store_name,
        phone: phone || null,
        plan: plan === 'free' ? 'مجاني' : 'مدفوع',
      },
    });

    if (authError) throw new Error(`فشل إنشاء الحساب: ${authError.message}`);
    const userId = authData.user.id;

    const storeSlug = email.split('@')[0] + '-' + Date.now().toString(36).slice(-6);
    const { error: storeError } = await supabase.from('stores').insert([{
      user_id: userId,
      store_name: store_name.trim(),
      store_slug: storeSlug,
      admin_email: email.trim(),
      admin_password: password.trim(),
      admin_name: admin_name || store_name,
      phone: phone || null,
      plan: plan === 'free' ? 'مجاني' : 'مدفوع',
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      status: plan === 'free' ? 'trial' : 'pending_payment',
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

    if (storeError) throw new Error(`فشل إنشاء المتجر: ${storeError.message}`);

    let notificationResult = { success: true };
    if (GOOGLE_SCRIPT_URL) {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: plan === 'free' ? 'مجاني' : 'مدفوع',
            is_free_trial: plan === 'free',
            email: email.trim(),
            password: password.trim(),
            phone: phone || '',
            store_name: store_name.trim(),
            admin_name: admin_name || store_name,
            notes: notes || '',
            file_base64: file_base64 || null,
            file_name: file_name || '',
            file_type: file_type || '',
            terms_accepted,
            user_id: userId,
            store_slug: storeSlug,
          }),
        });
        const result = await response.text();
        try {
          notificationResult = JSON.parse(result);
        } catch (e) {
          notificationResult = { success: false, error: 'Google Script returned non-JSON', raw: result };
        }
      } catch (err) {
        notificationResult = { success: false, error: err.message };
      }
    }

    let loginData = null;
    if (plan === 'free') {
      const { data: login, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (!loginError) loginData = login;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: plan === 'free'
          ? '✅ تم إنشاء متجرك بنجاح! يتم توجيهك إلى لوحة التحكم...'
          : '✅ تم استلام طلب الباقة المدفوعة، سنقوم بمراجعته وتفعيله قريباً.',
        data: {
          email: email.trim(),
          storeName: store_name.trim(),
          storeSlug,
          userId,
          plan: plan === 'free' ? 'مجاني' : 'مدفوع',
          trialEnd: trialEnd.toISOString(),
          trialEndFormatted: trialEnd.toLocaleDateString('ar-EG'),
          status: plan === 'free' ? 'trial' : 'pending_payment',
          storeUrl: `${process.env.APP_URL || 'https://storesdz.netlify.app'}/${storeSlug}`,
        },
        notification: notificationResult,
        session: loginData?.session || null,
      }),
    };

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
