import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext'; // Importamos el hook del tema

export default function PerfilTab() {
  const { theme, isDark, toggleTheme } = useTheme(); // Usamos los valores del tema

  const handleLogout = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) Alert.alert('Error', 'No se pudo cerrar la sesión.');
      }}
    ]);
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
        <Text style={[styles.userRole, { color: theme.textSecondary }]}>Veterinaria Pet</Text>
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
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={20} color="white" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <Text style={[styles.versionText, { color: theme.textSecondary }]}>Versión 1.0.0</Text>
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
  
  versionText: { textAlign: 'center', marginTop: 20, fontSize: 12 }
});