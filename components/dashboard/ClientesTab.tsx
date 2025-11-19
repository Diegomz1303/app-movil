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
// Importamos el Modal y el tipo Cliente
import ClientDetailsModal, { Cliente } from '../modals/ClientDetailsModal';

export default function ClientesTab({ refreshTrigger }: { refreshTrigger: number }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para el Modal de Detalle
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const fetchClientes = async () => {
    if (!refreshing) setLoading(true);
    
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClientes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, [refreshTrigger]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClientes();
    setRefreshing(false);
  }, []);

  // --- ESTA ES LA FUNCIÓN QUE TE FALTABA ---
  const deleteClient = async (id: number) => {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) {
      Alert.alert("Error", "No se pudo eliminar al cliente: " + error.message);
    } else {
      // Recargamos la lista para que desaparezca el eliminado
      fetchClientes();
    }
  };
  // -----------------------------------------

  const handlePressClient = (cliente: Cliente) => {
    setSelectedClient(cliente);
    setDetailsVisible(true);
  };

  const renderItem = ({ item }: { item: Cliente }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7} 
      onPress={() => handlePressClient(item)}
    >
      <View style={styles.cardIcon}>
        <MaterialCommunityIcons name="account" size={28} color={COLORES.principalDark} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.clientName}>
          {item.nombres} {item.apellidos}
        </Text>
        {item.numero_documento ? (
          <Text style={styles.docInfo}>{item.tipo_documento}: {item.numero_documento}</Text>
        ) : null}
        {item.telefono ? (
          <Text style={styles.phone}><MaterialCommunityIcons name="phone" size={12} /> {item.telefono}</Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORES.inactivo} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Directorio</Text>
          <Text style={styles.subtitle}>Tus clientes registrados</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORES.principal} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORES.principal]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-search" size={60} color={COLORES.inactivo} />
              <Text style={styles.emptyText}>Sin clientes aún.</Text>
              <Text style={styles.emptySubText}>Usa el botón central (+) para agregar.</Text>
            </View>
          }
        />
      )}

      {/* Modal de Detalle: AHORA SÍ PASAMOS LA FUNCIÓN onDelete */}
      <ClientDetailsModal 
        visible={detailsVisible} 
        cliente={selectedClient} 
        onClose={() => setDetailsVisible(false)} 
        onDelete={deleteClient} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondoGris },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORES.texto },
  subtitle: { fontSize: 14, color: COLORES.textoSecundario },
  listContent: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: COLORES.fondoBlanco, borderRadius: 16, padding: 15, marginBottom: 15,
    flexDirection: 'row', alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  cardIcon: {
    backgroundColor: COLORES.fondoGris, width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  cardContent: { flex: 1 },
  clientName: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto },
  docInfo: { fontSize: 13, color: COLORES.textoSecundario, marginTop: 2 },
  phone: { fontSize: 13, color: COLORES.textoSecundario, marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORES.textoSecundario, marginTop: 10 },
  emptySubText: { fontSize: 14, color: COLORES.inactivo },
});