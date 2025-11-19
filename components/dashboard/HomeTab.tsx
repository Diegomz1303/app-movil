import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import AddClientModal from '../modals/AddClientModal';

// Definimos el NUEVO tipo de dato Cliente basado en tu nueva tabla
type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  tipo_documento: string;
  numero_documento: string;
};

export default function HomeTab() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
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
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClientes();
    setRefreshing(false);
  }, []);

  // Renderizado de la tarjeta (Ahora muestra datos del cliente, no mascota)
  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        {/* Icono de Persona ahora, ya que registramos clientes humanos */}
        <MaterialCommunityIcons name="account" size={28} color={COLORES.principalDark} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.clientName}>
          {item.nombres || 'Sin nombre'} {item.apellidos || ''}
        </Text>
        
        {item.numero_documento ? (
          <Text style={styles.docInfo}>
            {item.tipo_documento}: {item.numero_documento}
          </Text>
        ) : null}

        {item.telefono ? (
          <Text style={styles.phone}>
            <MaterialCommunityIcons name="phone" size={12} /> {item.telefono}
          </Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORES.inactivo} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Clientes</Text>
          <Text style={styles.subtitle}>Lista de registrados</Text>
        </View>
        {/* Botón pequeño header */}
        <TouchableOpacity 
          style={styles.addButtonHeader} 
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORES.textoSobrePrincipal} />
        </TouchableOpacity>
      </View>

      {/* Lista */}
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
              <MaterialCommunityIcons name="account-off" size={60} color={COLORES.inactivo} />
              <Text style={styles.emptyText}>No hay clientes.</Text>
              <Text style={styles.emptySubText}>Agrega uno usando el botón +</Text>
            </View>
          }
        />
      )}

      {/* Modal de Registro */}
      <AddClientModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        onClientAdded={fetchClientes} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORES.fondoGris,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORES.texto,
  },
  subtitle: {
    fontSize: 14,
    color: COLORES.textoSecundario,
  },
  addButtonHeader: {
    backgroundColor: COLORES.principal,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORES.fondoBlanco,
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardIcon: {
    backgroundColor: COLORES.fondoGris,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORES.texto,
  },
  docInfo: {
    fontSize: 13,
    color: COLORES.textoSecundario,
    marginTop: 2,
  },
  phone: {
    fontSize: 13,
    color: COLORES.textoSecundario,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORES.textoSecundario,
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORES.inactivo,
  },
});