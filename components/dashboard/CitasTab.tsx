import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

// Modales
import CompleteAppointmentModal from '../modals/CompleteAppointmentModal'; 
import AppointmentDetailsModal from '../modals/AppointmentDetailsModal'; // <--- IMPORTAR NUEVO MODAL

// Tipo de dato actualizado con los nuevos campos
type Cita = {
  id: number;
  fecha: string;
  hora: string;
  servicio: string;
  estado: string; // 'pendiente' | 'confirmada' | 'completada'
  
  // Campos de completado
  precio?: number;
  peso?: number;
  metodo_pago?: string;
  shampoo?: string;
  observaciones_finales?: string;
  foto_llegada?: string;
  foto_salida?: string;
  foto_boleta?: string;

  // Relaciones
  clientes: { nombres: string; apellidos: string; };
  mascotas: { nombre: string; };
};

export default function CitasTab({ refreshTrigger }: { refreshTrigger: number }) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados Modales
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false); // <--- ESTADO NUEVO MODAL
  
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  // --- CARGAR CITAS (Query Actualizada) ---
  const fetchCitas = async () => {
    if (!refreshing) setLoading(true);

    const { data, error } = await supabase
      .from('citas')
      .select(`
        *,
        clientes (nombres, apellidos),
        mascotas (nombre)
      `)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (error) {
      console.error("Error cargando citas:", error);
    } else {
      setCitas(data as any);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCitas(); }, [refreshTrigger]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCitas();
    setRefreshing(false);
  }, []);

  // --- MANEJADORES ---

  const handleCancel = (id: number) => {
    Alert.alert("Cancelar Cita", "¿Estás seguro de eliminar esta cita?", [
        { text: "No", style: "cancel" },
        { text: "Sí, Eliminar", style: "destructive", onPress: async () => {
            await supabase.from('citas').delete().eq('id', id);
            fetchCitas();
        }}
    ]);
  };

  const handleEdit = (cita: Cita) => {
    Alert.alert("Editar", "Para editar, cancela esta cita y crea una nueva.");
  };

  // Abrir modal para COMPLETAR (Acción)
  const handleOpenCompleteModal = (cita: Cita) => {
    setSelectedCita(cita);
    setCompleteModalVisible(true);
  };

  // Abrir modal para VER DETALLES (Lectura)
  const handleOpenDetailsModal = (cita: Cita) => {
    setSelectedCita(cita);
    setDetailsModalVisible(true);
  };

  const handleCompletionSuccess = () => {
    fetchCitas();
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: Cita }) => {
    const isCompleted = item.estado === 'completada';

    return (
      // AHORA LA TARJETA ENTERA ES TOUCHABLE SI ESTÁ COMPLETADA
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={isCompleted ? 0.7 : 1} // Solo efecto visual si está completada
        onPress={() => isCompleted && handleOpenDetailsModal(item)} // Abrir detalles
      >
        
        {/* Parte Superior: Info */}
        <View style={styles.cardMain}>
            <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{item.fecha.split('-').reverse().slice(0, 2).join('/')}</Text> 
                <Text style={[styles.timeText, isCompleted && { color: COLORES.principal }]}>
                    {item.hora}
                </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoContainer}>
                <View style={styles.row}>
                    <MaterialCommunityIcons name="paw" size={14} color={isCompleted ? COLORES.principal : '#FFB74D'} style={{ marginRight: 4 }} />
                    <Text style={styles.petName}>{item.mascotas?.nombre || 'Sin nombre'}</Text>
                </View>
                <Text style={styles.serviceText}>{item.servicio}</Text>
                <Text style={styles.clientName}>
                    <MaterialCommunityIcons name="account" size={12} color={COLORES.textoSecundario} /> 
                    {" "}{item.clientes?.nombres} {item.clientes?.apellidos}
                </Text>
            </View>

            {/* Icono de Estado */}
            <View style={styles.statusIcon}>
                <MaterialCommunityIcons 
                    name={isCompleted ? "check-circle" : "clock-outline"} 
                    size={28} 
                    color={isCompleted ? COLORES.principal : "#DDD"} 
                />
            </View>
        </View>

        {/* Línea Separadora */}
        <View style={styles.horizontalLine} />

        {/* Parte Inferior: Acciones o Estado */}
        <View style={styles.actionsContainer}>
            
            {isCompleted ? (
                // ESTADO: COMPLETADA (Texto + Indicador visual de "Ver más")
                <View style={styles.completedState}>
                    <MaterialCommunityIcons name="check-all" size={20} color={COLORES.principal} style={{ marginRight: 8 }} />
                    <Text style={styles.completedText}>Cita Finalizada</Text>
                    <Text style={styles.tapToViewText}>(Toca para ver detalles)</Text>
                </View>
            ) : (
                // ESTADO: PENDIENTE
                <>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORES.textoSecundario} />
                        <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenCompleteModal(item)}>
                        <MaterialCommunityIcons name="check" size={18} color={COLORES.principal} />
                        <Text style={[styles.actionText, { color: COLORES.principal }]}>Completar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleCancel(item.id)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORES.danger} />
                        <Text style={[styles.actionText, { color: COLORES.danger }]}>Cancelar</Text>
                    </TouchableOpacity>
                </>
            )}

        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Citas</Text>
        <Text style={styles.subtitle}>Próximas atenciones programadas</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORES.principal} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={citas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORES.principal]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color={COLORES.inactivo} />
              <Text style={styles.emptyText}>No hay citas pendientes.</Text>
              <Text style={styles.emptySubText}>Agenda una nueva con el botón (+).</Text>
            </View>
          }
        />
      )}

      {/* Modal de Completar (Escritura) */}
      <CompleteAppointmentModal 
         visible={completeModalVisible}
         onClose={() => setCompleteModalVisible(false)}
         citaId={selectedCita?.id || null}
         mascotaNombre={selectedCita?.mascotas?.nombre || ''}
         onSuccess={handleCompletionSuccess}
       />

       {/* Modal de Detalles (Lectura) */}
       <AppointmentDetailsModal
         visible={detailsModalVisible}
         onClose={() => setDetailsModalVisible(false)}
         cita={selectedCita}
       />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondoGris },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORES.texto },
  subtitle: { fontSize: 14, color: COLORES.textoSecundario },
  listContent: { padding: 20, paddingBottom: 100 },
  
  card: {
    backgroundColor: COLORES.fondoBlanco, borderRadius: 16, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' 
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  dateContainer: { alignItems: 'center', justifyContent: 'center', width: 60 },
  dateText: { fontSize: 13, fontWeight: 'bold', color: COLORES.textoSecundario },
  timeText: { fontSize: 16, fontWeight: 'bold', color: '#555', marginTop: 2 },
  divider: { width: 1, height: '70%', backgroundColor: '#EEE', marginHorizontal: 10 },
  infoContainer: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  petName: { fontSize: 16, fontWeight: 'bold', color: COLORES.texto },
  serviceText: { fontSize: 12, color: COLORES.textoSecundario, marginVertical: 3, textTransform: 'uppercase', fontWeight: '600' },
  clientName: { fontSize: 12, color: '#999' },
  statusIcon: { marginLeft: 5 },
  horizontalLine: { height: 1, backgroundColor: '#F5F5F5', width: '100%' },

  actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#FAFAFA' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5 },
  actionText: { fontSize: 12, fontWeight: '600', color: COLORES.textoSecundario, marginLeft: 5 },

  completedState: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  completedText: { fontSize: 14, fontWeight: 'bold', color: COLORES.principal },
  tapToViewText: { fontSize: 12, color: '#999', marginLeft: 8, fontStyle: 'italic' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORES.textoSecundario, marginTop: 10 },
  emptySubText: { fontSize: 14, color: COLORES.inactivo },
});