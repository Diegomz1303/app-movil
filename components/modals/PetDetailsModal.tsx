import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal, Animated,
  Platform, Image, KeyboardAvoidingView, ScrollView, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export type Mascota = {
  id: number;
  nombre: string;
  raza: string;
  sexo?: string;
  fecha_nacimiento?: string;
  observaciones?: string;
  foto_url?: string;
  // Nuevos campos de estilo
  estilo_corte?: string;
  alergias?: string;
  comportamiento?: string;
};

type CitaHistorial = {
  id: number;
  fecha: string;
  servicio: string;
  precio?: number;
  estado: string;
};

interface PetDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  mascota: Mascota | null;
}

export default function PetDetailsModal({ visible, onClose, mascota }: PetDetailsModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const { theme, isDark } = useTheme();
  const [historial, setHistorial] = useState<CitaHistorial[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (visible && mascota) {
      scaleValue.setValue(0);
      Animated.spring(scaleValue, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();
      fetchHistorial(mascota.id);
    }
  }, [visible, mascota]);

  const fetchHistorial = async (petId: number) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('citas')
      .select('id, fecha, servicio, precio, estado')
      .eq('mascota_id', petId)
      .order('fecha', { ascending: false });
    if (!error && data) setHistorial(data);
    setLoadingHistory(false);
  };

  if (!mascota) return null;

  const textColor = { color: theme.text };
  const textSecondary = { color: theme.textSecondary };
  const cardBg = { backgroundColor: theme.inputBackground };

  const InfoRow = ({ icon, label, value, color }: any) => (
    <View style={styles.infoRowItem}>
        <Text style={[styles.label, textSecondary]}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            {icon && <MaterialCommunityIcons name={icon} size={16} color={color || theme.text} style={{marginRight: 4}} />}
            <Text style={[styles.value, textColor]}>{value || '-'}</Text>
        </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
             <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            
            {/* FOTO */}
            <View style={styles.imageContainer}>
                {mascota.foto_url ? (
                    <Image source={{ uri: mascota.foto_url }} style={[styles.image, { borderColor: theme.card }]} />
                ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: isDark ? '#333' : '#CFD8DC', borderColor: theme.card }]}>
                        <MaterialCommunityIcons name="dog" size={50} color={isDark ? '#555' : 'white'} />
                    </View>
                )}
            </View>

            <Text style={[styles.petName, textColor]}>{mascota.nombre}</Text>
            <Text style={[styles.petBreed, textSecondary]}>{mascota.raza}</Text>

            {/* INFO BÁSICA */}
            <View style={[styles.infoBox, cardBg]}>
                <View style={styles.row}>
                    <InfoRow label="Sexo" value={mascota.sexo} icon={mascota.sexo === 'Macho' ? 'gender-male' : 'gender-female'} color={mascota.sexo === 'Macho' ? '#2196F3' : '#E91E63'} />
                    <View style={[styles.separator, { backgroundColor: theme.border }]} />
                    <InfoRow label="Nacimiento" value={mascota.fecha_nacimiento} />
                </View>
            </View>

            {/* --- SECCIÓN NUEVA: PERFIL DE ESTILO (GROOMING CARD) --- */}
            <View style={styles.sectionHeaderContainer}>
                <MaterialCommunityIcons name="content-cut" size={18} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>Perfil de Estilo</Text>
            </View>

            <View style={[styles.groomingBox, { borderColor: theme.border }]}>
                <View style={styles.groomingRow}>
                    <Text style={[styles.groomingLabel, textSecondary]}>Estilo:</Text>
                    <Text style={[styles.groomingValue, textColor]}>{mascota.estilo_corte || 'Estándar'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.groomingRow}>
                    <Text style={[styles.groomingLabel, textSecondary]}>Alergias:</Text>
                    <Text style={[styles.groomingValue, { color: COLORES.danger }]}>{mascota.alergias || 'Ninguna'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.groomingRow}>
                    <Text style={[styles.groomingLabel, textSecondary]}>Conducta:</Text>
                    <Text style={[styles.groomingValue, textColor]}>{mascota.comportamiento || 'Normal'}</Text>
                </View>
                
                {mascota.observaciones ? (
                    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border }}>
                        <Text style={[styles.label, textSecondary, { fontSize: 10 }]}>NOTAS ADICIONALES</Text>
                        <Text style={[styles.obsText, textColor]}>{mascota.observaciones}</Text>
                    </View>
                ) : null}
            </View>

            {/* HISTORIAL */}
            <Text style={[styles.sectionTitle, textSecondary, { marginTop: 20, alignSelf: 'flex-start' }]}>Historial de Servicios</Text>
            <View style={{ width: '100%' }}>
              {loadingHistory ? <ActivityIndicator size="small" color={theme.primary} /> : 
                historial.length > 0 ? (
                  historial.map((cita) => (
                    <View key={cita.id} style={[styles.historyCard, { borderBottomColor: theme.border }]}>
                      <View style={{ flex: 1 }}>
                          <Text style={[styles.historyService, textColor]}>{cita.servicio}</Text>
                          <Text style={[styles.historyDate, textSecondary]}>{cita.fecha.split('-').reverse().join('/')}</Text>
                      </View>
                      <Text style={[styles.historyPrice, { color: theme.primary }]}>{cita.estado === 'completada' ? `S/. ${cita.precio}` : cita.estado}</Text>
                    </View>
                  ))
                ) : <Text style={[styles.noHistoryText, textSecondary]}>Sin servicios previos.</Text>
              }
            </View>

          </ScrollView>

          <TouchableOpacity style={styles.btnDone} onPress={onClose}><Text style={styles.btnText}>Cerrar</Text></TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { width: width * 0.85, maxHeight: height * 0.85, borderRadius: 25, padding: 20, shadowColor: '#000', shadowOpacity: 0.3, elevation: 10 },
  closeIcon: { alignSelf: 'flex-end', padding: 5 },
  imageContainer: { alignSelf: 'center', marginBottom: 15, shadowColor: COLORES.principal, shadowOpacity: 0.3, elevation: 8 },
  image: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  placeholderImage: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 4 },
  petName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  petBreed: { fontSize: 14, marginBottom: 15, textAlign: 'center' },
  infoBox: { width: '100%', borderRadius: 16, padding: 15, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  infoRowItem: { flex: 1, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 15, fontWeight: '600' },
  separator: { width: 1, marginHorizontal: 10 },
  
  // Grooming Card Styles
  sectionHeaderContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  groomingBox: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 15 },
  groomingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  groomingLabel: { fontSize: 13 },
  groomingValue: { fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 4 },
  obsText: { fontStyle: 'italic', fontSize: 13, marginTop: 2 },

  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  historyService: { fontSize: 14, fontWeight: '600' },
  historyDate: { fontSize: 12, marginTop: 2 },
  historyPrice: { fontSize: 14, fontWeight: 'bold' },
  noHistoryText: { fontStyle: 'italic', fontSize: 13, marginTop: 5, textAlign: 'center' },
  btnDone: { backgroundColor: COLORES.principal, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 15, width: '100%' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});