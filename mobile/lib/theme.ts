/**
 * Tokens de design — Iago Lanches 2 (Motoboy App)
 * Paleta: Preto, Dourado e Vermelho
 */

export const colors = {
  // Backgrounds
  background: '#0a0a0c',
  surface: '#141418',
  surfaceElevated: '#1e1e24',
  card: '#1a1a20',

  // Brand — Dourado
  gold: '#d4af37',
  goldLight: '#e5c158',
  goldMuted: '#b8962e',

  // Brand — Vermelho
  red: '#e63946',
  redDark: '#c1121f',

  // Texto
  textPrimary: '#f5f5f5',
  textSecondary: '#a0a0a8',
  textMuted: '#6b6b74',

  // Status
  statusAvailable: '#22c55e',
  statusEnRoute: '#d4af37',
  statusPaused: '#6b7280',

  // Utilitários
  white: '#ffffff',
  black: '#000000',
  border: '#2a2a32',
  overlay: 'rgba(10, 10, 12, 0.85)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
} as const;

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export type AppColors = typeof colors;
export type AppSpacing = typeof spacing;
