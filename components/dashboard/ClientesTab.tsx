import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  tipo_documento: string;
  numero_documento: string;
};

// --- ¡AQUÍ ES DONDE OCURRE LA MAGIA! ---
// Debemos decirle al componente que va a recibir "refreshTrigger" que es un número.
export default function ClientesTab({ refreshTrigger }: { refreshTrigger: number }) {
// ---------------------------------------

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Este useEffect "escucha" cambios en refreshTrigger para recargar la lista
  useEffect(() => {
    fetchClientes();
  }, [refreshTrigger]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClientes();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={styles.card}>
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
    </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondoGris },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 }, // Ajustado para bajar el título
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