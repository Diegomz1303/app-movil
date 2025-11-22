import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import LottieView from 'lottie-react-native'; 
import * as Animatable from 'react-native-animatable'; 
import { COLORES } from '../constants/colors';

// 1. Importar el contexto del tema
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2. Usar los valores del tema
  const { theme, isDark } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error al Ingresar', 'Credenciales incorrectas o usuario no registrado.');
    }
  };

  // Estilos dinámicos para inputs
  const inputContainerStyle = {
    backgroundColor: theme.card, // Blanco en light, Gris oscuro en dark
    shadowColor: isDark ? "#000" : "#000", 
    shadowOpacity: isDark ? 0.3 : 0.05, // Sombra más sutil en light
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* StatusBar se adapta automáticamente */}
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.background} 
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. LOGO / ANIMACIÓN SUPERIOR */}
          <View style={styles.headerContainer}>
            {/* Efecto de entrada: Zoom In */}
            <Animatable.View animation="zoomIn" duration={1500} useNativeDriver>
                <View style={[styles.lottieWrapper, { backgroundColor: theme.card, shadowColor: isDark ? '#000' : COLORES.principal }]}>
                    <LottieView
                        source={require('../assets/pet-animation.json')}
                        style={styles.lottieAnimation}
                        autoPlay
                        loop
                    />
                </View>
            </Animatable.View>
            
            <Animatable.Text animation="fadeInDown" delay={500} style={[styles.appName, { color: theme.primary }]}>
              Ohmypet
            </Animatable.Text>
          </View>

          {/* 2. FORMULARIO (Entra desde abajo) */}
          <Animatable.View 
            animation="fadeInUp" 
            delay={300} 
            duration={1000} 
            style={styles.formContainer}
          >
            
            {/* Input Usuario */}
            <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>CORREO ELECTRÓNICO</Text>
                <TextInput
                    style={[styles.input, inputContainerStyle, { color: theme.text }]}
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={theme.textSecondary}
                />
            </View>

            {/* Input Contraseña */}
            <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>CONTRASEÑA</Text>
                <View style={[styles.passwordContainer, inputContainerStyle]}>
                    <TextInput
                        style={[styles.inputPassword, { color: theme.text }]}
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        placeholderTextColor={theme.textSecondary}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <MaterialCommunityIcons 
                            name={showPassword ? "eye-off" : "eye"} 
                            size={22} 
                            color={theme.textSecondary} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Botón Login */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  
  // --- HEADER ---
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 60,
  },
  lottieWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 80, 
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    letterSpacing: 1,
  },

  // --- FORMULARIO ---
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
    marginLeft: 5,
  },
  input: {
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 0, // Sin borde para estilo limpio
  },
  
  // Contraseña
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },

  // --- BOTONES ---
  loginButton: {
    borderRadius: 30, 
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});