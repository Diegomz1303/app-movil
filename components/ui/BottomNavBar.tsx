import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORES } from '../../constants/colors';

// Actualizamos el tipo
type TabType = 'Home' | 'Citas' | 'Clientes' | 'Perfil';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddClick: () => void;
}

export default function BottomNavBar({ activeTab, onTabChange, onAddClick }: BottomNavBarProps) {
  
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
    <View style={styles.bottomBarContainer}>
      <View style={styles.bottomBar}>
        <TabIcon name="home" label="Inicio" tabName="Home" />
        <TabIcon name="calendar-text" label="Citas" tabName="Citas" />

        <View style={{ width: 70 }} /> 

        {/* CAMBIO AQUÍ: Clientes en lugar de Historial */}
        <TabIcon name="account-group" label="Clientes" tabName="Clientes" />
        
        <TabIcon name="account" label="Perfil" tabName="Perfil" />
      </View>

      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={onAddClick}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons name="plus" size={32} color={COLORES.textoSobrePrincipal} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBarContainer: { position: 'absolute', bottom: 0, width: '100%', alignItems: 'center' },
  bottomBar: {
    flexDirection: 'row', backgroundColor: COLORES.fondoBlanco, width: '100%', height: 70,
    justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3,
    elevation: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', width: 60 },
  tabLabel: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  floatingButton: {
    position: 'absolute', bottom: 30,
    backgroundColor: COLORES.verdeBoton,
    width: 65, height: 65, borderRadius: 32.5,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8,
    borderWidth: 4, borderColor: COLORES.fondoGris,
  },
});