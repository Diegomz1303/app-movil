import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { COLORES } from '../../constants/colors';
import * as Animatable from 'react-native-animatable';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { theme, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll para mantener la página seleccionada visible
  useEffect(() => {
    if (scrollViewRef.current) {
      const offset = (currentPage - 1) * 45; 
      scrollViewRef.current.scrollTo({ x: offset - 100, animated: true });
    }
  }, [currentPage]);

  if (totalPages <= 1) return null;

  const renderPageButton = (pageNumber: number) => {
    const isActive = pageNumber === currentPage;
    
    return (
      <TouchableOpacity
        key={pageNumber}
        onPress={() => onPageChange(pageNumber)}
        activeOpacity={0.7}
      >
        <Animatable.View 
          // --- CORRECCIÓN CRÍTICA ---
          // Eliminamos 'transform' de aquí para evitar el error.
          // Solo animamos el color de fondo suavemente.
          transition={['backgroundColor']} 
          duration={300}
          style={[
            styles.pageButton,
            { 
              backgroundColor: isActive ? theme.primary : theme.inputBackground,
              borderColor: theme.border,
              borderWidth: isActive ? 0 : 1,
              // El cambio de tamaño se aplica directo (sin animación compleja para evitar el crash)
              transform: [{ scale: isActive ? 1.1 : 1 }] 
            }
          ]}
        >
          <Text style={[
            styles.pageText, 
            { 
              color: isActive ? 'white' : theme.text,
              fontWeight: isActive ? 'bold' : 'normal' 
            }
          ]}>
            {pageNumber}
          </Text>
        </Animatable.View>
      </TouchableOpacity>
    );
  };

  // Generamos un array de números del 1 al totalPages
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Botón Anterior */}
        <TouchableOpacity 
          disabled={currentPage === 1}
          onPress={() => onPageChange(currentPage - 1)}
          style={[styles.navButton, { opacity: currentPage === 1 ? 0.3 : 1 }]}
        >
           <Text style={{color: theme.textSecondary, fontSize: 20}}>‹</Text>
        </TouchableOpacity>

        {/* Números */}
        {pages.map(p => renderPageButton(p))}

        {/* Botón Siguiente */}
        <TouchableOpacity 
          disabled={currentPage === totalPages}
          onPress={() => onPageChange(currentPage + 1)}
          style={[styles.navButton, { opacity: currentPage === totalPages ? 0.3 : 1 }]}
        >
           <Text style={{color: theme.textSecondary, fontSize: 20}}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 1
  },
  pageText: {
    fontSize: 14,
  },
  navButton: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center'
  }
});