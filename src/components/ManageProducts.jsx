import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { theme, inputStyle, labelStyle, cardStyle } from '../lib/theme';
import {
  Plus, Tag, DollarSign, Image as ImageIcon, FileText,
  Package, Trash2, Loader as Loader2, Boxes, FolderOpen,
  ChevronDown, ChevronUp, X, Palette, PlusCircle, Edit2, Save, RefreshCw,
} from 'lucide-react';

// ─── Toggle Switch ──────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        width: '40px', height: '22px', flexShrink: 0,
        borderRadius: '9999px', border: 'none', padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: checked ? theme.colors.success : theme.colors.border,
        transition: 'background-color 0.2s cubic-bezier(0.4,0,0.2,1)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '21px' : '3px',
        width: '16px', height: '16px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
        display: 'block',
      }} />
    </button>
  );
}

// ─── Category Manager Panel ─────────────────────────────────────────────────
function CategoryManager({ storeSlug, categories, onCategoriesChange }) {
  const [newCatName, setNewCatName] = useState('');
  const [adding, setAdding]         = useState(false);
  const [deleting, setDeleting]     = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ store_slug: storeSlug, name }])
        .select()
        .single();
      if (error) throw error;
      onCategoriesChange([...categories, data]);
      setNewCatName('');
    } catch (err) {
      alert(`فشل إضافة التصنيف: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`حذف تصنيف "${cat.name}"؟ لن يُحذف المنتجات المرتبطة به.`)) return;
    setDeleting(cat.id);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', cat.id);
      if (error) throw error;
      onCategoriesChange(categories.filter(c => c.id !== cat.id));
    } catch (err) {
      alert(`فشل الحذف: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {categories.length === 0 ? (
        <p style={{ margin: 0, fontSize: '13px', color: theme.colors.textSubtle, textAlign: 'center', padding: '12px 0' }}>
          لا توجد تصنيفات بعد — أضف أول تصنيف أدناه
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map(cat => (
            <span key={cat.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 10px 5px 6px',
              backgroundColor: theme.colors.accentSoft,
              color: theme.colors.accent,
              borderRadius: theme.radius.pill,
              fontSize: '13px', fontWeight: 600,
              border: `1px solid ${theme.colors.accent}22`,
            }}>
              {cat.name}
              <button
                onClick={() => handleDelete(cat)}
                disabled={deleting === cat.id}
                style={{
                  width: '18px', height: '18px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                  color: theme.colors.accent, borderRadius: '50%', padding: 0,
                  opacity: deleting === cat.id ? 0.4 : 0.7,
                }}
                aria-label={`حذف ${cat.name}`}
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FolderOpen size={15} color={theme.colors.textSubtle}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            placeholder="مثال: هواتف، ملابس، إلكترونيات..."
            maxLength={40}
            style={{ ...inputStyle, paddingRight: '36px', fontSize: '13px' }}
          />
        </div>
        <button
          type="submit"
          disabled={adding || !newCatName.trim()}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '0 16px', flexShrink: 0,
            backgroundColor: adding || !newCatName.trim() ? theme.colors.border : theme.colors.accent,
            color: adding || !newCatName.trim() ? theme.colors.textSubtle : '#fff',
            border: 'none', borderRadius: theme.radius.sm, cursor: adding || !newCatName.trim() ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 600, transition: theme.transition,
            height: '42px',
          }}
        >
          {adding
            ? <Loader2 size={14} style={{ animation: 'spin 0.9s linear infinite' }} />
            : <Plus size={14} />}
          إضافة
        </button>
      </form>
    </div>
  );
}

// ─── الأنماط المشتركة ──────────────────────────────────────────────────────
const inputWrapStyle = { position: 'relative' };
const iconRightStyle = {
  position: 'absolute', right: '12px', top: '50%',
  transform: 'translateY(-50%)', pointerEvents: 'none',
};

const iconWrap = (bg, color) => ({
  width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  backgroundColor: bg, color, borderRadius: theme.radius.sm, flexShrink: 0,
});

const emptyState = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', gap: '8px', padding: '48px 20px', textAlign: 'center',
};
const emptyText = { margin: 0, color: theme.colors.textSubtle, fontSize: '14px' };

const thumbStyle = {
  width: '48px', height: '48px', objectFit: 'cover', flex: '0 0 48px',
  borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.borderSoft}`,
};

const deleteBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '34px', height: '34px', flex: '0 0 34px',
  backgroundColor: theme.colors.dangerSoft, color: theme.colors.danger,
  border: 'none', borderRadius: theme.radius.sm, cursor: 'pointer',
  transition: theme.transition, flexShrink: 0,
};

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

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────────────
export default function ManageProducts({ storeSlug }) {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [catOpen,     setCatOpen]     = useState(false);
  const [togglingId,  setTogglingId]  = useState(null);
  const [editingId,   setEditingId]   = useState(null);

  // حالة النموذج
  const [title,       setTitle]       = useState('');
  const [price,       setPrice]       = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('physical');
  const [imageUrl,    setImageUrl]    = useState('');
  const [category,    setCategory]    = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // متغيرات الألوان
  const [colors, setColors] = useState([]);

  // ── جلب المنتجات والتصنيفات ──────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_slug', storeSlug)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      alert(`خطأ أثناء جلب المنتجات: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_slug', storeSlug)
        .order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('خطأ في جلب التصنيفات:', err.message);
    }
  }, [storeSlug]);

  // ── جلب ألوان المنتج ─────────────────────────────────────────────────────
  const fetchProductColors = async (productId) => {
    try {
      const { data, error } = await supabase
        .from('product_colors')
        .select('*')
        .eq('product_id', productId);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('خطأ في جلب الألوان:', err.message);
      return [];
    }
  };

  useEffect(() => {
    if (storeSlug) {
      fetchProducts();
      fetchCategories();
    }
  }, [storeSlug, fetchProducts, fetchCategories]);

  // ── إعادة تعيين النموذج ──────────────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setPrice('');
    setDescription('');
    setProductType('physical');
    setImageUrl('');
    setCategory('');
    setColors([]);
  };

  // ── بدء تعديل منتج ──────────────────────────────────────────────────────
  const startEdit = async (product) => {
    setEditingId(product.id);
    setTitle(product.title || '');
    setPrice(product.price?.toString() || '');
    setDescription(product.description || '');
    setProductType(product.is_digital ? 'digital' : 'physical');
    setImageUrl(product.image_url || '');
    setCategory(product.category || '');

    // جلب الألوان
    const productColors = await fetchProductColors(product.id);
    setColors(productColors.map(c => ({
      id: c.id,
      color_name: c.color_name || '',
      color_hex: c.color_hex || '#000000',
      image_url: c.image_url || '',
    })));
  };

  // ── إدارة الألوان ────────────────────────────────────────────────────────
  const addColor = () => {
    setColors([...colors, { color_name: '', color_hex: '#000000', image_url: '' }]);
  };

  const updateColor = (index, field, value) => {
    const newColors = [...colors];
    newColors[index][field] = value;
    setColors(newColors);
  };

  const removeColor = (index) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // ── حفظ المنتج (إضافة أو تحديث) ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // تصفية الألوان الفارغة
    const cleanColors = colors.filter(c => c.color_name.trim() !== '');

    try {
      const productData = {
        store_slug: storeSlug,
        title: title.trim(),
        price: parseFloat(price),
        description: description.trim(),
        product_type: productType,
        image_url: imageUrl.trim() || null,
        category: category || null,
        in_stock: true,
        is_digital: productType === 'digital',
      };

      let productId;

      if (editingId) {
        // ── تحديث منتج موجود ──
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId);
        if (updateError) throw updateError;
        productId = editingId;
      } else {
        // ── إضافة منتج جديد ──
        const { data, error: insertError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        if (insertError) throw insertError;
        productId = data.id;
      }

      // ── حفظ الألوان في جدول product_colors ──
      if (editingId) {
        // حذف الألوان القديمة
        await supabase
          .from('product_colors')
          .delete()
          .eq('product_id', editingId);
      }

      // إضافة الألوان الجديدة
      if (cleanColors.length > 0) {
        const colorInserts = cleanColors.map(c => ({
          product_id: productId,
          color_name: c.color_name.trim(),
          color_hex: c.color_hex || '#000000',
          image_url: c.image_url.trim() || null,
        }));
        const { error: colorError } = await supabase
          .from('product_colors')
          .insert(colorInserts);
        if (colorError) throw colorError;
      }

      alert(editingId ? '✅ تم تحديث المنتج بنجاح!' : '✅ تم إضافة المنتج بنجاح!');
      resetForm();
      fetchProducts();
    } catch (err) {
      alert(`❌ فشل حفظ المنتج: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  // ── حذف منتج ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return;
    try {
      // حذف الألوان المرتبطة أولاً
      await supabase
        .from('product_colors')
        .delete()
        .eq('product_id', id);

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(`فشل الحذف: ${err.message}`);
    }
  };

  // ── تبديل حالة التوفر ────────────────────────────────────────────────────
  const handleToggleStock = async (product) => {
    setTogglingId(product.id);
    const newVal = !product.in_stock;
    try {
      const { error } = await supabase
        .from('products')
        .update({ in_stock: newVal })
        .eq('id', product.id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, in_stock: newVal } : p));
    } catch (err) {
      alert(`فشل تحديث المخزون: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  // ─── العرض الرئيسي ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── مدير التصنيفات ── */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setCatOpen(o => !o)}
          style={{
            width: '100%', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
            textAlign: 'right',
          }}
        >
          <span style={iconWrap(catOpen ? theme.colors.accentSoft : theme.colors.bg, catOpen ? theme.colors.accent : theme.colors.text)}>
            <FolderOpen size={18} />
          </span>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: theme.colors.text }}>
              📂 إدارة التصنيفات
            </span>
            <span style={{ fontSize: '12px', color: theme.colors.textSubtle, marginRight: '8px' }}>
              ({categories.length} تصنيف)
            </span>
          </div>
          {catOpen
            ? <ChevronUp  size={18} color={theme.colors.textSubtle} />
            : <ChevronDown size={18} color={theme.colors.textSubtle} />}
        </button>

        {catOpen && (
          <div style={{ padding: '4px 20px 20px', borderTop: `1px solid ${theme.colors.borderSoft}` }}>
            <CategoryManager
              storeSlug={storeSlug}
              categories={categories}
              onCategoriesChange={setCategories}
            />
          </div>
        )}
      </div>

      {/* ── شبكة المنتجات (معدلة لتكون متجاوبة) ── */}
      <div
        className="products-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* نموذج إضافة/تعديل منتج */}
        <div style={{ ...cardStyle, padding: '22px' }} className="content-enter">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={iconWrap(theme.colors.accentSoft, theme.colors.accent)}>
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              </span>
              <h3 style={{ margin: 0, color: theme.colors.text, fontSize: '16px', fontWeight: 700 }}>
                {editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h3>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: theme.colors.text,
                }}
              >
                <X size={14} /> إلغاء التعديل
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* اسم المنتج */}
            <div>
              <label style={labelStyle}>اسم المنتج</label>
              <div style={inputWrapStyle}>
                <Tag size={15} color={theme.colors.textSubtle} style={iconRightStyle} />
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  placeholder="مثال: آيفون 15 برو ماكس"
                  style={{ ...inputStyle, paddingRight: '42px' }}
                />
              </div>
            </div>

            {/* السعر */}
            <div>
              <label style={labelStyle}>السعر (د.ج)</label>
              <div style={inputWrapStyle}>
                <DollarSign size={15} color={theme.colors.textSubtle} style={iconRightStyle} />
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  placeholder="245000"
                  style={{ ...inputStyle, paddingRight: '42px' }}
                />
              </div>
            </div>

            {/* نوع المنتج */}
            <div>
              <label style={labelStyle}>نوع المنتج</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={productType === 'digital'}
                  onChange={e => setProductType(e.target.checked ? 'digital' : 'physical')}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500, color: theme.colors.text }}>
                  {productType === 'digital' ? '📱 منتج رقمي (خدمة، ملف، إلخ)' : '📦 منتج مادي (شحن وتوصيل)'}
                </span>
              </div>
              <p style={{ margin: '5px 0 0', fontSize: '12px', color: theme.colors.textSubtle }}>
                {productType === 'digital' ? 'سيُطلب من الزبون إدخال بريد إلكتروني ورفع ملف عند الشراء.' : 'سيُطلب عنوان التوصيل.'}
              </p>
            </div>

            {/* التصنيف */}
            <div>
              <label style={labelStyle}>التصنيف</label>
              <div style={inputWrapStyle}>
                <FolderOpen size={15} color={theme.colors.textSubtle} style={iconRightStyle} />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '38px', backgroundColor: theme.colors.surface }}
                >
                  <option value="">— بدون تصنيف —</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              {categories.length === 0 && (
                <p style={{ margin: '5px 0 0', fontSize: '11px', color: theme.colors.textSubtle }}>
                  أضف تصنيفات من قسم "إدارة التصنيفات" أعلاه أولاً
                </p>
              )}
            </div>

            {/* رابط الصورة */}
            <div>
              <label style={labelStyle}>رابط صورة المنتج</label>
              <div style={inputWrapStyle}>
                <ImageIcon size={15} color={theme.colors.textSubtle} style={iconRightStyle} />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{ ...inputStyle, paddingRight: '42px', direction: 'ltr', textAlign: 'left' }}
                />
              </div>
            </div>

            {/* الوصف */}
            <div>
              <label style={labelStyle}>وصف المنتج</label>
              <div style={{ position: 'relative' }}>
                <FileText size={15} color={theme.colors.textSubtle}
                  style={{ position: 'absolute', right: '12px', top: '11px', pointerEvents: 'none' }} />
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  placeholder="التفاصيل والمواصفات..."
                  style={{ ...inputStyle, paddingRight: '36px', height: '80px', resize: 'vertical', textAlign: 'right' }}
                />
              </div>
            </div>

            {/* ── قسم الألوان ──────────────────────────────────────────────── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={labelStyle}>ألوان المنتج</label>
                <button
                  type="button"
                  onClick={addColor}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    backgroundColor: theme.colors.accentSoft,
                    color: theme.colors.accent,
                    border: `1px solid ${theme.colors.accent}44`,
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <PlusCircle size={14} /> إضافة لون
                </button>
              </div>

              {colors.length === 0 ? (
                <p style={{ margin: 0, fontSize: '12px', color: theme.colors.textSubtle, padding: '8px 0' }}>
                  لا توجد ألوان. أضف ألوانًا إذا كان المنتج متوفراً بأكثر من لون.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {colors.map((c, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      backgroundColor: theme.colors.bg, padding: '8px', borderRadius: '8px',
                      flexWrap: 'wrap',
                    }}>
                      <Palette size={14} color={theme.colors.textSubtle} style={{ flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder="اسم اللون (مثلاً: أحمر)"
                        value={c.color_name}
                        onChange={(e) => updateColor(idx, 'color_name', e.target.value)}
                        style={{ ...inputStyle, flex: '1 1 100px', padding: '6px 10px', fontSize: '13px', minWidth: '70px' }}
                      />
                      <input
                        type="color"
                        value={c.color_hex || '#000000'}
                        onChange={(e) => updateColor(idx, 'color_hex', e.target.value)}
                        style={{ width: '36px', height: '36px', padding: '2px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{ position: 'relative', flex: '2 1 150px', minWidth: '120px' }}>
                        <ImageIcon size={14} color={theme.colors.textSubtle}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="url"
                          placeholder="رابط صورة هذا اللون"
                          value={c.image_url}
                          onChange={(e) => updateColor(idx, 'image_url', e.target.value)}
                          style={{ ...inputStyle, paddingLeft: '8px', paddingRight: '28px', fontSize: '13px', direction: 'ltr', textAlign: 'left', width: '100%' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeColor(idx)}
                        style={{
                          width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: theme.colors.dangerSoft, color: theme.colors.danger,
                          border: 'none', borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={formLoading} style={primaryBtn(!!formLoading)}>
              {formLoading
                ? <Loader2 size={16} style={{ animation: 'spin 0.9s linear infinite' }} />
                : editingId ? <Save size={16} /> : <Plus size={16} />}
              {formLoading
                ? 'جاري الحفظ...'
                : editingId
                ? 'تحديث المنتج'
                : 'نشر المنتج في المتجر'}
            </button>
          </form>
        </div>

        {/* قائمة المنتجات الحالية */}
        <div style={{ ...cardStyle, padding: '22px', minHeight: '400px' }} className="content-enter">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={iconWrap(theme.colors.bg, theme.colors.text)}><Boxes size={18} /></span>
              <h3 style={{ margin: 0, color: theme.colors.text, fontSize: '16px', fontWeight: 700 }}>منتجاتك الحالية</h3>
            </div>
            <span style={{
              padding: '4px 12px', backgroundColor: theme.colors.accentSoft, color: theme.colors.accent,
              borderRadius: theme.radius.pill, fontSize: '12px', fontWeight: 700,
            }}>
              {products.length} منتج
            </span>
          </div>

          {loading ? (
            <div style={emptyState}>
              <Loader2 size={22} color={theme.colors.textSubtle} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={emptyText}>جاري التحميل...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={emptyState}>
              <Package size={34} color={theme.colors.textSubtle} />
              <p style={{ ...emptyText, fontWeight: 600, color: theme.colors.textMuted }}>لا توجد منتجات بعد</p>
              <p style={{ ...emptyText, fontSize: '13px' }}>أضف أول منتج باستخدام النموذج</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {products.map(product => (
                <ProductRow
                  key={product.id}
                  product={product}
                  toggling={togglingId === product.id}
                  onToggleStock={handleToggleStock}
                  onDelete={handleDelete}
                  onEdit={startEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .products-grid {
            grid-template-columns: 380px minmax(0, 1fr) !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ─── صف المنتج (مع زر تعديل) ──────────────────────────────────────────────
function ProductRow({ product, toggling, onToggleStock, onDelete, onEdit }) {
  const inStock = product.in_stock !== false;
  const [colorCount, setColorCount] = useState(0);

  useEffect(() => {
    const fetchColorCount = async () => {
      try {
        const { count, error } = await supabase
          .from('product_colors')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', product.id);
        if (error) throw error;
        setColorCount(count || 0);
      } catch (err) {
        console.error('خطأ في جلب عدد الألوان:', err.message);
      }
    };
    fetchColorCount();
  }, [product.id]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px', borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.borderSoft}`,
      backgroundColor: theme.colors.surface,
      transition: theme.transition,
      flexWrap: 'wrap',
    }}>
      {product.image_url ? (
        <img src={product.image_url} alt="" style={thumbStyle}
          onError={e => { e.target.src = 'https://placehold.co/50x50/f8fafc/94a3b8?text=📦'; }} />
      ) : (
        <div style={{ ...thumbStyle, backgroundColor: theme.colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={20} color={theme.colors.textSubtle} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: '120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <h4 style={{
            margin: 0, color: theme.colors.text, fontSize: '14px', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px',
          }}>
            {product.title}
          </h4>
          {product.category && (
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 7px',
              backgroundColor: theme.colors.accentSoft, color: theme.colors.accent,
              borderRadius: theme.radius.pill,
            }}>
              {product.category}
            </span>
          )}
          {product.is_digital && (
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 7px',
              backgroundColor: '#dbeafe', color: '#2563eb',
              borderRadius: theme.radius.pill,
            }}>
              📱 رقمي
            </span>
          )}
          {colorCount > 0 && (
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 7px',
              backgroundColor: '#ede9fe', color: '#7c3aed',
              borderRadius: theme.radius.pill,
            }}>
              🎨 {colorCount} ألوان
            </span>
          )}
        </div>
        <span style={{ color: theme.colors.accent, fontSize: '13px', fontWeight: 700 }}>
          {Number(product.price).toLocaleString('en-US')} د.ج
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
        <button
          onClick={() => onEdit(product)}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '34px', height: '34px',
            backgroundColor: theme.colors.accentSoft, color: theme.colors.accent,
            border: 'none', borderRadius: theme.radius.sm, cursor: 'pointer',
            transition: theme.transition,
          }}
          aria-label="تعديل المنتج"
          title="تعديل المنتج"
        >
          <Edit2 size={15} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <ToggleSwitch
            checked={inStock}
            onChange={() => onToggleStock(product)}
            disabled={toggling}
          />
          <span style={{
            fontSize: '10px', fontWeight: 700,
            color: inStock ? theme.colors.success : theme.colors.danger,
          }}>
            {toggling ? '...' : inStock ? 'متوفر' : 'نفذ'}
          </span>
        </div>

        <button onClick={() => onDelete(product.id)} style={deleteBtn} aria-label="حذف المنتج">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}