import { createClient } from '@supabase/supabase-js';

// تم استخدام التعليق الصحيح هنا لضمان عمل الرابط بسلاسة
const supabaseUrl = 'https://pqiyiajfgetstxadyecm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaXlpYWpmZ2V0c3R4YWR5ZWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTg2MzYsImV4cCI6MjA5NzM3NDYzNn0.aul1pJyJFA8Fr5XrludoRf6Bx8Gp5af921lj8WUwVQ8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabaseUrl, supabaseAnonKey };  // <--- أضف هذا السطر