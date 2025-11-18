// screens/DashboardScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- Colores y Constantes ---
const COLORES = {
  principal: '#007bff',      // Tu azul principal
  principalDark: '#0056b3',
  fondoBlanco: '#FFFFFF',
  fondoGris: '#f0f4f7',
  texto: '#333',
  textoSecundario: '#888',
  danger: '#dc3545',
  inactivo: '#B0B0B0',       // Color para iconos no seleccionados
};

// Definimos las pestañas disponibles
type TabType = 'Home' | 'Citas' | 'Agregar' | 'Historial' | 'Perfil';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');

  // --- Tu función original de Logout (INTACTA) ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión.');
    }
  };

  // --- Función para agregar cita (Simulada) ---
  const handleAddCita = () => {
    Alert.alert('Nueva Cita', 'Aquí se abrirá el formulario para agregar citas.');
  };

  // --- Renderizado del contenido según la pestaña ---
  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return (
          <View style={styles.contentCenter}>
            <MaterialCommunityIcons name="home-variant-outline" size={80} color={COLORES.principal} />
            <Text style={styles.title}>Panel Principal</Text>
            <Text style={styles.subtitle}>Resumen de hoy</Text>
          </View>
        );
      case 'Citas':
        return (
          <View style={styles.contentCenter}>
            <MaterialCommunityIcons name="calendar-clock" size={80} color={COLORES.principal} />
            <Text style={styles.title}>Mis Citas</Text>
            <Text style={styles.subtitle}>Próximas atenciones</Text>
          </View>
        );
      case 'Historial':
        return (
          <View style={styles.contentCenter}>
            <MaterialCommunityIcons name="wallet-outline" size={80} color={COLORES.principal} />
            <Text style={styles.title}>Historial / Pagos</Text>
            <Text style={styles.subtitle}>Registro de actividades</Text>
          </View>
        );
      case 'Perfil':
        return (
          <View style={styles.contentCenter}>
            <MaterialCommunityIcons name="account-circle-outline" size={80} color={COLORES.principal} />
            <Text style={styles.title}>Mi Perfil</Text>
            <Text style={styles.subtitle}>Configuración de usuario</Text>
            
            {/* El botón de cerrar sesión lo moví aquí para que tenga sentido en el perfil */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  // --- Componente de Icono de la Barra ---
  const TabIcon = ({ name, label, tabName }: { name: any, label: string, tabName: TabType }) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => setActiveTab(tabName)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name={isActive ? name : `${name}-outline` as any} // Alterna entre lleno y contorno si existe
          size={24} // Tamaño basado en tu imagen (Icon Size 24px)
          color={isActive ? COLORES.principal : COLORES.inactivo} 
        />
        {isActive && <Text style={[styles.tabLabel, { color: COLORES.principal }]}>{label}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.fondoGris} />
      
      {/* 1. Área de Contenido Cambiante */}
      <View style={styles.mainContainer}>
        {renderContent()}
      </View>

      {/* 2. Barra de Navegación Inferior (Bottom Bar) */}
      <View style={styles.bottomBarContainer}>
        {/* Fondo blanco con sombra */}
        <View style={styles.bottomBar}>
          
          {/* Lado Izquierdo */}
          <TabIcon name="home" label="Inicio" tabName="Home" />
          <TabIcon name="calendar-text" label="Citas" tabName="Citas" />

          {/* Espacio vacío en medio para el botón flotante */}
          <View style={{ width: 70 }} /> 

          {/* Lado Derecho */}
          <TabIcon name="history" label="Historial" tabName="Historial" />
          <TabIcon name="account" label="Perfil" tabName="Perfil" />
        </View>

        {/* 3. Botón Flotante Central (El signo +) */}
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={handleAddCita}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons name="plus" size={32} color={COLORES.fondoBlanco} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Estilos ---
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORES.fondoGris,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center', // Centra el contenido verticalmente
  },
  contentCenter: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORES.texto,
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORES.textoSecundario,
    marginBottom: 30,
  },
  // --- Estilos de la Barra Inferior ---
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: COLORES.fondoBlanco,
    width: '100%',
    height: 70, // Altura basada en tu imagen (~72px)
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // Sombra suave hacia arriba
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10, // Para Android
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Ajuste para iPhone X+
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  tabLabel: {
    fontSize: 10, // Font size 12px o 10px según espacio
    marginTop: 2,
    fontWeight: '600',
  },
  // --- Botón Flotante (Círculo Central) ---
  floatingButton: {
    position: 'absolute',
    bottom: 30, // Lo eleva sobre la barra (40-50px desde abajo)
    backgroundColor: '#2e8b57', // Un verde bonito o usa COLORES.principal
    width: 65,  // Tamaño grande como en la imagen (~60-70px)
    height: 65,
    borderRadius: 32.5, // Círculo perfecto
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra del botón
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 4,       // Borde blanco para separarlo de la barra
    borderColor: COLORES.fondoGris, // Mismo color que el fondo de la pantalla
  },
  // --- Botón Logout (Reubicado) ---
  logoutButton: {
    width: '100%',
    maxWidth: 200,
    height: 50,
    backgroundColor: COLORES.danger,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  logoutText: {
    color: COLORES.fondoBlanco,
    fontSize: 16,
    fontWeight: 'bold',
  },
});