export const PALETA = {
  principal: '#4CAF50',
  principalDark: '#388E3C',
  danger: '#E53935',
  white: '#FFFFFF',
  black: '#121212',
  grayLight: '#F5F5F5',
  grayDark: '#1E1E1E',
  textLight: '#2E3A2F',
  textDark: '#E0E0E0',
  textSecondaryLight: '#889988',
  textSecondaryDark: '#AAAAAA',
  inactiveLight: '#C5E1A5',
  inactiveDark: '#555555'
};

export const THEME = {
  light: {
    background: '#F1F8E9', // Fondo verde muy suave
    card: '#FFFFFF',
    text: PALETA.textLight,
    textSecondary: PALETA.textSecondaryLight,
    primary: PALETA.principal,
    icon: PALETA.textLight,
    border: '#E0E0E0',
    inputBackground: PALETA.grayLight,
    tabBar: '#FFFFFF',
    danger: PALETA.danger,
    modalOverlay: 'rgba(0,0,0,0.5)',
    isDark: false
  },
  dark: {
    background: '#121212', // Negro suave
    card: '#1E1E1E', // Gris oscuro
    text: PALETA.textDark,
    textSecondary: PALETA.textSecondaryDark,
    primary: PALETA.principal, // Mantenemos el verde como acento
    icon: PALETA.textDark,
    border: '#333333',
    inputBackground: '#2C2C2C',
    tabBar: '#1E1E1E',
    danger: '#FF5252', // Rojo un poco más brillante para fondo oscuro
    modalOverlay: 'rgba(255,255,255,0.1)',
    isDark: true
  }
};

// Mantenemos compatibilidad con tu código anterior
export const COLORES = {
    ...PALETA,
    fondoGris: '#F1F8E9', 
    fondoBlanco: '#FFFFFF',
    texto: '#2E3A2F',
    textoSecundario: '#889988',
    inactivo: '#C5E1A5',
    verdeBoton: '#2E7D32',
    textoSobrePrincipal: '#FFFFFF'
};