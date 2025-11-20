import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

const { height, width } = Dimensions.get('window');

interface PetsListModalProps {
  visible: boolean;
  onClose: () => void;
}

type PetData = {
  id: number;
  nombre: string;
  raza: string;
  foto_url?: string | null;
  clientes?: {
    nombres: string;
    apellidos: string;
  };
  ownerName?: string;
};

export default function PetsListModal({ visible, onClose }: PetsListModalProps) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Ya no necesitamos 'allPets' y 'filteredPets' por separado.
  // Solo una lista que contiene lo que traiga la base de datos.
  const [pets, setPets] = useState<PetData[]>([]);

  // Función optimizada que recibe el término de búsqueda
  const fetchPets = async (searchTerm: string = '') => {
    setLoading(true);
    
    try {
      // 1. Iniciamos la consulta base
      let query = supabase
        .from('mascotas')
        .select(`
          id,
          nombre,
          raza,
          foto_url,
          clientes (
            nombres,
            apellidos
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50); // BUENA PRÁCTICA: Traer solo los primeros 50 resultados para no saturar

      // 2. Si hay texto, aplicamos el filtro 'ilike' (insensible a mayúsculas/minúsculas)
      if (searchTerm.trim().length > 0) {
        // Buscamos por nombre de mascota O raza
        // Nota: Buscar por nombre de dueño dentro de una relación requiere lógica más compleja en Supabase,
        // por rendimiento nos enfocamos aquí en los datos directos de la mascota.
        query = query.or(`nombre.ilike.%${searchTerm}%,raza.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al cargar mascotas:', error);
      } else {
        const formattedData: PetData[] = (data || []).map((item: any) => ({
          ...item,
          ownerName: item.clientes 
            ? `${item.clientes.nombres} ${item.clientes.apellidos}` 
            : 'Sin dueño'
        }));
        setPets(formattedData);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Cargar datos iniciales al abrir
  useEffect(() => {
    if (visible) {
      setSearch('');
      fetchPets(''); // Carga inicial sin filtros
    }
  }, [visible]);

  // 2. DEBOUNCE: Efecto inteligente para la búsqueda
  useEffect(() => {
    // Creamos un temporizador que espera 500ms antes de ejecutar la búsqueda
    const delayDebounceFn = setTimeout(() => {
      if (visible) {
        fetchPets(search);
      }
    }, 500);

    // Si el usuario sigue escribiendo antes de los 500ms, limpiamos el temporizador anterior
    return () => clearTimeout(delayDebounceFn);
  }, [search, visible]);

  const renderItem = ({ item }: { item: PetData }) => (
    <TouchableOpacity style={styles.petCard} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {item.foto_url ? (
          <Image source={{ uri: item.foto_url }} style={styles.petImage} />
        ) : (
          <View style={styles.petIconBg}>
            <MaterialCommunityIcons name="dog" size={24} color={COLORES.principal} />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.petName}>{item.nombre}</Text>
        <Text style={styles.petInfo}>{item.raza}</Text>
        
        <View style={styles.ownerRow}>
          <MaterialCommunityIcons name="account" size={12} color={COLORES.textoSecundario} />
          <Text style={styles.ownerText}>{item.ownerName}</Text>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORES.inactivo} />
    </TouchableOpacity>
  );

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="bounceIn"
      animationOut="bounceOut"
      useNativeDriver
      style={styles.modalCentered}
      propagateSwipe
      backdropOpacity={0.6}
    >
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Directorio de Mascotas</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={COLORES.textoSecundario} />
          </TouchableOpacity>
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORES.textoSecundario} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar nombre o raza..." // Actualizado para reflejar el filtro real
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch} // Solo actualiza el estado, el useEffect maneja la llamada API
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
               <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORES.principal} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={pets}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="paw-off" size={50} color={COLORES.inactivo} />
                <Text style={styles.emptyText}>No hay mascotas encontradas.</Text>
                <Text style={styles.emptySubText}>
                  Intenta con otro término.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalCentered: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    margin: 0, 
  },
  container: {
    backgroundColor: COLORES.fondoBlanco,
    borderRadius: 25, 
    padding: 20,
    width: width * 0.9, 
    maxHeight: height * 0.8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 5,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 15,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORES.texto },
  closeButton: { padding: 5 },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORES.fondoGris,
    borderRadius: 12, paddingHorizontal: 12, height: 45,
    marginBottom: 15,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: COLORES.texto },
  
  listContent: { paddingBottom: 10 },
  
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: COLORES.textoSecundario, marginTop: 15 },
  emptySubText: { 
    fontSize: 13, color: '#999', textAlign: 'center', marginTop: 5 
  },

  petCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, marginBottom: 10,
    backgroundColor: '#FFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: {width:0, height:2}, elevation: 1
  },
  avatarContainer: { marginRight: 12 },
  petIconBg: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORES.fondoGris,
    alignItems: 'center', justifyContent: 'center'
  },
  petImage: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORES.fondoGris,
  },
  infoContainer: { flex: 1 },
  petName: { fontSize: 16, fontWeight: 'bold', color: COLORES.texto },
  petInfo: { fontSize: 13, color: COLORES.textoSecundario, marginBottom: 2 },
  ownerRow: { flexDirection: 'row', alignItems: 'center' },
  ownerText: { fontSize: 12, color: '#999', marginLeft: 4 },
});