import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

// 1. Importamos el hook del tema
import { useTheme } from '../../context/ThemeContext';

import PetDetailsModal, { Mascota } from './PetDetailsModal';

const { width, height } = Dimensions.get('window');

export type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  telefono: string;
  tipo_documento: string;
  numero_documento: string;
  distrito?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
};

interface ClientDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onDelete: (id: number) => void;
  onAddPetPress: () => void;
}

export default function ClientDetailsModal({ 
  visible, 
  onClose, 
  cliente, 
  onDelete, 
  onAddPetPress 
}: ClientDetailsModalProps) {
  
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // 2. Usamos el tema
  const { theme, isDark } = useTheme();

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Mascota | null>(null);
  const [petDetailsVisible, setPetDetailsVisible] = useState(false);

  useEffect(() => {
    if (visible && cliente) {
      setShowConfirmDelete(false);
      fetchMascotas(cliente.id);
      
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, cliente]);

  const fetchMascotas = async (clienteId: number) => {
    setLoadingPets(true);
    const { data, error } = await supabase
        .from('mascotas')
        .select('*')
        .eq('cliente_id', clienteId);
    
    if (!error && data) {
        setMascotas(data);
    }
    setLoadingPets(false);
  };

  const handlePetPress = (pet: Mascota) => {
      setSelectedPet(pet);
      setPetDetailsVisible(true);
  };

  const handleDeletePress = () => setShowConfirmDelete(true);

  const confirmDelete = async () => {
    if (!cliente) return;
    setDeleting(true);
    await onDelete(cliente.id);
    setDeleting(false);
    setShowConfirmDelete(false);
    onClose();
  };

  if (!cliente) return null;

  // Estilos dinámicos
  const textColor = { color: theme.text };
  const textSecondary = { color: theme.textSecondary };
  const dividerColor = { backgroundColor: theme.border };

  return (
    <>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

        {/* Fondo del Modal Dinámico */}
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
             <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[
                styles.avatarContainer, 
                { 
                    backgroundColor: isDark ? '#333' : '#F0F9F0', 
                    borderColor: theme.card 
                }
            ]}>
               <MaterialCommunityIcons name="account" size={50} color={theme.primary} />
            </View>
            <Text style={[styles.clientName, textColor]}>{cliente.nombres} {cliente.apellidos}</Text>
            <View style={styles.locationContainer}>
                <MaterialCommunityIcons name="map-marker" size={14} color={theme.textSecondary} />
                <Text style={[styles.clientLocation, textSecondary]}>{cliente.distrito || 'Sin distrito'}</Text>
            </View>
          </View>

          {/* Info Detalles con fondo dinámico */}
          <View style={[styles.infoBox, { backgroundColor: theme.inputBackground }]}>
            <View style={styles.infoRow}>
               <MaterialCommunityIcons name="phone" size={18} color={theme.text} />
               <Text style={[styles.infoText, textColor]}>{cliente.telefono}</Text>
            </View>
            <View style={[styles.divider, dividerColor]} />
            <View style={styles.infoRow}>
               <MaterialCommunityIcons name="card-account-details-outline" size={18} color={theme.text} />
               <Text style={[styles.infoText, textColor]}>{cliente.tipo_documento}: {cliente.numero_documento}</Text>
            </View>
          </View>

          {/* --- SECCIÓN DE MASCOTAS --- */}
          <View style={styles.petsSection}>
            <Text style={[styles.sectionTitle, textSecondary]}>Sus Mascotas</Text>
            
            {loadingPets ? (
                <ActivityIndicator size="small" color={theme.primary} />
            ) : mascotas.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
                    {mascotas.map((pet) => (
                        <TouchableOpacity 
                            key={pet.id} 
                            style={[
                                styles.petChip, 
                                { backgroundColor: theme.inputBackground, borderColor: theme.border }
                            ]} 
                            onPress={() => handlePetPress(pet)}
                        >
                            {pet.foto_url ? (
                                <Image source={{ uri: pet.foto_url }} style={[styles.petThumb, { borderColor: theme.card }]} />
                            ) : (
                                <View style={[styles.petIconBg, { backgroundColor: theme.border }]}>
                                    <MaterialCommunityIcons name="dog" size={20} color={theme.textSecondary} />
                                </View>
                            )}
                            <View style={styles.petChipInfo}>
                                <Text style={[styles.petChipName, textColor]} numberOfLines={1}>{pet.nombre}</Text>
                                <Text style={[styles.petChipBreed, textSecondary]} numberOfLines={1}>{pet.raza}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <Text style={[styles.noPetsText, textSecondary]}>No tiene mascotas registradas.</Text>
            )}
          </View>

          {/* Botones de Acción */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.addPetButton} onPress={onAddPetPress}>
              <MaterialCommunityIcons name="paw" size={20} color={COLORES.textoSobrePrincipal} />
              <Text style={styles.addPetButtonText}>Agregar Mascota</Text>
            </TouchableOpacity>

            {!showConfirmDelete ? (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
                 <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.danger} style={{ marginRight: 5 }} />
                 <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Eliminar Cliente</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.confirmBox, { backgroundColor: isDark ? '#3a2a2a' : '#FFEBEE' }]}>
                <Text style={[styles.confirmText, { color: theme.danger }]}>¿Seguro de eliminar?</Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity 
                    style={[styles.cancelDeleteBtn, { backgroundColor: theme.card }]} 
                    onPress={() => setShowConfirmDelete(false)}
                  >
                    <Text style={{color: theme.text}}>No</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmDeleteBtn} onPress={confirmDelete} disabled={deleting}>
                    {deleting ? <ActivityIndicator color="white" size="small"/> : <Text style={{color: 'white', fontWeight: 'bold'}}>Sí</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>

    <PetDetailsModal 
        visible={petDetailsVisible}
        mascota={selectedPet}
        onClose={() => setPetDetailsVisible(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: {
    width: width * 0.85, 
    borderRadius: 25, padding: 20, paddingTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10,
    alignItems: 'center'
  },
  closeIcon: { alignSelf: 'flex-end', padding: 10 },
  header: { alignItems: 'center', marginBottom: 15, width: '100%' },
  avatarContainer: {
    width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    borderWidth: 2, shadowOpacity: 0.1, elevation: 2
  },
  clientName: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  clientLocation: { fontSize: 13, marginLeft: 4 },

  infoBox: { width: '100%', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 15, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  infoText: { fontSize: 14, marginLeft: 12, flex: 1 },
  divider: { height: 1, width: '100%' },

  petsSection: { width: '100%', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  noPetsText: { fontStyle: 'italic', fontSize: 13 },
  
  petChip: {
      flexDirection: 'row', alignItems: 'center',
      padding: 8, borderRadius: 30, marginRight: 10, borderWidth: 1,
      minWidth: 130
  },
  petThumb: { width: 40, height: 40, borderRadius: 20, borderWidth: 1 },
  petIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  petChipInfo: { marginLeft: 8 },
  petChipName: { fontSize: 14, fontWeight: 'bold' },
  petChipBreed: { fontSize: 10 },

  actionsContainer: { width: '100%', gap: 10 },
  addPetButton: {
    backgroundColor: COLORES.principal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, shadowColor: COLORES.principal, shadowOpacity: 0.3, elevation: 3
  },
  addPetButtonText: { color: COLORES.textoSobrePrincipal, fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  deleteButtonText: { fontSize: 14, fontWeight: '600' },

  confirmBox: { alignItems: 'center', marginTop: 5, padding: 8, borderRadius: 10, width: '100%' },
  confirmText: { fontWeight: 'bold', marginBottom: 5, fontSize: 13 },
  confirmButtons: { flexDirection: 'row', gap: 10 },
  cancelDeleteBtn: { paddingHorizontal: 15, paddingVertical: 4, borderRadius: 6 },
  confirmDeleteBtn: { paddingHorizontal: 15, paddingVertical: 4, backgroundColor: COLORES.danger, borderRadius: 6 }
});