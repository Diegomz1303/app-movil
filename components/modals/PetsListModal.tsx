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

// 1. Importar ThemeContext
import { useTheme } from '../../context/ThemeContext';

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
  const [pets, setPets] = useState<PetData[]>([]);

  // 2. Usar tema
  const { theme, isDark } = useTheme();

  const fetchPets = async (searchTerm: string = '') => {
    setLoading(true);
    
    try {
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
        .limit(50); 

      if (searchTerm.trim().length > 0) {
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

  useEffect(() => {
    if (visible) {
      setSearch('');
      fetchPets('');
    }
  }, [visible]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (visible) {
        fetchPets(search);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, visible]);

  // Estilos dinámicos
  const textColor = { color: theme.text };
  const textSecondary = { color: theme.textSecondary };
  const inputBg = { backgroundColor: theme.inputBackground };
  const cardBg = { backgroundColor: theme.card, borderColor: theme.border };

  const renderItem = ({ item }: { item: PetData }) => (
    <TouchableOpacity style={[styles.petCard, cardBg]} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {item.foto_url ? (
          <Image source={{ uri: item.foto_url }} style={[styles.petImage, { borderColor: theme.border }]} />
        ) : (
          <View style={[styles.petIconBg, { backgroundColor: theme.inputBackground }]}>
            <MaterialCommunityIcons name="dog" size={24} color={theme.primary} />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.petName, textColor]}>{item.nombre}</Text>
        <Text style={[styles.petInfo, textSecondary]}>{item.raza}</Text>
        
        <View style={styles.ownerRow}>
          <MaterialCommunityIcons name="account" size={12} color={theme.textSecondary} />
          <Text style={[styles.ownerText, textSecondary]}>{item.ownerName}</Text>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
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
      {/* Fondo del Modal Dinámico */}
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, textColor]}>Directorio de Mascotas</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Buscador */}
        <View style={[styles.searchContainer, inputBg]}>
          <MaterialCommunityIcons name="magnify" size={24} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, textColor]}
            placeholder="Buscar nombre o raza..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
               <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
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
                <Text style={[styles.emptyText, textSecondary]}>No hay mascotas encontradas.</Text>
                <Text style={[styles.emptySubText, textSecondary]}>
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
  title: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { padding: 5 },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 12, height: 45,
    marginBottom: 15,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  
  listContent: { paddingBottom: 10 },
  
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginTop: 15 },
  emptySubText: { fontSize: 13, textAlign: 'center', marginTop: 5 },

  petCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, marginBottom: 10,
    borderRadius: 12, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: {width:0, height:2}, elevation: 1
  },
  avatarContainer: { marginRight: 12 },
  petIconBg: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center'
  },
  petImage: {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1
  },
  infoContainer: { flex: 1 },
  petName: { fontSize: 16, fontWeight: 'bold' },
  petInfo: { fontSize: 13, marginBottom: 2 },
  ownerRow: { flexDirection: 'row', alignItems: 'center' },
  ownerText: { fontSize: 12, marginLeft: 4 },
});