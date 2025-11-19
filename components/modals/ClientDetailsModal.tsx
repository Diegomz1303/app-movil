import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';

// Importamos el nuevo modal de agregar mascota
import AddPetModal from './AddPetModal';

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
}

export default function ClientDetailsModal({ visible, onClose, cliente, onDelete }: ClientDetailsModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  
  // Estado para controlar el modal de Agregar Mascota
  const [isAddPetModalVisible, setAddPetModalVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDeleting(false);
      setDeleteConfirmVisible(false);
      setAddPetModalVisible(false);
    }
  }, [visible]);

  const handleConfirmDelete = async () => {
    if (!cliente) return;
    setDeleting(true);
    await onDelete(cliente.id);
    setDeleteConfirmVisible(false);
    onClose();
    setDeleting(false);
  };

  if (!cliente) return null;

  return (
    <>
      {/* --- MODAL PRINCIPAL (Detalles del Cliente) --- */}
      <Modal
        isVisible={visible}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
        style={styles.modal}
        hideModalContentWhileAnimating={true}
      >
        <View style={styles.modalContent}>
          
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
             <MaterialCommunityIcons name="close" size={24} color={COLORES.textoSecundario} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.avatarContainer}>
               <MaterialCommunityIcons name="account" size={60} color={COLORES.principal} />
            </View>
            <Text style={styles.clientName}>{cliente.nombres} {cliente.apellidos}</Text>
            <View style={styles.locationContainer}>
                <MaterialCommunityIcons name="map-marker" size={16} color={COLORES.textoSecundario} />
                <Text style={styles.clientLocation}>{cliente.distrito || 'Sin distrito'}</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
               <MaterialCommunityIcons name="phone" size={20} color={COLORES.texto} />
               <Text style={styles.infoText}>{cliente.telefono}</Text>
            </View>
            <View style={styles.infoRow}>
               <MaterialCommunityIcons name="card-account-details-outline" size={20} color={COLORES.texto} />
               <Text style={styles.infoText}>{cliente.tipo_documento}: {cliente.numero_documento}</Text>
            </View>
          </View>

          {/* BOTÓN: AGREGAR MASCOTA (Ahora abre el nuevo modal) */}
          <TouchableOpacity 
            style={styles.addPetButton} 
            onPress={() => setAddPetModalVisible(true)}
          >
            <MaterialCommunityIcons name="paw" size={20} color={COLORES.textoSobrePrincipal} />
            <Text style={styles.addPetButtonText}>Agregar Mascota</Text>
          </TouchableOpacity>

          {/* Botón Eliminar */}
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => setDeleteConfirmVisible(true)}
          >
             <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORES.danger} style={{ marginRight: 8 }} />
             <Text style={styles.deleteButtonText}>Eliminar Cliente</Text>
          </TouchableOpacity>
        </View>

        {/* --- MODAL DE CONFIRMACIÓN DE BORRADO (Anidado dentro del modal principal para que se vea encima) --- */}
        <Modal
          isVisible={isDeleteConfirmVisible}
          animationIn="bounceIn"
          animationOut="bounceOut"
          useNativeDriver
          onBackdropPress={() => setDeleteConfirmVisible(false)}
          style={styles.confirmModal}
        >
          <View style={styles.confirmContent}>
            <View style={styles.trashIconContainer}>
              <MaterialCommunityIcons name="trash-can" size={40} color={COLORES.danger} />
            </View>
            <Text style={styles.confirmTitle}>¿Eliminar Cliente?</Text>
            <Text style={styles.confirmMessage}>
              Estás a punto de eliminar a {cliente.nombres}.{"\n"}Esta acción no se puede deshacer.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.actionButton, styles.cancelBtn]} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.deleteBtn]} onPress={handleConfirmDelete} disabled={deleting}>
                {deleting ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.deleteText}>Eliminar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </Modal>

      {/* --- MODAL DE REGISTRO DE MASCOTA (Externo para mejor manejo de z-index) --- */}
      {/* Se renderiza fuera del Modal principal para evitar conflictos de teclado o visualización */}
      <AddPetModal 
        visible={isAddPetModalVisible} 
        onClose={() => setAddPetModalVisible(false)}
        clientId={cliente.id}
        onPetAdded={() => {
            // Aquí podrías actualizar algo si quisieras, o simplemente cerrar
            console.log("Mascota agregada al cliente " + cliente.id);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modal: { justifyContent: 'flex-end', margin: 0 },
  modalContent: {
    backgroundColor: COLORES.fondoBlanco,
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    padding: 25, minHeight: height * 0.5,
  },
  closeIcon: { alignSelf: 'flex-end', padding: 5 },
  header: { alignItems: 'center', marginBottom: 20, marginTop: -10 },
  avatarContainer: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: COLORES.fondoGris,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  clientName: { fontSize: 22, fontWeight: 'bold', color: COLORES.texto },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  clientLocation: { fontSize: 14, color: COLORES.textoSecundario, marginLeft: 4 },
  infoContainer: { backgroundColor: COLORES.fondoGris, borderRadius: 15, padding: 20, marginBottom: 25 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 16, color: COLORES.texto, marginLeft: 15, fontWeight: '500' },
  addPetButton: {
    backgroundColor: COLORES.principal, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 16, borderRadius: 15, marginBottom: 15,
    shadowColor: COLORES.principal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4
  },
  addPetButtonText: { color: COLORES.textoSobrePrincipal, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 15 },
  deleteButtonText: { color: COLORES.danger, fontSize: 16, fontWeight: 'bold' },
  
  // Estilos de Confirmación
  confirmModal: { justifyContent: 'center', alignItems: 'center', margin: 20 },
  confirmContent: {
    backgroundColor: 'white', padding: 25, borderRadius: 25, width: '90%', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5
  },
  trashIconContainer: { backgroundColor: '#FFEBEE', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', color: COLORES.texto, marginBottom: 10 },
  confirmMessage: { fontSize: 14, color: COLORES.textoSecundario, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: 15, width: '100%' },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: COLORES.fondoGris },
  cancelText: { color: COLORES.texto, fontWeight: 'bold', fontSize: 15 },
  deleteBtn: { backgroundColor: COLORES.danger },
  deleteText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});