/**
 * Design Tokens & Theme - Iago Lanches 2
 * Paleta Oficial: Preto Profundo, Dourado Metálico e Vermelho Burguer.
 */

export const colors = {
  // Backgrounds escuros
  bgDark: '#0a0a0c',
  bgCard: '#141418',
  bgCardHover: '#1b1b22',
  bgElevated: '#202028',
  
  // Dourado (Acentos principais e botões de ação)
  gold: '#d4af37',
  goldLight: '#e5c158',
  goldDark: '#aa820a',
  goldMuted: 'rgba(212, 175, 55, 0.15)',
  
  // Vermelho (Burguer & Alertas)
  red: '#e63946',
  redDark: '#c1121f',
  redMuted: 'rgba(230, 57, 70, 0.18)',
  
  // Status
  success: '#10b981',
  warning: '#f59e0b',
  info: '#06b6d4',
  
  // Textos
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  
  // Bordas
  border: '#27272a',
  borderGold: 'rgba(212, 175, 55, 0.35)',
  borderRed: 'rgba(230, 57, 70, 0.35)',
};

export const typography = {
  titleLarge: { fontSize: 24, fontWeight: '900' as const, color: colors.textPrimary },
  titleMedium: { fontSize: 18, fontWeight: '700' as const, color: colors.textPrimary },
  body: { fontSize: 14, color: colors.textSecondary },
  caption: { fontSize: 12, color: colors.textMuted },
  badge: { fontSize: 11, fontWeight: '700' as const },
};
