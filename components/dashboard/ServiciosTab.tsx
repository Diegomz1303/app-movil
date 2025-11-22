import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import AppointmentDetailsModal from '../modals/AppointmentDetailsModal';
import { Cita } from './CitasTab'; // Reutilizamos el tipo Cita

export default function ServiciosTab() {
  const [servicios, setServicios] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { appointmentsTrigger } = useData();
  const { theme } = useTheme();
  
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const fetchServicios = async () => {
    if (!refreshing) setLoading(true);
    try {
      // FILTRO CLAVE: Solo traer citas con estado 'completada'
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          clientes (nombres, apellidos),
          mascotas (nombre)
        `)
        .eq('estado', 'completada') 
        .order('fecha', { ascending: false }) // Las más recientes primero
        .order('hora', { ascending: false })
        .returns<Cita[]>();

      if (!error && data) {
        setServicios(data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchServicios(); }, [appointmentsTrigger]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServicios();
  }, []);

  const openDetails = (cita: Cita) => {
    setSelectedCita(cita);
    setDetailsVisible(true);
  };

  const renderItem = ({ item }: { item: Cita }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} 
      onPress={() => openDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.leftBorder} />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
            <Text style={[styles.serviceName, { color: theme.text }]}>{item.servicio}</Text>
            <View style={styles.priceBadge}>
                <Text style={styles.priceText}>S/. {item.precio}</Text>
            </View>
        </View>
        
        <View style={styles.row}>
            <MaterialCommunityIcons name="paw" size={14} color={theme.textSecondary} />
            <Text style={[styles.petName, { color: theme.textSecondary }]}> {item.mascotas?.nombre}</Text>
            <Text style={[styles.separator, { color: theme.border }]}> | </Text>
            <MaterialCommunityIcons name="calendar-check" size={14} color={theme.textSecondary} />
            <Text style={[styles.dateText, { color: theme.textSecondary }]}> {item.fecha.split('-').reverse().join('/')}</Text>
        </View>

        <View style={styles.footerRow}>
            <Text style={[styles.clientText, { color: theme.textSecondary }]}>
                Cliente: {item.clientes?.nombres} {item.clientes?.apellidos}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Historial de Servicios</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Trabajos completados</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="history" size={60} color={COLORES.inactivo} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Sin servicios completados.</Text>
            </View>
          }
        />
      )}

      <AppointmentDetailsModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        cita={selectedCita}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold' },
  subtitle: { fontSize: 14 },
  listContent: { padding: 20, paddingBottom: 100 },
  
  card: {
    flexDirection: 'row', borderRadius: 12, marginBottom: 12,
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2
  },
  leftBorder: { width: 6, backgroundColor: COLORES.principal },
  cardContent: { flex: 1, padding: 12 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  serviceName: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  priceBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priceText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  petName: { fontWeight: '600', fontSize: 13 },
  separator: { marginHorizontal: 5 },
  dateText: { fontSize: 13 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  clientText: { fontSize: 11, fontStyle: 'italic' },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
});