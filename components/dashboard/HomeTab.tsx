import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';

export default function HomeTab() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumen</Text>
        <Text style={styles.subtitle}>Bienvenido de nuevo</Text>
      </View>
      
      <View style={styles.contentCenter}>
        <MaterialCommunityIcons name="chart-bar" size={80} color={COLORES.inactivo} />
        <Text style={styles.placeholderText}>Aquí irán tus gráficas y estadísticas de servicios.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondoGris },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORES.texto },
  subtitle: { fontSize: 14, color: COLORES.textoSecundario },
  contentCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  placeholderText: { 
    textAlign: 'center', color: COLORES.textoSecundario, 
    fontSize: 16, marginTop: 20 
  }
});