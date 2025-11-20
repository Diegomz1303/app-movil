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

// 1. Importamos el hook del tema
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AppointmentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  cita: any; 
}

export default function AppointmentDetailsModal({ visible, onClose, cita }: AppointmentDetailsModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  
  // 2. Usamos el tema
  const { theme, isDark } = useTheme();

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
        <Text style={[styles.label, { color: theme.textSecondary }]}>{title}</Text>
        <Image source={{ uri }} style={[styles.photo, { borderColor: theme.border }]} resizeMode="cover" />
      </View>
    );
  };

  // Estilos dinámicos
  const textColor = { color: theme.text };
  const textSecondary = { color: theme.textSecondary };
  const cardBackground = { backgroundColor: theme.inputBackground, borderColor: theme.border };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

        {/* Fondo del Modal Dinámico */}
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleContainer}>
                <MaterialCommunityIcons name="check-decagram" size={24} color={theme.primary} />
                <Text style={[styles.modalTitle, textColor]}>Detalles del Servicio</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            
            {/* Resumen Principal (Tarjeta grande) */}
            <View style={[
                styles.summaryCard, 
                { backgroundColor: isDark ? '#1E1E1E' : '#F9FAFB', borderColor: theme.border }
            ]}>
                <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
                    <MaterialCommunityIcons name="paw" size={30} color="white" />
                </View>
                <Text style={[styles.petName, textColor]}>{cita.mascotas?.nombre}</Text>
                <Text style={[styles.serviceName, textSecondary]}>{cita.servicio}</Text>
                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                    {cita.fecha?.split('-').reverse().join('/')} - {cita.hora}
                </Text>
            </View>

            {/* Detalles Financieros */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, textColor]}>Resumen de Pago</Text>
                <View style={styles.row}>
                    <View style={[styles.infoBox, cardBackground]}>
                        <Text style={[styles.label, textSecondary]}>Precio</Text>
                        <Text style={[styles.valueHighlight, { color: theme.primary }]}>S/. {cita.precio}</Text>
                    </View>
                    <View style={[styles.infoBox, cardBackground]}>
                        <Text style={[styles.label, textSecondary]}>Método</Text>
                        <Text style={[styles.value, textColor]}>{cita.metodo_pago}</Text>
                    </View>
                </View>
                {/* Detalles Opcionales */}
                {(cita.peso || cita.shampoo) && (
                    <View style={[styles.row, { marginTop: 10 }]}>
                        {cita.peso && (
                            <View style={[styles.infoBox, cardBackground]}>
                                <Text style={[styles.label, textSecondary]}>Peso</Text>
                                <Text style={[styles.value, textColor]}>{cita.peso} kg</Text>
                            </View>
                        )}
                        {cita.shampoo && (
                            <View style={[styles.infoBox, cardBackground]}>
                                <Text style={[styles.label, textSecondary]}>Shampoo</Text>
                                <Text style={[styles.value, textColor]}>{cita.shampoo}</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Observaciones (Nota amarilla suave siempre destaca, pero la adaptamos un poco en dark) */}
            {cita.observaciones_finales ? (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, textColor]}>Observaciones</Text>
                    <View style={[
                        styles.noteBox, 
                        { backgroundColor: isDark ? '#3E3C2F' : '#FFF9C4' } // Amarillo oscuro vs claro
                    ]}>
                        <Text style={[
                            styles.noteText, 
                            { color: isDark ? '#FFD54F' : '#5D4037' }
                        ]}>{cita.observaciones_finales}</Text>
                    </View>
                </View>
            ) : null}

            {/* Galería de Fotos */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, textColor]}>Evidencia</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    <RenderPhotoSection title="Llegada" uri={cita.foto_llegada} />
                    <RenderPhotoSection title="Salida" uri={cita.foto_salida} />
                    <RenderPhotoSection title="Boleta" uri={cita.foto_boleta} />
                    
                    {!cita.foto_llegada && !cita.foto_salida && !cita.foto_boleta && (
                        <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>No se adjuntaron fotos.</Text>
                    )}
                </ScrollView>
            </View>

          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
                style={[styles.btnClose, { backgroundColor: theme.inputBackground }]} 
                onPress={onClose}
            >
                <Text style={[styles.btnText, textColor]}>Cerrar</Text>
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
    width: width * 0.9, maxHeight: height * 0.85,
    borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, overflow: 'hidden'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 10 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { padding: 5 },
  content: { paddingBottom: 20 },

  // Resumen Card
  summaryCard: { 
    alignItems: 'center', padding: 20, borderRadius: 15, marginBottom: 20,
    borderWidth: 1
  },
  avatarCircle: { 
    width: 60, height: 60, borderRadius: 30, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    shadowOffset: {width:0, height:4}, shadowOpacity:0.3, elevation:5
  },
  petName: { fontSize: 22, fontWeight: 'bold' },
  serviceName: { fontSize: 14, textTransform: 'uppercase', marginTop: 4, fontWeight: '600' },
  dateText: { fontSize: 13, marginTop: 2 },

  // Secciones
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  infoBox: { 
    flex: 1, padding: 12, borderRadius: 12, 
    borderWidth: 1, alignItems: 'center'
  },
  label: { fontSize: 12, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '600' },
  valueHighlight: { fontSize: 18, fontWeight: 'bold' },

  noteBox: { padding: 15, borderRadius: 10 },
  noteText: { fontSize: 14, lineHeight: 20 },

  // Fotos
  photoSection: { marginRight: 15 },
  photo: { width: 100, height: 100, borderRadius: 10, marginTop: 5, borderWidth: 1 },

  footer: { marginTop: 10 },
  btnClose: { padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 16 }
});