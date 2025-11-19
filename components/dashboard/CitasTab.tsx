import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';

export default function CitasTab() {
  return (
    <View style={styles.contentCenter}>
      <MaterialCommunityIcons name="calendar-clock" size={80} color={COLORES.principal} />
      <Text style={styles.title}>Mis Citas</Text>
      <Text style={styles.subtitle}>Próximas atenciones</Text>
      {/* Aquí iría tu lista de citas */}
    </View>
  );
}

const styles = StyleSheet.create({
  contentCenter: { alignItems: 'center', padding: 20, justifyContent: 'center', flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORES.texto, marginTop: 15, marginBottom: 5 },
  subtitle: { fontSize: 16, color: COLORES.textoSecundario },
});