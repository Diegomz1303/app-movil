import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  Modal, 
  Animated, 
  Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext'; 
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

export default function PerfilTab() {
  const { theme, isDark, toggleTheme } = useTheme(); 
  
  // Estados para el Modal de Cerrar Sesión
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Animación del Modal
  const scaleValue = useRef(new Animated.Value(0)).current;

  // Efecto de rebote al abrir el modal
  useEffect(() => {
    if (showLogoutModal) {
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [showLogoutModal]);

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const executeLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    setShowLogoutModal(false);
    if (error) Alert.alert('Error', 'No se pudo cerrar la sesión.');
  };

  // Componente reutilizable para opciones de menú
  const MenuOption = ({ icon, label, onPress, isSwitch = false, value = false, onSwitch }: any) => (
    <TouchableOpacity 
      style={[styles.optionCard, { backgroundColor: theme.card }]} 
      onPress={isSwitch ? toggleTheme : onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: isSwitch ? (value ? '#333' : '#F0F9F0') : '#F0F9F0' }]}>
         <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={isSwitch ? (value ? '#FFF' : theme.primary) : theme.primary} 
         />
      </View>
      <Text style={[styles.optionText, { color: theme.text }]}>{label}</Text>
      
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onSwitch}
          trackColor={{ false: "#DDD", true: theme.primary }}
          thumbColor={value ? "#FFF" : "#f4f3f4"}
        />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header del Perfil */}
      <View style={styles.header}>
        <View style={[styles.avatarCircle, { borderColor: theme.card, backgroundColor: theme.card }]}>
           <MaterialCommunityIcons name="account" size={60} color={theme.primary} />
        </View>
        <Text style={[styles.userName, { color: theme.text }]}>Administrador</Text>
        {/* CORRECCIÓN AQUÍ: */}
        <Text style={[styles.userRole, { color: theme.textSecondary }]}>OhMyPet</Text>
      </View>

      {/* Sección de Ajustes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREFERENCIAS</Text>
        
        <MenuOption 
          icon={isDark ? "weather-night" : "weather-sunny"} 
          label="Modo Oscuro" 
          isSwitch 
          value={isDark} 
          onSwitch={toggleTheme} 
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CUENTA</Text>
        
        <MenuOption 
          icon="lock-outline" 
          label="Cambiar Contraseña" 
          onPress={() => Alert.alert("Próximamente", "Función en desarrollo")} 
        />
        
        <MenuOption 
          icon="help-circle-outline" 
          label="Ayuda y Soporte" 
          onPress={() => Alert.alert("Soporte", "Contacta a soporte@ohmypet.com")} 
        />
      </View>

      {/* Botón Cerrar Sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
        <MaterialCommunityIcons name="logout" size={20} color="white" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <Text style={[styles.versionText, { color: theme.textSecondary }]}>Versión 1.0.0</Text>

      {/* --- MODAL DE CONFIRMACIÓN DE LOGOUT --- */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
                
                {/* Animación Lottie (Triste) */}
                <View style={styles.lottieWrapper}>
                    <LottieView
                        source={require('../../assets/sad_anim.json')} 
                        autoPlay
                        loop
                        style={{ width: 100, height: 100 }}
                    />
                </View>

                <Text style={[styles.modalTitle, { color: theme.text }]}>¿Cerrar Sesión?</Text>
                <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
                    ¿Seguro que deseas salir? Tendrás que ingresar tus datos nuevamente.
                </Text>

                <View style={styles.modalButtons}>
                    <TouchableOpacity 
                        style={[styles.btnCancel, { backgroundColor: theme.inputBackground }]} 
                        onPress={() => setShowLogoutModal(false)}
                    >
                        <Text style={[styles.btnCancelText, { color: theme.text }]}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.btnLogout} 
                        onPress={executeLogout}
                        disabled={loading}
                    >
                        <Text style={styles.btnLogoutText}>{loading ? 'Saliendo...' : 'Salir'}</Text>
                    </TouchableOpacity>
                </View>

            </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  
  header: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    borderWidth: 4, shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity:0.1, elevation: 5
  },
  userName: { fontSize: 24, fontWeight: 'bold' },
  userRole: { fontSize: 16, marginTop: 5 },

  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginLeft: 5 },
  
  optionCard: {
    flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionText: { flex: 1, fontSize: 16, fontWeight: '500' },

  logoutButton: {
    flexDirection: 'row', backgroundColor: '#E53935', padding: 15, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: "#E53935", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5
  },
  logoutText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  versionText: { textAlign: 'center', marginTop: 20, fontSize: 12 },

  // --- ESTILOS DEL MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.8,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    shadowColor: "#000", shadowOffset: {width:0, height:5}, shadowOpacity:0.3, elevation:10
  },
  lottieWrapper: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnLogout: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E53935', // Rojo peligro
  },
  btnLogoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  }
});