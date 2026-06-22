// netlify/functions/order-proxy.js
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // رؤوس CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // قراءة البيانات من الطلب
    const body = JSON.parse(event.body);
    const { storeSlug, ...orderData } = body;

    if (!storeSlug) {
      throw new Error('storeSlug مطلوب في الطلب');
    }

    // تهيئة عميل Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('متغيرات Supabase غير مضبوطة في البيئة');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // جلب google_script_url من قاعدة البيانات
    const { data: store, error } = await supabase
      .from('stores')
      .select('google_script_url')
      .eq('store_slug', storeSlug)
      .single();

    if (error) {
      console.error('خطأ في جلب المتجر:', error);
      throw new Error(`فشل جلب المتجر: ${error.message}`);
    }

    if (!store || !store.google_script_url) {
      console.warn(`⚠️ لا يوجد google_script_url للمتجر: ${storeSlug}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'لم يتم العثور على رابط Google Script لهذا المتجر' 
        }),
      };
    }

    // إعادة توجيه الطلب إلى Google Apps Script
    const response = await fetch(store.google_script_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
