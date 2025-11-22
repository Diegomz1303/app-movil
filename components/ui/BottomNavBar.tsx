import React, { useState, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Platform, Animated, 
  TouchableWithoutFeedback, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

const { height } = Dimensions.get('window');

type TabType = 'Home' | 'Citas' | 'Clientes' | 'Tienda' | 'Perfil' | 'Servicios';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddClick: () => void;     
  onPetsClick: () => void;
  onReportsClick: () => void;
}

export default function BottomNavBar({ activeTab, onTabChange, onAddClick, onPetsClick, onReportsClick }: BottomNavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  const getMainIcon = () => {
    if (menuOpen) return "close"; 
    if (activeTab === 'Clientes') return "account-plus";
    if (activeTab === 'Citas') return "calendar-plus";
    return "plus"; 
  };

  const toggleMenu = () => {
    const toValue = menuOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setMenuOpen(!menuOpen);
  };

  const getAnimatedStyle = (index: number) => {
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -60 * index]
    });
    const scale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1]
    });
    const opacity = animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1]
    });
    return { transform: [{ translateY }, { scale }], opacity };
  };

  const TabIcon = ({ name, label, tabName }: { name: any, label: string, tabName: TabType }) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => {
            if(menuOpen) toggleMenu();
            onTabChange(tabName);
        }}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name={isActive ? name : `${name}-outline` as any}
          size={24} 
          color={isActive ? theme.primary : (theme.isDark ? '#888' : COLORES.inactivo)} 
        />
        {isActive && <Text style={[styles.tabLabel, { color: theme.primary }]}>{label}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.bottomBarContainer} pointerEvents="box-none">
      
      {/* --- MENÚ FLOTANTE --- */}

      {/* 1. Mi Perfil (Top) */}
      <Animated.View style={[styles.menuOption, getAnimatedStyle(4)]} pointerEvents={menuOpen ? 'auto' : 'none'}>
        <TouchableOpacity style={styles.optionButton} onPress={() => { toggleMenu(); onTabChange('Perfil'); }}>
          <Text style={[styles.optionLabel, { backgroundColor: theme.card, color: theme.text }]}>Mi Perfil</Text>
          <View style={[styles.optionIcon, { backgroundColor: theme.inputBackground }]}>
            <MaterialCommunityIcons name="account-circle" size={20} color={theme.text} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* 2. Servicios Realizados (Historial) */}
      <Animated.View style={[styles.menuOption, getAnimatedStyle(3)]} pointerEvents={menuOpen ? 'auto' : 'none'}>
        <TouchableOpacity style={styles.optionButton} onPress={() => { toggleMenu(); onTabChange('Servicios'); }}>
          <Text style={[styles.optionLabel, { backgroundColor: theme.card, color: theme.text }]}>Servicios Realizados</Text>
          <View style={[styles.optionIcon, { backgroundColor: '#E8F5E9' }]}>
            <MaterialCommunityIcons name="history" size={20} color="#2E7D32" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* 3. Buscar Mascotas */}
      <Animated.View style={[styles.menuOption, getAnimatedStyle(2)]} pointerEvents={menuOpen ? 'auto' : 'none'}>
        <TouchableOpacity style={styles.optionButton} onPress={() => { toggleMenu(); onPetsClick(); }}>
          <Text style={[styles.optionLabel, { backgroundColor: theme.card, color: theme.text }]}>Buscar Mascotas</Text>
          <View style={[styles.optionIcon, { backgroundColor: theme.inputBackground }]}>
            <MaterialCommunityIcons name="dog" size={20} color={theme.text} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* 4. Reportes */}
      <Animated.View style={[styles.menuOption, getAnimatedStyle(1)]} pointerEvents={menuOpen ? 'auto' : 'none'}>
        <TouchableOpacity style={styles.optionButton} onPress={() => { toggleMenu(); onReportsClick(); }}>
          <Text style={[styles.optionLabel, { backgroundColor: theme.card, color: theme.text }]}>Reportes</Text>
          <View style={[styles.optionIcon, { backgroundColor: theme.isDark ? '#003c8f' : '#E3F2FD' }]}>
            <MaterialCommunityIcons name="chart-bar" size={20} color={theme.isDark ? '#90caf9' : '#1976D2'} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* --- BARRA INFERIOR --- */}
      <View style={[styles.bottomBar, { backgroundColor: theme.tabBar }]}>
        <TabIcon name="home" label="Inicio" tabName="Home" />
        <TabIcon name="calendar-text" label="Citas" tabName="Citas" />
        <View style={{ width: 70 }} /> 
        <TabIcon name="store" label="Tienda" tabName="Tienda" /> 
        <TabIcon name="account-group" label="Clientes" tabName="Clientes" />
      </View>

      {/* BOTÓN + */}
      <TouchableOpacity 
        style={[
            styles.floatingButton, 
            menuOpen && styles.floatingButtonActive,
            { borderColor: theme.background }
        ]} 
        onPress={() => {
            if (menuOpen) toggleMenu();
            else if (activeTab === 'Home' || activeTab === 'Tienda' || activeTab === 'Perfil' || activeTab === 'Servicios') toggleMenu();
            else onAddClick();
        }}      
        onLongPress={toggleMenu}
        delayLongPress={300}
        activeOpacity={0.9}
      >
        <Animated.View style={{ transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '135deg'] }) }] }}>
          <MaterialCommunityIcons name={getMainIcon() as any} size={28} color={COLORES.textoSobrePrincipal} />
        </Animated.View>
      </TouchableOpacity>

      {menuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
           <View style={styles.overlay} />
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
    flexDirection: 'row', 
    width: '100%', 
    // 1. Aumentamos la altura para que no se corte al subir el padding
    height: Platform.OS === 'ios' ? 90 : 70, 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3,
    elevation: 10, 
    // 2. Aumentamos el padding inferior para separar los iconos de la "rayita"
    paddingBottom: Platform.OS === 'ios' ? 35 : 10,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', width: 55 },
  tabLabel: { fontSize: 9, marginTop: 2, fontWeight: '600' },
  
  floatingButton: {
    position: 'absolute', 
    // 3. Subimos el botón para que coincida con la nueva altura de la barra
    bottom: Platform.OS === 'ios' ? 45 : 35, 
    backgroundColor: COLORES.verdeBoton,
    width: 65, height: 65, borderRadius: 32.5,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8,
    borderWidth: 4, zIndex: 102
  },
  floatingButtonActive: { backgroundColor: COLORES.danger },
  
  menuOption: { 
    position: 'absolute', 
    // 4. Subimos el menú para que salga desde la nueva posición del botón
    bottom: Platform.OS === 'ios' ? 45 : 35, 
    zIndex: 101 
  },
  optionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 },
  optionLabel: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, marginRight: 10, fontSize: 14, fontWeight: '600',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3
  },
  optionIcon: {
    width: 45, height: 45, borderRadius: 22.5,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 4
  },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height, width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 90 }
});