import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  Platform,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';
import { supabase } from '../../lib/supabase'; // Importamos supabase

// 1. Importamos el hook del tema
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
};

// Tipo simple para el historial
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
  
  // 2. Usamos el tema
  const { theme, isDark } = useTheme();

  // Estado para el historial
  const [historial, setHistorial] = useState<CitaHistorial[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (visible && mascota) {
      // Animación de entrada
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();

      // Cargar historial
      fetchHistorial(mascota.id);
    }
  }, [visible, mascota]);

  const fetchHistorial = async (petId: number) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('citas')
      .select('id, fecha, servicio, precio, estado')
      .eq('mascota_id', petId)
      .order('fecha', { ascending: false }); // Las más recientes primero

    if (!error && data) {
      setHistorial(data);
    }
    setLoadingHistory(false);
  };

  if (!mascota) return null;

  // Estilos dinámicos
  const textColor = { color: theme.text };
  const textSecondary = { color: theme.textSecondary };
  const dividerColor = { backgroundColor: theme.border };
  const cardBg = { backgroundColor: theme.inputBackground };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

        {/* Fondo de Modal Dinámico */}
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
             <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            
            {/* FOTO DE LA MASCOTA */}
            <View style={styles.imageContainer}>
                {mascota.foto_url ? (
                    <Image source={{ uri: mascota.foto_url }} style={[styles.image, { borderColor: theme.card }]} />
                ) : (
                    <View style={[
                        styles.placeholderImage, 
                        { 
                            backgroundColor: isDark ? '#333' : '#CFD8DC', 
                            borderColor: theme.card 
                        }
                    ]}>
                        <MaterialCommunityIcons name="dog" size={50} color={isDark ? '#555' : 'white'} />
                    </View>
                )}
            </View>

            <Text style={[styles.petName, textColor]}>{mascota.nombre}</Text>
            <Text style={[styles.petBreed, textSecondary]}>{mascota.raza}</Text>

            {/* Detalles Básicos */}
            <View style={[styles.infoBox, cardBg]}>
                <View style={styles.row}>
                    <View style={styles.item}>
                        <Text style={[styles.label, textSecondary]}>Sexo</Text>
                        <View style={{flexDirection:'row', alignItems:'center', marginTop: 4}}>
                             <MaterialCommunityIcons 
                                name={mascota.sexo === 'Macho' ? 'gender-male' : 'gender-female'} 
                                size={16} 
                                color={mascota.sexo === 'Macho' ? '#2196F3' : '#E91E63'} 
                             />
                             <Text style={[styles.value, textColor]}>{mascota.sexo || 'N/A'}</Text>
                        </View>
                    </View>
                    
                    <View style={[styles.separator, dividerColor]} />
                    
                    <View style={styles.item}>
                        <Text style={[styles.label, textSecondary]}>Nacimiento</Text>
                        <Text style={[styles.value, textColor]}>{mascota.fecha_nacimiento || '--/--/----'}</Text>
                    </View>
                </View>

                {mascota.observaciones ? (
                    <View style={[styles.obsContainer, { borderTopColor: theme.border }]}>
                        <Text style={[styles.label, textSecondary]}>Observaciones</Text>
                        <Text style={[styles.obsText, { color: theme.text }]}>{mascota.observaciones}</Text>
                    </View>
                ) : null}
            </View>

            {/* --- NUEVA SECCIÓN: HISTORIAL --- */}
            <View style={styles.historySection}>
              <Text style={[styles.sectionTitle, textSecondary]}>Historial de Servicios</Text>

              {loadingHistory ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 10 }} />
              ) : historial.length > 0 ? (
                historial.map((cita) => (
                  <View key={cita.id} style={[styles.historyCard, { borderBottomColor: theme.border }]}>
                    <View style={styles.historyLeft}>
                        <Text style={[styles.historyService, textColor]}>{cita.servicio}</Text>
                        <Text style={[styles.historyDate, textSecondary]}>
                           <MaterialCommunityIcons name="calendar" size={12} /> {cita.fecha.split('-').reverse().join('/')}
                        </Text>
                    </View>
                    <View style={styles.historyRight}>
                        {/* Mostrar precio si está completada, o estado si está pendiente */}
                        {cita.estado === 'completada' && cita.precio ? (
                            <Text style={[styles.historyPrice, { color: theme.primary }]}>S/. {cita.precio}</Text>
                        ) : (
                            <Text style={[styles.historyStatus, { color: cita.estado === 'pendiente' ? '#FFB74D' : theme.text }]}>
                                {cita.estado}
                            </Text>
                        )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.noHistoryText, textSecondary]}>Aún no tiene servicios registrados.</Text>
              )}
            </View>

          </ScrollView>

          <View style={styles.footer}>
             <TouchableOpacity style={styles.btnDone} onPress={onClose}>
                 <Text style={styles.btnText}>Listo</Text>
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
    width: width * 0.85, maxHeight: height * 0.85,
    borderRadius: 25, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10
  },
  closeIcon: { alignSelf: 'flex-end', padding: 5 },
  
  imageContainer: {
    shadowColor: COLORES.principal, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
    marginBottom: 15
  },
  image: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  placeholderImage: { 
    width: 100, height: 100, borderRadius: 50, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 4 
  },
  
  petName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  petBreed: { fontSize: 14, marginBottom: 15, textAlign: 'center' },

  infoBox: { width: '100%', borderRadius: 16, padding: 15, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { flex: 1, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 15, fontWeight: '600', marginTop: 2, marginLeft: 5 },
  separator: { width: 1, marginHorizontal: 10 },
  
  obsContainer: { marginTop: 10, borderTopWidth: 1, paddingTop: 8 },
  obsText: { marginTop: 4, fontStyle: 'italic', fontSize: 13, lineHeight: 18 },

  // Estilos Historial
  historySection: { width: '100%' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  historyCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1
  },
  historyLeft: { flex: 1 },
  historyService: { fontSize: 14, fontWeight: '600' },
  historyDate: { fontSize: 12, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyPrice: { fontSize: 14, fontWeight: 'bold' },
  historyStatus: { fontSize: 12, textTransform: 'capitalize' },
  noHistoryText: { fontStyle: 'italic', fontSize: 13, marginTop: 5, textAlign: 'center' },

  footer: { marginTop: 15, width: '100%' },
  btnDone: { backgroundColor: COLORES.principal, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});