import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

// Reutilizamos el tipo Cita extendido que usaremos en CitasTab
interface AppointmentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  cita: any; // Usamos any por flexibilidad, pero idealmente sería el tipo Cita completo
}

export default function AppointmentDetailsModal({ visible, onClose, cita }: AppointmentDetailsModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!cita) return null;

  // Helper para renderizar secciones de fotos
  const RenderPhotoSection = ({ title, uri }: { title: string, uri: string | null }) => {
    if (!uri) return null;
    return (
      <View style={styles.photoSection}>
        <Text style={styles.label}>{title}</Text>
        <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }] }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
                <MaterialCommunityIcons name="check-decagram" size={24} color={COLORES.principal} />
                <Text style={styles.modalTitle}>Detalles del Servicio</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={COLORES.textoSecundario} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            
            {/* Resumen Principal */}
            <View style={styles.summaryCard}>
                <View style={styles.avatarCircle}>
                    <MaterialCommunityIcons name="paw" size={30} color="white" />
                </View>
                <Text style={styles.petName}>{cita.mascotas?.nombre}</Text>
                <Text style={styles.serviceName}>{cita.servicio}</Text>
                <Text style={styles.dateText}>
                    {cita.fecha?.split('-').reverse().join('/')} - {cita.hora}
                </Text>
            </View>

            {/* Detalles Financieros */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resumen de Pago</Text>
                <View style={styles.row}>
                    <View style={styles.infoBox}>
                        <Text style={styles.label}>Precio</Text>
                        <Text style={styles.valueHighlight}>S/. {cita.precio}</Text>
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.label}>Método</Text>
                        <Text style={styles.value}>{cita.metodo_pago}</Text>
                    </View>
                </View>
                {/* Detalles Opcionales */}
                {(cita.peso || cita.shampoo) && (
                    <View style={[styles.row, { marginTop: 10 }]}>
                        {cita.peso && (
                            <View style={styles.infoBox}>
                                <Text style={styles.label}>Peso</Text>
                                <Text style={styles.value}>{cita.peso} kg</Text>
                            </View>
                        )}
                        {cita.shampoo && (
                            <View style={styles.infoBox}>
                                <Text style={styles.label}>Shampoo</Text>
                                <Text style={styles.value}>{cita.shampoo}</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Observaciones */}
            {cita.observaciones_finales ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Observaciones</Text>
                    <View style={styles.noteBox}>
                        <Text style={styles.noteText}>{cita.observaciones_finales}</Text>
                    </View>
                </View>
            ) : null}

            {/* Galería de Fotos */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Evidencia</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    <RenderPhotoSection title="Llegada" uri={cita.foto_llegada} />
                    <RenderPhotoSection title="Salida" uri={cita.foto_salida} />
                    <RenderPhotoSection title="Boleta" uri={cita.foto_boleta} />
                    
                    {!cita.foto_llegada && !cita.foto_salida && !cita.foto_boleta && (
                        <Text style={{ color: '#999', fontStyle: 'italic' }}>No se adjuntaron fotos.</Text>
                    )}
                </ScrollView>
            </View>

          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
                <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: {
    width: width * 0.9, maxHeight: height * 0.85, backgroundColor: COLORES.fondoBlanco,
    borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, overflow: 'hidden'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORES.texto },
  closeButton: { padding: 5 },
  content: { paddingBottom: 20 },

  // Resumen Card
  summaryCard: { 
    alignItems: 'center', padding: 20, backgroundColor: '#F9FAFB', borderRadius: 15, marginBottom: 20,
    borderWidth: 1, borderColor: '#EEE'
  },
  avatarCircle: { 
    width: 60, height: 60, borderRadius: 30, backgroundColor: COLORES.principal, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    shadowColor: COLORES.principal, shadowOffset: {width:0, height:4}, shadowOpacity:0.3, elevation:5
  },
  petName: { fontSize: 22, fontWeight: 'bold', color: COLORES.texto },
  serviceName: { fontSize: 14, color: COLORES.textoSecundario, textTransform: 'uppercase', marginTop: 4, fontWeight: '600' },
  dateText: { fontSize: 13, color: '#999', marginTop: 2 },

  // Secciones
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORES.texto, marginBottom: 10 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  infoBox: { 
    flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 12, 
    borderWidth: 1, borderColor: '#EEE', alignItems: 'center'
  },
  label: { fontSize: 12, color: COLORES.textoSecundario, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '600', color: COLORES.texto },
  valueHighlight: { fontSize: 18, fontWeight: 'bold', color: COLORES.principal },

  noteBox: { backgroundColor: '#FFF9C4', padding: 15, borderRadius: 10 },
  noteText: { color: '#5D4037', fontSize: 14, lineHeight: 20 },

  // Fotos
  photoSection: { marginRight: 15 },
  photo: { width: 100, height: 100, borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#DDD' },

  footer: { marginTop: 10 },
  btnClose: { backgroundColor: COLORES.fondoGris, padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { color: COLORES.texto, fontWeight: 'bold', fontSize: 16 }
});