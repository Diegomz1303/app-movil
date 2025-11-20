import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ImageBackground } from 'react-native';
import { COLORES } from '../constants/colors';
// 1. Importamos la librería de animación
import * as Animatable from 'react-native-animatable';

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
import ReportsModal from '../components/modals/ReportsModal';

// Hooks de Contexto
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

type TabType = 'Home' | 'Citas' | 'Clientes' | 'Perfil';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  
  // Estados de Modales
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [petsModalVisible, setPetsModalVisible] = useState(false);
  const [reportsVisible, setReportsVisible] = useState(false);
  
  const { refreshClients, refreshAppointments } = useData();
  const { theme, isDark } = useTheme(); 

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
    refreshClients(); 
    setActiveTab('Clientes'); 
  };

  const handleAppointmentAdded = () => {
    refreshAppointments();
    setActiveTab('Citas');
  };

  // --- 2. MODIFICAMOS LA LÓGICA DE RENDERIZADO ---
  const renderContent = () => {
    let contentComponent;

    switch (activeTab) {
      case 'Home': contentComponent = <HomeTab />; break;
      case 'Citas': contentComponent = <CitasTab />; break;
      case 'Clientes': contentComponent = <ClientesTab />; break;
      case 'Perfil': contentComponent = <PerfilTab />; break;
      default: contentComponent = <HomeTab />; break;
    }

    // Envolvemos el componente en una vista animada
    // key={activeTab} es CRUCIAL: obliga a reiniciar la animación al cambiar de tab
    return (
      <Animatable.View
        key={activeTab} // Identificador único para reiniciar animación
        animation="fadeInUp" // Tipo de animación (puedes probar: fadeIn, zoomIn, slideInRight)
        duration={500} // Duración en milisegundos (0.5 segundos)
        style={{ flex: 1 }} // Ocupar todo el espacio
        useNativeDriver={true} // Para mejor rendimiento
      >
        {contentComponent}
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
         barStyle={isDark ? "light-content" : "dark-content"} 
         backgroundColor={theme.background} 
      />
      
      <ImageBackground 
        source={require('../assets/paw_pattern.png')} 
        style={styles.backgroundImage}
        imageStyle={{ 
          opacity: isDark ? 0.05 : 0.15, 
          resizeMode: 'repeat',
          tintColor: isDark ? '#FFFFFF' : COLORES.principalDark 
        }}
      >
        <View style={styles.mainContainer}>
          {/* Aquí se renderiza el contenido animado */}
          {renderContent()}
        </View>
      </ImageBackground>

      <BottomNavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAddClick={handleMainButtonClick} 
        onPetsClick={() => setPetsModalVisible(true)}
        onReportsClick={() => setReportsVisible(true)}
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

      <ReportsModal 
        visible={reportsVisible} 
        onClose={() => setReportsVisible(false)} 
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  mainContainer: {
    flex: 1,
    marginBottom: 70, 
  },
});