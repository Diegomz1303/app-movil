import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { COLORES } from '../constants/colors';

// Componentes de Pantallas
import HomeTab from '../components/dashboard/HomeTab';
import CitasTab from '../components/dashboard/CitasTab';
import ClientesTab from '../components/dashboard/ClientesTab';
import PerfilTab from '../components/dashboard/PerfilTab';

// Componentes UI
import BottomNavBar from '../components/ui/BottomNavBar';

// Modales
import AddClientModal from '../components/modals/AddClientModal';
import PetsListModal from '../components/modals/PetsListModal';

// Tipo de pestañas
type TabType = 'Home' | 'Citas' | 'Clientes' | 'Perfil';

export default function DashboardScreen() {
  // Estado de la pestaña activa
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  
  // Estados para controlar los Modales
  const [modalVisible, setModalVisible] = useState(false);        // Modal Agregar Cliente
  const [petsModalVisible, setPetsModalVisible] = useState(false); // Modal Buscar Mascotas
  
  // Estado "gatillo" para actualizar la lista de clientes
  const [clientesRefreshTrigger, setClientesRefreshTrigger] = useState(0);

  // Función para abrir modal de cliente (Click corto en +)
  const handleAddClick = () => {
    setModalVisible(true);
  };

  // Función cuando se agrega un cliente exitosamente
  const handleClientAdded = () => {
    setClientesRefreshTrigger(prev => prev + 1); // Recarga la lista
    setActiveTab('Clientes'); // Cambia a la pestaña de clientes
  };

  // Renderizado condicional de las pestañas
  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeTab />;
      case 'Citas':
        return <CitasTab />;
      case 'Clientes':
        return <ClientesTab refreshTrigger={clientesRefreshTrigger} />;
      case 'Perfil':
        return <PerfilTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.fondoGris} />
      
      <View style={styles.mainContainer}>
        {renderContent()}
      </View>

      {/* Barra de Navegación con Menú Desplegable */}
      <BottomNavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAddClick={handleAddClick}
        onPetsClick={() => setPetsModalVisible(true)} // Abre el modal de mascotas
      />

      {/* Modal: Agregar Cliente */}
      <AddClientModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        onClientAdded={handleClientAdded}
      />

      {/* Modal: Buscador de Mascotas (Directorio) */}
      <PetsListModal
        visible={petsModalVisible}
        onClose={() => setPetsModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORES.fondoGris,
  },
  mainContainer: {
    flex: 1,
    marginBottom: 70, // Espacio para la BottomBar
  },
});