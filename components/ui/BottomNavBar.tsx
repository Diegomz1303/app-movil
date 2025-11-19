import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Animated, 
  TouchableWithoutFeedback,
  Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';

// Definimos los tipos de pestañas disponibles
type TabType = 'Home' | 'Citas' | 'Clientes' | 'Perfil';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddClick: () => void;     // Abre el modal de agregar cliente
  onPetsClick: () => void;    // Abre el buscador de mascotas
}

export default function BottomNavBar({ activeTab, onTabChange, onAddClick, onPetsClick }: BottomNavBarProps) {
  // Estado para el menú desplegable
  const [menuOpen, setMenuOpen] = useState(false);
  // Valor animado (0 = cerrado, 1 = abierto)
  const animation = useRef(new Animated.Value(0)).current;

  // Función para alternar el menú con efecto rebote
  const toggleMenu = () => {
    const toValue = menuOpen ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      friction: 5, // Controla el rebote (menos fricción = más rebote)
      tension: 40, // Tensión del resorte
      useNativeDriver: true,
    }).start();

    setMenuOpen(!menuOpen);
  };

  // Función auxiliar para generar estilos animados de cada botón del menú
  const getAnimatedStyle = (index: number) => {
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -60 * index] // Se mueven 60px hacia arriba por cada índice
    });
    
    const scale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1]
    });

    const opacity = animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1]
    });

    return {
      transform: [{ translateY }, { scale }],
      opacity
    };
  };

  // Componente interno para los iconos de las pestañas
  const TabIcon = ({ name, label, tabName }: { name: any, label: string, tabName: TabType }) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => onTabChange(tabName)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name={isActive ? name : `${name}-outline` as any}
          size={24} 
          color={isActive ? COLORES.principalDark : COLORES.inactivo} 
        />
        {isActive && <Text style={[styles.tabLabel, { color: COLORES.principalDark }]}>{label}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.bottomBarContainer} pointerEvents="box-none">
      
      {/* --- MENÚ DESPLEGABLE (OPCIONES) --- */}

      {/* Opción 3: Registrar Cita (La más alta) */}
      <Animated.View style={[styles.menuOption, getAnimatedStyle(3)]}>
        <TouchableOpacity style={styles.optionButton} onPress={() => Alert.alert("Nueva Cita", "Pronto podrás agendar citas aquí.")}>
          <Text style={styles.optionLabel}>Nueva Cita</Text>
          <View style={styles.optionIcon}>
            <MaterialCommunityIcons name="calendar-plus" size={20} color={COLORES.texto} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Opción 2: BUSCADOR DE MASCOTAS */}
      <Animated.View style={[styles.menuOption, getAnimatedStyle(2)]}>
        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={() => {
            toggleMenu(); // Cerramos el menú
            onPetsClick(); // Abrimos el modal de mascotas
          }}
        >
          <Text style={styles.optionLabel}>Buscar Mascotas</Text>
          <View style={styles.optionIcon}>
            <MaterialCommunityIcons name="dog" size={20} color={COLORES.texto} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Opción 1: Subir Foto (La más baja) */}
      <Animated.View style={[styles.menuOption, getAnimatedStyle(1)]}>
        <TouchableOpacity style={styles.optionButton} onPress={() => Alert.alert("Foto", "Subir foto de perfil o mascota.")}>
          <Text style={styles.optionLabel}>Subir Foto</Text>
          <View style={styles.optionIcon}>
            <MaterialCommunityIcons name="camera" size={20} color={COLORES.texto} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* --- BARRA DE NAVEGACIÓN --- */}
      <View style={styles.bottomBar}>
        <TabIcon name="home" label="Inicio" tabName="Home" />
        <TabIcon name="calendar-text" label="Citas" tabName="Citas" />
        
        {/* Espacio vacío para el botón flotante */}
        <View style={{ width: 70 }} /> 
        
        <TabIcon name="account-group" label="Clientes" tabName="Clientes" />
        <TabIcon name="account" label="Perfil" tabName="Perfil" />
      </View>

      {/* --- BOTÓN FLOTANTE PRINCIPAL --- */}
      <TouchableOpacity 
        style={[styles.floatingButton, menuOpen && styles.floatingButtonActive]} 
        onPress={onAddClick}      // Un toque: Abre modal de cliente (como antes)
        onLongPress={toggleMenu}  // Mantener presionado: Abre el menú de opciones
        delayLongPress={300}      // Tiempo para detectar el "mantener presionado"
        activeOpacity={0.9}
      >
        <Animated.View style={{ transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
          <MaterialCommunityIcons name="plus" size={32} color={COLORES.textoSobrePrincipal} />
        </Animated.View>
      </TouchableOpacity>

      {/* Fondo transparente para cerrar el menú al tocar fuera */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
           <View style={styles.overlay} pointerEvents="auto" />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBarContainer: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    alignItems: 'center',
    zIndex: 100 
  },
  bottomBar: {
    flexDirection: 'row', backgroundColor: COLORES.fondoBlanco, width: '100%', height: 70,
    justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3,
    elevation: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', width: 60 },
  tabLabel: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  
  // Botón Flotante
  floatingButton: {
    position: 'absolute', bottom: 30,
    backgroundColor: COLORES.verdeBoton,
    width: 65, height: 65, borderRadius: 32.5,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8,
    borderWidth: 4, borderColor: COLORES.fondoGris,
    zIndex: 102
  },
  floatingButtonActive: {
    backgroundColor: COLORES.principalDark,
    borderColor: COLORES.fondoBlanco
  },

  // Opciones del Menú
  menuOption: {
    position: 'absolute',
    bottom: 30, 
    zIndex: 101,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  optionLabel: {
    backgroundColor: COLORES.fondoBlanco,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
    fontSize: 14,
    fontWeight: '600',
    color: COLORES.texto,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3
  },
  optionIcon: {
    width: 45, height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORES.fondoGris,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 4
  },

  // Overlay invisible
  overlay: {
    position: 'absolute',
    top: -1000, 
    left: 0, right: 0, bottom: 0,
    zIndex: 90,
  }
});