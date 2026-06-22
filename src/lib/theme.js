export const theme = {
  colors: {
    bg: '#f8fafc',
    surface: '#ffffff',
    border: '#e5e7eb',
    borderSoft: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    textSubtle: '#94a3b8',
    primary: '#0f172a',
    primaryHover: '#1e293b',
    accent: '#3b82f6',
    accentSoft: '#eff6ff',
    danger: '#dc2626',
    dangerSoft: '#fef2f2',
    success: '#059669',
    successSoft: '#ecfdf5',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    pill: '9999px',
  },
  shadow: {
    xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
    sm: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
    xl: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
  },
  font: {
    base: "'Inter', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.sm,
  backgroundColor: theme.colors.surface,
  color: theme.colors.text,
  fontSize: '14px',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: theme.transition,
  outline: 'none',
};

export const labelStyle = {
  display: 'block',
  marginBottom: '7px',
  fontSize: '13px',
  fontWeight: 600,
  color: theme.colors.text,
};

export const cardStyle = {
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius.lg,
  border: `1px solid ${theme.colors.borderSoft}`,
  boxShadow: theme.shadow.sm,
};