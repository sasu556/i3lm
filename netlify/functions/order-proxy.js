// netlify/functions/order-proxy.js
const { createClient } = require('@supabase/supabase-js');

// تهيئة عميل Supabase من متغيرات البيئة
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  // رؤوس CORS للسماح بطلبات من أي نطاق (أو من نطاقات محددة)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // معالجة طلب Preflight (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // فقط طلبات POST مسموحة
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // استخراج storeSlug من جسم الطلب
    const body = JSON.parse(event.body);
    const { storeSlug, ...orderData } = body;

    if (!storeSlug) {
      throw new Error('storeSlug مطلوب في الطلب');
    }

    // جلب google_script_url الخاص بالمتجر من قاعدة البيانات
    const { data: store, error } = await supabase
      .from('stores')
      .select('google_script_url')
      .eq('store_slug', storeSlug)
      .single();

    if (error || !store || !store.google_script_url) {
      throw new Error('لم يتم العثور على رابط Google Script لهذا المتجر');
    }

    // إعادة توجيه الطلب إلى Google Apps Script
    const response = await fetch(store.google_script_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers,
      body: data,
    };
  } catch (error) {
    console.error('خطأ في الوكيل:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};