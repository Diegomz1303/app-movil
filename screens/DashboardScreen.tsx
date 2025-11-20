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
import AddAppointmentModal from '../components/modals/AddAppointmentModal';

// Hook del Contexto
import { useData } from '../context/DataContext';

type TabType = 'Home' | 'Citas' | 'Clientes' | 'Perfil';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  
  // Modales
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [petsModalVisible, setPetsModalVisible] = useState(false);
  
  // Usamos el contexto en lugar de estados locales para los triggers
  const { refreshClients, refreshAppointments } = useData();

  // Lógica del Botón Central
  const handleMainButtonClick = () => {
    if (activeTab === 'Clientes') {
      setClientModalVisible(true);
    } else if (activeTab === 'Citas') {
      setAppointmentModalVisible(true);
    } else {
      // Opcional: Podrías abrir un menú general aquí si estás en Home
      console.log("Botón inactivo en esta pantalla");
    }
  };

  const handleClientAdded = () => {
    refreshClients(); // Actualiza la lista globalmente
    setActiveTab('Clientes'); 
  };

  const handleAppointmentAdded = () => {
    refreshAppointments(); // Actualiza la lista globalmente
    setActiveTab('Citas');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Home': return <HomeTab />;
      case 'Citas': return <CitasTab />; // Ya no necesita props
      case 'Clientes': return <ClientesTab />; // Ya no necesita props
      case 'Perfil': return <PerfilTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.fondoGris} />
      
      <View style={styles.mainContainer}>
        {renderContent()}
      </View>

      <BottomNavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAddClick={handleMainButtonClick} 
        onPetsClick={() => setPetsModalVisible(true)} 
      />

      <AddClientModal 
        visible={clientModalVisible} 
        onClose={() => setClientModalVisible(false)}
        onClientAdded={handleClientAdded}
      />

      <AddAppointmentModal
        visible={appointmentModalVisible}
        onClose={() => setAppointmentModalVisible(false)}
        onAppointmentAdded={handleAppointmentAdded}
      />

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
    marginBottom: 70, 
  },
});