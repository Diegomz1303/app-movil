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

// Contextos
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext'; // <--- 1. Importar ThemeContext

// Modales
import CompleteAppointmentModal from '../modals/CompleteAppointmentModal'; 
import AppointmentDetailsModal from '../modals/AppointmentDetailsModal';

// Tipo de dato
export type Cita = {
  id: number;
  fecha: string;
  hora: string;
  servicio: string;
  estado: string;
  notas?: string;
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
  const { theme } = useTheme(); // <--- 2. Usar el tema

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

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

  const handleCancel = (id: number) => {
    Alert.alert("Cancelar Cita", "¿Estás seguro de eliminar esta cita?", [
        { text: "No", style: "cancel" },
        { text: "Sí, Eliminar", style: "destructive", onPress: async () => {
            const { error } = await supabase.from('citas').delete().eq('id', id);
            if (error) Alert.alert("Error", error.message);
            else refreshAppointments();
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
    refreshAppointments();
  };

  const renderItem = ({ item }: { item: Cita }) => {
    const isCompleted = item.estado === 'completada';

    return (
      <TouchableOpacity 
        // 3. Fondo de tarjeta dinámico
        style={[styles.card, { backgroundColor: theme.card }]} 
        activeOpacity={isCompleted ? 0.7 : 1}
        onPress={() => isCompleted && handleOpenDetailsModal(item)}
      >
        
        <View style={styles.cardMain}>
            <View style={styles.dateContainer}>
                {/* Textos con color del tema */}
                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                  {item.fecha ? item.fecha.split('-').reverse().slice(0, 2).join('/') : '--/--'}
                </Text> 
                <Text style={[styles.timeText, { color: isCompleted ? theme.primary : theme.text }]}>
                    {item.hora}
                </Text>
            </View>

            {/* Divisor dinámico */}
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

        {/* Fondo de acciones dinámico */}
        <View style={[styles.actionsContainer, { backgroundColor: theme.inputBackground }]}>
            
            {isCompleted ? (
                <View style={styles.completedState}>
                    <MaterialCommunityIcons name="check-all" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.completedText, { color: theme.primary }]}>Cita Finalizada</Text>
                    <Text style={[styles.tapToViewText, { color: theme.textSecondary }]}>(Toca para ver detalles)</Text>
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

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleCancel(item.id)}>
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
    // 4. Fondo transparente para ver el patrón
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Mis Citas</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Próximas atenciones programadas</Text>
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
  container: { flex: 1 }, // Sin color de fondo fijo
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
});