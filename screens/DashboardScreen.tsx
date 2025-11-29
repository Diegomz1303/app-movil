import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  StatusBar, 
  ImageBackground, 
  TouchableOpacity,
  Platform 
} from 'react-native';
import { COLORES } from '../constants/colors';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Componentes de Pantallas
import HomeTab from '../components/dashboard/HomeTab';
import CitasTab from '../components/dashboard/CitasTab';
import ClientesTab from '../components/dashboard/ClientesTab';
import PerfilTab from '../components/dashboard/PerfilTab';
import TiendaTab from '../components/dashboard/TiendaTab';
import ServiciosTab from '../components/dashboard/ServiciosTab';

// Componentes UI
import BottomNavBar from '../components/ui/BottomNavBar';

// Modales
import AddClientModal from '../components/modals/AddClientModal';
import PetsListModal from '../components/modals/PetsListModal';
import AddAppointmentModal from '../components/modals/AddAppointmentModal';
import CalendarModal from '../components/modals/CalendarModal'; 
import AIChatModal from '../components/modals/AIChatModal';

// Hooks de Contexto
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

type TabType = 'Home' | 'Citas' | 'Clientes' | 'Tienda' | 'Perfil' | 'Servicios';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  
  // Estados de Modales
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [petsModalVisible, setPetsModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  
  // Estado IA
  const [aiModalVisible, setAiModalVisible] = useState(false);
  
  const { refreshClients, refreshAppointments } = useData();
  const { theme, isDark } = useTheme(); 

  // Esta función decide qué modal abrir según la pestaña activa
  const handleMainButtonClick = () => {
    if (activeTab === 'Clientes') {
      setClientModalVisible(true);
    } else if (activeTab === 'Citas') {
      setAppointmentModalVisible(true);
    } else {
      // Por defecto en otras pantallas abre cita (o puedes abrir el menú)
      setAppointmentModalVisible(true);
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

  const handleAISuccess = () => {
    refreshAppointments();
    setActiveTab('Citas');
  };

  const renderContent = () => {
    let contentComponent;

    switch (activeTab) {
      case 'Home': contentComponent = <HomeTab />; break;
      case 'Citas': contentComponent = <CitasTab />; break;
      case 'Clientes': contentComponent = <ClientesTab />; break;
      case 'Tienda': contentComponent = <TiendaTab />; break;
      case 'Perfil': contentComponent = <PerfilTab />; break;
      case 'Servicios': contentComponent = <ServiciosTab />; break;
      default: contentComponent = <HomeTab />; break;
    }

    return (
      <Animatable.View
        key={activeTab} 
        animation="fadeInUp" 
        duration={300} 
        style={{ flex: 1 }} 
        useNativeDriver={true} 
      >
        {contentComponent}
      </Animatable.View>
    );
  };

  // Estilos dinámicos para el botón de IA
  const aiButtonStyle = {
    backgroundColor: isDark ? '#7C4DFF' : theme.primary,
    shadowColor: isDark ? '#7C4DFF' : theme.primary,
    borderColor: theme.card,
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
          {renderContent()}
        </View>
      </ImageBackground>

      {/* --- BOTÓN FLOTANTE IA --- */}
      <Animatable.View 
        animation="zoomIn" 
        duration={600} 
        delay={500}
        style={styles.aiButtonContainer}
      >
        <TouchableOpacity 
          style={[styles.aiButton, aiButtonStyle]}
          onPress={() => setAiModalVisible(true)}
          activeOpacity={0.8}
        >
          {/* Efecto de brillo sutil */}
          <View style={styles.aiButtonShine} />
          <MaterialCommunityIcons name="robot-happy-outline" size={32} color="white" />
          
          {/* Badge opcional "IA" */}
          <View style={[styles.aiBadge, { backgroundColor: theme.card }]}>
            <Animatable.Text 
                animation="pulse" 
                iterationCount="infinite" 
                style={[styles.aiBadgeText, { color: isDark ? '#7C4DFF' : theme.primary }]}
            >
                IA
            </Animatable.Text>
          </View>
        </TouchableOpacity>
      </Animatable.View>

      <BottomNavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAddClick={handleMainButtonClick} 
        onPetsClick={() => setPetsModalVisible(true)}
        onCalendarClick={() => setCalendarVisible(true)}
      />

      {/* --- MODALES --- */}

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

      <CalendarModal 
        visible={calendarVisible} 
        onClose={() => setCalendarVisible(false)} 
      />

      <AIChatModal 
        visible={aiModalVisible} 
        onClose={() => setAiModalVisible(false)} 
        onSuccess={handleAISuccess}
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
  
  // --- ESTILOS DEL BOTÓN IA ---
  aiButtonContainer: {
    position: 'absolute',
    bottom: 115, // Justo encima del NavBar
    right: 20,
    zIndex: 2000,
  },
  aiButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    // Sombras potentes para dar efecto flotante 3D
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3, 
  },
  aiButtonShine: {
    position: 'absolute',
    top: 5,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  aiBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    elevation: 11,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 }
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});