// screens/DashboardScreen.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase'; // Importamos nuestro cliente

// Colores (puedes moverlos a un archivo global luego)
const COLORES = {
  principal: '#007bff',
  fondoBlanco: '#FFFFFF',
  texto: '#333',
  danger: '#dc3545',
};

export default function DashboardScreen() {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión.');
    }
    // No necesitamos navegar, el listener en App.tsx hará el trabajo
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Panel de Administración</Text>
        <Text style={styles.subtitle}>¡Bienvenido, Admin!</Text>

        {/* Aquí irá todo el contenido de tu app principal */}
        
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORES.texto,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: COLORES.danger, // Color rojo para "cerrar sesión"
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: COLORES.fondoBlanco,
    fontSize: 18,
    fontWeight: 'bold',
  },
});