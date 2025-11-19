import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';

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
}

export default function ClientDetailsModal({ visible, onClose, cliente, onDelete }: ClientDetailsModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      setDeleting(false);
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDeletePress = () => {
    if (!cliente) return;

    Alert.alert(
      "Eliminar Cliente",
      `¿Estás seguro de que deseas eliminar a ${cliente.nombres}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            await onDelete(cliente.id);
            onClose();
          }
        }
      ]
    );
  };

  // Función temporal para el botón de mascota
  const handleAddPet = () => {
    Alert.alert("Próximamente", "Aquí podrás agregar las mascotas de este cliente.");
  };

  if (!cliente) return null;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }] }]}>
          
          {/* Cabecera con Botón Cerrar (X) */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Detalle del Cliente</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <MaterialCommunityIcons name="close" size={24} color={COLORES.textoSecundario} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Perfil */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account" size={60} color={COLORES.principal} />
              </View>
              <Text style={styles.nameText}>{cliente.nombres} {cliente.apellidos}</Text>
              <View style={styles.badgeContainer}>
                 <MaterialCommunityIcons name="map-marker" size={14} color={COLORES.principalDark} />
                 <Text style={styles.districtText}>{cliente.distrito || 'Sin distrito'}</Text>
              </View>
            </View>

            {/* Info Contacto */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Información de Contacto</Text>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={20} color={COLORES.textoSecundario} style={styles.icon} />
                <View>
                   <Text style={styles.label}>Teléfono</Text>
                   <Text style={styles.value}>{cliente.telefono}</Text>
                </View>
              </View>

              {cliente.correo ? (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="email" size={20} color={COLORES.textoSecundario} style={styles.icon} />
                  <View>
                    <Text style={styles.label}>Correo</Text>
                    <Text style={styles.value}>{cliente.correo}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="card-account-details" size={20} color={COLORES.textoSecundario} style={styles.icon} />
                <View>
                   <Text style={styles.label}>{cliente.tipo_documento}</Text>
                   <Text style={styles.value}>{cliente.numero_documento || '---'}</Text>
                </View>
              </View>
            </View>

            {/* Emergencia */}
            {(cliente.contacto_emergencia || cliente.telefono_emergencia) && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>En caso de emergencia</Text>
                
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="ambulance" size={20} color={COLORES.danger} style={styles.icon} />
                  <View>
                     <Text style={styles.label}>Contacto</Text>
                     <Text style={styles.value}>{cliente.contacto_emergencia || '---'}</Text>
                     <Text style={[styles.value, {color: COLORES.texto}]}>{cliente.telefono_emergencia}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* --- BOTONES DE ACCIÓN --- */}
            
            {/* Botón Agregar Mascota (NUEVO) */}
            <TouchableOpacity style={styles.addPetButton} onPress={handleAddPet}>
              <MaterialCommunityIcons name="paw" size={20} color={COLORES.textoSobrePrincipal} style={{marginRight: 8}} />
              <Text style={styles.addPetButtonText}>Agregar Mascota</Text>
            </TouchableOpacity>

            {/* Botón Eliminar */}
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDeletePress}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={COLORES.danger} />
              ) : (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                   <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORES.danger} style={{marginRight: 5}} />
                   <Text style={styles.deleteButtonText}>Eliminar Cliente</Text>
                </View>
              )}
            </TouchableOpacity>

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalView: {
    width: width * 0.9, maxHeight: height * 0.85, backgroundColor: COLORES.fondoBlanco,
    borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORES.textoSecundario },
  closeIcon: { padding: 5 },
  
  profileSection: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  avatarContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORES.fondoGris,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  nameText: { fontSize: 24, fontWeight: 'bold', color: COLORES.texto, textAlign: 'center' },
  badgeContainer: {
    flexDirection: 'row', alignItems: 'center', marginTop: 5,
    backgroundColor: COLORES.fondoGris, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12
  },
  districtText: { fontSize: 14, color: COLORES.textoSecundario, marginLeft: 4 },

  scrollContent: { paddingBottom: 10 },
  sectionContainer: { marginBottom: 20, backgroundColor: COLORES.fondoGris, borderRadius: 15, padding: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORES.textoSecundario, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { marginRight: 15, width: 24, textAlign: 'center' },
  label: { fontSize: 12, color: COLORES.textoSecundario },
  value: { fontSize: 16, color: COLORES.texto, fontWeight: '500' },

  // Estilos Botón Agregar Mascota (Reemplaza al de Cerrar)
  addPetButton: {
    backgroundColor: COLORES.principal, 
    borderRadius: 12, 
    paddingVertical: 15,
    alignItems: 'center', 
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  addPetButtonText: { 
    color: COLORES.textoSobrePrincipal, 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  
  deleteButton: {
    backgroundColor: 'transparent', 
    borderRadius: 12, 
    paddingVertical: 15,
    alignItems: 'center', 
    marginTop: 5,
  },
  deleteButtonText: { color: COLORES.danger, fontWeight: '600', fontSize: 15 },
});