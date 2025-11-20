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

// Contexto
import { useData } from '../../context/DataContext';

// Modales
import CompleteAppointmentModal from '../modals/CompleteAppointmentModal'; 
import AppointmentDetailsModal from '../modals/AppointmentDetailsModal';

// --- INTERFAZ EXACTA DE LA RESPUESTA ---
// Definimos la estructura incluyendo las relaciones (joins)
export type Cita = {
  id: number;
  fecha: string;
  hora: string;
  servicio: string;
  estado: string; // 'pendiente' | 'confirmada' | 'completada'
  notas?: string;
  
  // Campos de completado (pueden ser null)
  precio?: number | null;
  peso?: number | null;
  metodo_pago?: string | null;
  shampoo?: string | null;
  observaciones_finales?: string | null;
  foto_llegada?: string | null;
  foto_salida?: string | null;
  foto_boleta?: string | null;

  // Relaciones (Supabase las devuelve como objetos si es relación 1:1 o N:1)
  clientes: { 
    nombres: string; 
    apellidos: string; 
  } | null; // Puede ser null si se borró el cliente (depende de tu FK)
  
  mascotas: { 
    nombre: string; 
  } | null;
};

export default function CitasTab() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Consumimos contexto
  const { appointmentsTrigger, refreshAppointments } = useData();

  // Estados Modales
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  // --- CARGAR CITAS CON TIPADO ---
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
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })
        .returns<Cita[]>(); // <--- ¡MAGIA AQUÍ! Forzamos el tipo de retorno

      if (error) {
        console.error("Error cargando citas:", error.message);
        Alert.alert("Error", "No se pudieron cargar las citas.");
      } else if (data) {
        // Ahora 'data' es estrictamente de tipo Cita[], no 'any'
        setCitas(data);
      }
    } catch (err) {
      console.error("Excepción:", err);
    } finally {
      setLoading(false);
    }
  };

  // Efecto que recarga cuando cambia el trigger global
  useEffect(() => { fetchCitas(); }, [appointmentsTrigger]);

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
            const { error } = await supabase.from('citas').delete().eq('id', id);
            if (error) {
              Alert.alert("Error", error.message);
            } else {
              refreshAppointments(); // Usamos el contexto para recargar
            }
        }}
    ]);
  };

  const handleEdit = (cita: Cita) => {
    Alert.alert("Editar", "Para editar, cancela esta cita y crea una nueva.");
  };

  const handleOpenCompleteModal = (cita: Cita) => {
    setSelectedCita(cita);
    setCompleteModalVisible(true);
  };

  const handleOpenDetailsModal = (cita: Cita) => {
    setSelectedCita(cita);
    setDetailsModalVisible(true);
  };

  const handleCompletionSuccess = () => {
    refreshAppointments(); // Usamos el contexto para recargar
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: Cita }) => {
    const isCompleted = item.estado === 'completada';

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={isCompleted ? 0.7 : 1}
        onPress={() => isCompleted && handleOpenDetailsModal(item)}
      >
        
        <View style={styles.cardMain}>
            <View style={styles.dateContainer}>
                {/* Manejo seguro de fecha */}
                <Text style={styles.dateText}>
                  {item.fecha ? item.fecha.split('-').reverse().slice(0, 2).join('/') : '--/--'}
                </Text> 
                <Text style={[styles.timeText, isCompleted && { color: COLORES.principal }]}>
                    {item.hora}
                </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoContainer}>
                <View style={styles.row}>
                    <MaterialCommunityIcons name="paw" size={14} color={isCompleted ? COLORES.principal : '#FFB74D'} style={{ marginRight: 4 }} />
                    {/* Uso de Optional Chaining (?.) por seguridad */}
                    <Text style={styles.petName}>{item.mascotas?.nombre || 'Sin nombre'}</Text>
                </View>
                <Text style={styles.serviceText}>{item.servicio}</Text>
                <Text style={styles.clientName}>
                    <MaterialCommunityIcons name="account" size={12} color={COLORES.textoSecundario} /> 
                    {" "}{item.clientes ? `${item.clientes.nombres} ${item.clientes.apellidos}` : 'Cliente desconocido'}
                </Text>
            </View>

            <View style={styles.statusIcon}>
                <MaterialCommunityIcons 
                    name={isCompleted ? "check-circle" : "clock-outline"} 
                    size={28} 
                    color={isCompleted ? COLORES.principal : "#DDD"} 
                />
            </View>
        </View>

        <View style={styles.horizontalLine} />

        <View style={styles.actionsContainer}>
            
            {isCompleted ? (
                <View style={styles.completedState}>
                    <MaterialCommunityIcons name="check-all" size={20} color={COLORES.principal} style={{ marginRight: 8 }} />
                    <Text style={styles.completedText}>Cita Finalizada</Text>
                    <Text style={styles.tapToViewText}>(Toca para ver detalles)</Text>
                </View>
            ) : (
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

      <CompleteAppointmentModal 
         visible={completeModalVisible}
         onClose={() => setCompleteModalVisible(false)}
         citaId={selectedCita?.id || null}
         mascotaNombre={selectedCita?.mascotas?.nombre || ''}
         onSuccess={handleCompletionSuccess}
       />

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