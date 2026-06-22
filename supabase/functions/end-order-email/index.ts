import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── هذه الدالة تستخدم مفاتيح Resend المخزنة في جدول المتجر ────────────
Deno.serve(async (req) => {
  try {
    const { orderId, storeSlug } = await req.json();
    if (!orderId || !storeSlug) {
      return new Response(JSON.stringify({ error: 'orderId و storeSlug مطلوبان' }), { status: 400 });
    }

    // إنشاء عميل Supabase (بصلاحية الخدمة لتجاوز RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. جلب بيانات الطلب
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'الطلب غير موجود' }), { status: 404 });
    }

    // 2. جلب بيانات المتجر (بما فيها resend_api_key و sender_email)
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('store_name, admin_email, resend_api_key, sender_email')
      .eq('store_slug', storeSlug)
      .single();
    if (storeError || !store) {
      return new Response(JSON.stringify({ error: 'المتجر غير موجود' }), { status: 404 });
    }

    // 3. التحقق من وجود المفاتيح
    if (!store.resend_api_key || !store.sender_email) {
      return new Response(
        JSON.stringify({ error: 'الرجاء إدخال مفتاح Resend API والبريد المرسل في إعدادات المتجر' }),
        { status: 400 }
      );
    }

    // 4. بناء قالب الإيميل
    const itemsHtml = order.items.map((item: any) => `
      <tr>
        <td>${item.title}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:left;">${Number(item.price).toLocaleString()} د.ج</td>
        <td style="text-align:left;">${Number(item.price * item.quantity).toLocaleString()} د.ج</td>
      </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"></head>
    <body style="font-family:sans-serif;background:#f8fafc;padding:20px;">
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:24px;">
        <h1 style="color:#0f172a;">🛍️ طلب جديد</h1>
        <p style="color:#64748b;">من متجر: ${store.store_name}</p>
        <hr>
        <div><strong>الزبون:</strong> ${order.customer_name}</div>
        <div><strong>الهاتف:</strong> ${order.customer_phone}</div>
        <div><strong>البريد:</strong> ${order.customer_email || '—'}</div>
        <div><strong>الولاية:</strong> ${order.wilaya || '—'}</div>
        <div><strong>العنوان:</strong> ${order.customer_address}</div>
        ${order.file_url ? `<div><strong>الملف المرفوع:</strong> <a href="${order.file_url}" target="_blank">تحميل</a></div>` : ''}
        <h3>المنتجات</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th>المنتج</th><th>العدد</th><th>السعر</th><th>المجموع</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="font-size:18px;font-weight:bold;margin-top:16px;">الإجمالي: ${Number(order.total_price).toLocaleString()} د.ج</div>
        <hr>
        <div style="text-align:center;color:#94a3b8;font-size:12px;">تم إرسال هذا الإيميل تلقائياً من متجرك.</div>
      </div>
    </body>
    </html>
    `;

    // 5. إرسال الإيميل عبر Resend باستخدام مفاتيح البائع
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${store.resend_api_key}`,
      },
      body: JSON.stringify({
        from: store.sender_email,
        to: store.admin_email || store.sender_email, // إذا لم يكن admin_email موجوداً نرسل إلى sender_email
        subject: `طلب جديد #${orderId.slice(0, 8)} من ${store.store_name}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});