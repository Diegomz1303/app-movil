// screens/DashboardScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, Alert, StatusBar } from 'react-native';
import { COLORES } from '../constants/colors';

// Importamos los componentes divididos
import HomeTab from '../components/dashboard/HomeTab';
import CitasTab from '../components/dashboard/CitasTab';
import HistorialTab from '../components/dashboard/HistorialTab';
import PerfilTab from '../components/dashboard/PerfilTab';
import BottomNavBar from '../components/ui/BottomNavBar';

// Definimos el tipo para las pestañas
type TabType = 'Home' | 'Citas' | 'Historial' | 'Perfil';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');

  // Función para el botón flotante (+)
  const handleAddCita = () => {
    Alert.alert('Nueva Cita', 'Aquí abrirías el modal para agendar una cita.');
  };

  // Función que decide qué componente renderizar
  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeTab />;
      case 'Citas':
        return <CitasTab />;
      case 'Historial':
        return <HistorialTab />;
      case 'Perfil':
        return <PerfilTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.fondoGris} />
      
      {/* 1. Contenido Principal (Cambiante) */}
      <View style={styles.mainContainer}>
        {renderContent()}
      </View>

      {/* 2. Barra de Navegación Inferior Modularizada */}
      <BottomNavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAddClick={handleAddCita}
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
    marginBottom: 70, // Dejamos espacio para que la barra no tape el contenido al final
  },
});