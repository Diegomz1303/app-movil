import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

export default function PerfilTab() {
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', 'No se pudo cerrar la sesión.');
  };

  return (
    <View style={styles.contentCenter}>
      <MaterialCommunityIcons name="account-circle-outline" size={80} color={COLORES.principal} />
      <Text style={styles.title}>Mi Perfil</Text>
      <Text style={styles.subtitle}>Configuración de usuario</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contentCenter: { alignItems: 'center', padding: 20, justifyContent: 'center', flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORES.texto, marginTop: 15, marginBottom: 5 },
  subtitle: { fontSize: 16, color: COLORES.textoSecundario },
  logoutButton: {
    width: '100%', maxWidth: 200, height: 50, backgroundColor: COLORES.danger,
    borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 40,
  },
  logoutText: { color: COLORES.fondoBlanco, fontSize: 16, fontWeight: 'bold' },
});