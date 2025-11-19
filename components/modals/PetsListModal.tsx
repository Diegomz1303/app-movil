import React, { useState, useEffect } from 'react';
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

// Definimos el tipo de datos que esperamos de Supabase
type PetData = {
  id: number;
  nombre: string;
  raza: string;
  foto_url?: string | null;
  clientes?: {
    nombres: string;
    apellidos: string;
  };
  // Campo auxiliar para el filtrado
  ownerName?: string;
};

export default function PetsListModal({ visible, onClose }: PetsListModalProps) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dos estados: uno para la lista completa original y otro para la filtrada
  const [allPets, setAllPets] = useState<PetData[]>([]);
  const [filteredPets, setFilteredPets] = useState<PetData[]>([]);

  // 1. Función para cargar mascotas REALES desde Supabase
  const fetchPets = async () => {
    setLoading(true);
    
    // Hacemos SELECT a 'mascotas' y traemos datos del cliente relacionado
    const { data, error } = await supabase
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
      .order('created_at', { ascending: false }); // Las más recientes primero

    if (error) {
      console.error('Error al cargar mascotas:', error);
    } else {
      // Procesamos los datos para facilitar el uso del nombre del dueño
      const formattedData: PetData[] = (data || []).map((item: any) => ({
        ...item,
        ownerName: item.clientes 
          ? `${item.clientes.nombres} ${item.clientes.apellidos}` 
          : 'Sin dueño'
      }));

      setAllPets(formattedData);
      setFilteredPets(formattedData); // Al inicio mostramos todas
    }
    setLoading(false);
  };

  // 2. Cargar datos al abrir el modal
  useEffect(() => {
    if (visible) {
      fetchPets();
      setSearch(''); // Limpiamos la búsqueda anterior
    }
  }, [visible]);

  // 3. Filtrado en tiempo real (Local)
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredPets(allPets);
    } else {
      const lowerSearch = search.toLowerCase();
      const filtered = allPets.filter(pet => 
        pet.nombre.toLowerCase().includes(lowerSearch) ||
        pet.raza.toLowerCase().includes(lowerSearch) ||
        (pet.ownerName && pet.ownerName.toLowerCase().includes(lowerSearch))
      );
      setFilteredPets(filtered);
    }
  }, [search, allPets]);

  const renderItem = ({ item }: { item: PetData }) => (
    <TouchableOpacity style={styles.petCard} activeOpacity={0.7}>
      {/* Avatar: Si tiene foto la muestra, si no, icono por defecto */}
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
            placeholder="Buscar nombre, raza o dueño..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
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
            data={filteredPets}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="paw-off" size={50} color={COLORES.inactivo} />
                <Text style={styles.emptyText}>No hay mascotas encontradas.</Text>
                <Text style={styles.emptySubText}>
                  Prueba con otro nombre o registra una nueva.
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
  
  // Empty State
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: COLORES.textoSecundario, marginTop: 15 },
  emptySubText: { 
    fontSize: 13, color: '#999', textAlign: 'center', marginTop: 5 
  },

  // Pet Card
  petCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, marginBottom: 10,
    backgroundColor: '#FFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#F0F0F0',
    // Sombra suave
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