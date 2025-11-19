import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';

export default function HomeTab() {
  return (
    <View style={styles.contentCenter}>
      <MaterialCommunityIcons name="home-variant-outline" size={80} color={COLORES.principal} />
      <Text style={styles.title}>Panel Principal</Text>
      <Text style={styles.subtitle}>Resumen de hoy</Text>
      {/* Aquí iría el resto de tu código de Inicio */}
    </View>
  );
}

const styles = StyleSheet.create({
  contentCenter: { alignItems: 'center', padding: 20, justifyContent: 'center', flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORES.texto, marginTop: 15, marginBottom: 5 },
  subtitle: { fontSize: 16, color: COLORES.textoSecundario },
});