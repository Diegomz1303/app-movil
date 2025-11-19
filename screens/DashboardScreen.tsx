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

type TabType = 'Home' | 'Citas' | 'Clientes' | 'Perfil';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  
  // Modales
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [petsModalVisible, setPetsModalVisible] = useState(false);
  
  // Triggers de Refresco (Gatillos)
  const [clientesRefreshTrigger, setClientesRefreshTrigger] = useState(0);
  const [citasRefreshTrigger, setCitasRefreshTrigger] = useState(0); // <--- NUEVO

  // Lógica del Botón Central
  const handleMainButtonClick = () => {
    if (activeTab === 'Clientes') {
      setClientModalVisible(true);
    } else if (activeTab === 'Citas') {
      setAppointmentModalVisible(true);
    } else {
      console.log("Botón inactivo en esta pantalla");
    }
  };

  const handleClientAdded = () => {
    setClientesRefreshTrigger(prev => prev + 1); 
    setActiveTab('Clientes'); 
  };

  // <--- NUEVA FUNCIÓN: Refrescar citas al agregar
  const handleAppointmentAdded = () => {
    setCitasRefreshTrigger(prev => prev + 1);
    setActiveTab('Citas');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Home': return <HomeTab />;
      case 'Citas': 
        // <--- Pasamos el trigger aquí
        return <CitasTab refreshTrigger={citasRefreshTrigger} />;
      case 'Clientes': return <ClientesTab refreshTrigger={clientesRefreshTrigger} />;
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
        onAppointmentAdded={handleAppointmentAdded} // <--- Conectamos la función
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