import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { COLORES } from '../constants/colors';

// Componentes
import HomeTab from '../components/dashboard/HomeTab';
import CitasTab from '../components/dashboard/CitasTab';
import ClientesTab from '../components/dashboard/ClientesTab'; // Importamos el nuevo
import PerfilTab from '../components/dashboard/PerfilTab';
import BottomNavBar from '../components/ui/BottomNavBar';
import AddClientModal from '../components/modals/AddClientModal';

// Actualizamos el tipo
type TabType = 'Home' | 'Citas' | 'Clientes' | 'Perfil';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  
  // Estado para controlar el Modal GLOBALMENTE
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estado "gatillo" para avisar a la lista de clientes que se actualice
  const [clientesRefreshTrigger, setClientesRefreshTrigger] = useState(0);

  const handleAddClick = () => {
    setModalVisible(true);
  };

  const handleClientAdded = () => {
    // Cambiamos este número para "avisar" a ClientesTab que recargue
    setClientesRefreshTrigger(prev => prev + 1);
    
    // Opcional: Si quieres que al agregar un cliente te lleve a la lista automáticamente:
    setActiveTab('Clientes'); 
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeTab />;
      case 'Citas':
        return <CitasTab />;
      case 'Clientes':
        // Le pasamos el trigger para que sepa cuando recargar
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

      <BottomNavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAddClick={handleAddClick}
      />

      {/* El Modal ahora vive aquí, disponible en TODAS las pestañas */}
      <AddClientModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        onClientAdded={handleClientAdded}
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