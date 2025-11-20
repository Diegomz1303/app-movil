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
import ClientDetailsModal, { Cliente } from '../modals/ClientDetailsModal';
import { useData } from '../../context/DataContext';
import AddPetModal from '../modals/AddPetModal';

// 1. Importamos el hook del tema
import { useTheme } from '../../context/ThemeContext'; 

export default function ClientesTab() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { clientsTrigger, refreshClients } = useData();
  const { theme } = useTheme(); // 2. Usamos el tema
  
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [addPetVisible, setAddPetVisible] = useState(false); 

  const fetchClientes = async () => {
    if (!refreshing) setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setClientes(data);
    setLoading(false);
  };

  useEffect(() => { fetchClientes(); }, [clientsTrigger]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClientes();
    setRefreshing(false);
  }, []);

  const deleteClient = async (id: number) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) Alert.alert("Error", error.message);
    else refreshClients();
  };

  const handlePressClient = (cliente: Cliente) => {
    setSelectedClient(cliente);
    setDetailsVisible(true);
  };

  const handleOpenAddPet = () => {
    setDetailsVisible(false);
    setTimeout(() => {
        setAddPetVisible(true);
    }, 300); 
  };

  const renderItem = ({ item }: { item: Cliente }) => (
    <TouchableOpacity 
      // 3. Fondo de tarjeta dinámico (Blanco en modo claro, Gris en oscuro)
      style={[styles.card, { backgroundColor: theme.card }]} 
      activeOpacity={0.7} 
      onPress={() => handlePressClient(item)}
    >
      {/* Icono con fondo dinámico */}
      <View style={[styles.cardIcon, { backgroundColor: theme.inputBackground }]}>
        <MaterialCommunityIcons name="account" size={28} color={theme.primary} />
      </View>
      
      <View style={styles.cardContent}>
        {/* Textos dinámicos */}
        <Text style={[styles.clientName, { color: theme.text }]}>
            {item.nombres} {item.apellidos}
        </Text>
        {item.numero_documento ? (
          <Text style={[styles.docInfo, { color: theme.textSecondary }]}>
              {item.tipo_documento}: {item.numero_documento}
          </Text>
        ) : null}
        {item.telefono ? (
          <Text style={[styles.phone, { color: theme.textSecondary }]}>
            <MaterialCommunityIcons name="phone" size={12} /> {item.telefono}
          </Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  return (
    // 4. IMPORTANTE: Fondo transparente para que se vea el patrón de atrás
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Directorio</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Tus clientes registrados</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={clientes}
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
              <MaterialCommunityIcons name="account-search" size={60} color={COLORES.inactivo} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Sin clientes aún.</Text>
              <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>Usa el botón central (+) para agregar.</Text>
            </View>
          }
        />
      )}

      <ClientDetailsModal 
        visible={detailsVisible} 
        cliente={selectedClient} 
        onClose={() => setDetailsVisible(false)} 
        onDelete={deleteClient}
        onAddPetPress={handleOpenAddPet} 
      />

      <AddPetModal
        visible={addPetVisible}
        onClose={() => setAddPetVisible(false)}
        clientId={selectedClient?.id} 
        onPetAdded={() => console.log("Mascota agregada")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, // Quitamos el color de fondo fijo
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold' },
  subtitle: { fontSize: 14 },
  listContent: { padding: 20, paddingBottom: 100 },
  card: {
    borderRadius: 16, padding: 15, marginBottom: 15,
    flexDirection: 'row', alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  cardIcon: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  cardContent: { flex: 1 },
  clientName: { fontSize: 18, fontWeight: 'bold' },
  docInfo: { fontSize: 13, marginTop: 2 },
  phone: { fontSize: 13, marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  emptySubText: { fontSize: 14 },
});