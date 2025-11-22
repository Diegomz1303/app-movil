import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  Alert,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native'; // <--- IMPORTANTE
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

// Contextos
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

// Modales
import CompleteAppointmentModal from '../modals/CompleteAppointmentModal'; 
import AppointmentDetailsModal from '../modals/AppointmentDetailsModal';
import AddAppointmentModal from '../modals/AddAppointmentModal'; 

const { width } = Dimensions.get('window');

export type Cita = {
  id: number;
  fecha: string;
  hora: string;
  servicio: string;
  estado: string;
  notas?: string;
  cliente_id?: number;
  mascota_id?: number;
  precio?: number | null;
  peso?: number | null;
  metodo_pago?: string | null;
  shampoo?: string | null;
  observaciones_finales?: string | null;
  foto_llegada?: string | null;
  foto_salida?: string | null;
  foto_boleta?: string | null;
  clientes: { nombres: string; apellidos: string; } | null;
  mascotas: { nombre: string; } | null;
};

export default function CitasTab() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { appointmentsTrigger, refreshAppointments } = useData();
  const { theme } = useTheme();

  // Estados para Modales
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false); 
  
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  // --- ESTADOS PARA ELIMINAR (MODAL CUSTOM) ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const alertScale = useRef(new Animated.Value(0)).current; // Animación rebote

  // Efecto de rebote al abrir alerta
  useEffect(() => {
    if (showDeleteConfirm) {
        alertScale.setValue(0);
        Animated.spring(alertScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();
    }
  }, [showDeleteConfirm]);

  const fetchCitas = async () => {
    if (!refreshing) setLoading(true);

    try {
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          clientes (nombres, apellidos),
          mascotas (nombre)
        `)
        .neq('estado', 'completada') 
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })
        .returns<Cita[]>();

      if (error) {
        console.error("Error cargando citas:", error.message);
      } else if (data) {
        setCitas(data);
      }
    } catch (err) {
      console.error("Excepción:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCitas(); }, [appointmentsTrigger]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCitas();
    setRefreshing(false);
  }, []);

  // --- FUNCIÓN PARA ABRIR MODAL DE ELIMINAR ---
  const handleOpenDeleteModal = (id: number) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  // --- FUNCIÓN PARA EJECUTAR LA ELIMINACIÓN ---
  const executeDelete = async () => {
    if (!idToDelete) return;
    setDeleting(true);
    
    const { error } = await supabase.from('citas').delete().eq('id', idToDelete);
    
    setDeleting(false);
    setShowDeleteConfirm(false);

    if (error) {
        Alert.alert("Error", error.message);
    } else {
        refreshAppointments();
    }
  };

  const handleEdit = (cita: Cita) => {
    setSelectedCita(cita);
    setEditModalVisible(true);
  };

  const handleOpenCompleteModal = (cita: Cita) => {
    setSelectedCita(cita);
    setCompleteModalVisible(true);
  };

  const handleOpenDetailsModal = (cita: Cita) => {
    setSelectedCita(cita);
    setDetailsModalVisible(true);
  };

  const handleSuccessAction = () => {
    refreshAppointments();
  };

  const renderItem = ({ item }: { item: Cita }) => {
    const isCompleted = item.estado === 'completada';

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card }]} 
        activeOpacity={isCompleted ? 0.7 : 1}
        onPress={() => isCompleted && handleOpenDetailsModal(item)}
      >
        <View style={styles.cardMain}>
            <View style={styles.dateContainer}>
                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                  {item.fecha ? item.fecha.split('-').reverse().slice(0, 2).join('/') : '--/--'}
                </Text> 
                <Text style={[styles.timeText, { color: isCompleted ? theme.primary : theme.text }]}>
                    {item.hora}
                </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.infoContainer}>
                <View style={styles.row}>
                    <MaterialCommunityIcons name="paw" size={14} color={isCompleted ? theme.primary : '#FFB74D'} style={{ marginRight: 4 }} />
                    <Text style={[styles.petName, { color: theme.text }]}>{item.mascotas?.nombre || 'Sin nombre'}</Text>
                </View>
                <Text style={[styles.serviceText, { color: theme.textSecondary }]}>{item.servicio}</Text>
                <Text style={[styles.clientName, { color: theme.textSecondary }]}>
                    <MaterialCommunityIcons name="account" size={12} /> 
                    {" "}{item.clientes ? `${item.clientes.nombres} ${item.clientes.apellidos}` : 'Cliente desconocido'}
                </Text>
            </View>

            <View style={styles.statusIcon}>
                <MaterialCommunityIcons 
                    name={isCompleted ? "check-circle" : "clock-outline"} 
                    size={28} 
                    color={isCompleted ? theme.primary : theme.border} 
                />
            </View>
        </View>

        <View style={[styles.horizontalLine, { backgroundColor: theme.border }]} />

        <View style={[styles.actionsContainer, { backgroundColor: theme.inputBackground }]}>
            {isCompleted ? (
                <View style={styles.completedState}>
                    <MaterialCommunityIcons name="check-all" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.completedText, { color: theme.primary }]}>Cita Finalizada</Text>
                </View>
            ) : (
                <>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.textSecondary} />
                        <Text style={[styles.actionText, { color: theme.textSecondary }]}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenCompleteModal(item)}>
                        <MaterialCommunityIcons name="check" size={18} color={theme.primary} />
                        <Text style={[styles.actionText, { color: theme.primary }]}>Completar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenDeleteModal(item.id)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.danger} />
                        <Text style={[styles.actionText, { color: theme.danger }]}>Cancelar</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Agenda</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Próximas atenciones pendientes</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={citas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[theme.primary]} 
                tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color={COLORES.inactivo} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No hay citas pendientes.</Text>
              <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>Agenda una nueva con el botón (+).</Text>
            </View>
          }
        />
      )}

      {/* --- MODALES ESTÁNDAR --- */}
      <CompleteAppointmentModal 
         visible={completeModalVisible}
         onClose={() => setCompleteModalVisible(false)}
         citaId={selectedCita?.id || null}
         mascotaNombre={selectedCita?.mascotas?.nombre || ''}
         onSuccess={handleSuccessAction}
       />

       <AppointmentDetailsModal
         visible={detailsModalVisible}
         onClose={() => setDetailsModalVisible(false)}
         cita={selectedCita}
       />

       <AddAppointmentModal 
         visible={editModalVisible}
         onClose={() => { setEditModalVisible(false); setSelectedCita(null); }}
         onAppointmentAdded={handleSuccessAction} 
         appointmentToEdit={selectedCita} 
       />

       {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (CUSTOM) --- */}
       <Modal visible={showDeleteConfirm} transparent animationType="fade">
            <View style={styles.alertOverlay}>
                <Animated.View style={[styles.alertBox, { transform: [{ scale: alertScale }], backgroundColor: theme.card }]}>
                    
                    {/* Animación Lottie (Sad Dog) */}
                    <View style={styles.lottieContainer}>
                        <LottieView
                            source={require('../../assets/sad_anim.json')} 
                            autoPlay
                            loop
                            style={{ width: 80, height: 80 }}
                        />
                    </View>

                    <Text style={[styles.alertTitle, { color: theme.text }]}>¿Cancelar Cita?</Text>
                    <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>
                        ¿Estás seguro de cancelar esta cita? Esta acción no se puede deshacer.
                    </Text>

                    <View style={styles.alertButtons}>
                        <TouchableOpacity 
                            style={[styles.alertBtnCancel, { backgroundColor: theme.inputBackground }]} 
                            onPress={() => setShowDeleteConfirm(false)}
                        >
                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>No, Mantener</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.alertBtnConfirm} 
                            onPress={executeDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Sí, Cancelar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14 },
  listContent: { padding: 20, paddingBottom: 100 },
  
  card: {
    borderRadius: 16, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' 
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  dateContainer: { alignItems: 'center', justifyContent: 'center', width: 60 },
  dateText: { fontSize: 13, fontWeight: 'bold' },
  timeText: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  divider: { width: 1, height: '70%', marginHorizontal: 10 },
  infoContainer: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  petName: { fontSize: 16, fontWeight: 'bold' },
  serviceText: { fontSize: 12, marginVertical: 3, textTransform: 'uppercase', fontWeight: '600' },
  clientName: { fontSize: 12 },
  statusIcon: { marginLeft: 5 },
  horizontalLine: { height: 1, width: '100%' },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5 },
  actionText: { fontSize: 12, fontWeight: '600', marginLeft: 5 },
  completedState: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  completedText: { fontSize: 14, fontWeight: 'bold' },
  tapToViewText: { fontSize: 12, marginLeft: 8, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  emptySubText: { fontSize: 14 },

  // --- ESTILOS DEL MODAL ALERTA ---
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: width * 0.8,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity:0.3, elevation:10
  },
  lottieContainer: {
    marginBottom: 15,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%'
  },
  alertBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#D32F2F' // Rojo peligro
  }
});