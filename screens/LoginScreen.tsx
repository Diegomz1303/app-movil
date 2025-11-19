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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import LottieView from 'lottie-react-native'; 

// --- IMPORTANTE: Importamos los colores globales ---
import { COLORES } from '../constants/colors';

// Tipado básico para la navegación
type NavigationProps = {
  navigate: (screen: string) => void;
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProps>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    setLoading(false);

    if (error) {
      if (error.message === 'Invalid login credentials') {
        Alert.alert('Error', 'Correo o contraseña incorrectos.');
      } else {
        Alert.alert('Error al Ingresar', error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* StatusBar con el color principal (Verde) */}
      <StatusBar barStyle="light-content" backgroundColor={COLORES.principal} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* --- 1. EL CABEZAL DE COLOR (Ahora Verde) --- */}
          <View style={styles.headerContainer}>
            <LottieView
              source={require('../assets/pet-animation.json')}
              style={styles.lottieAnimation}
              autoPlay
              loop
            />
            <Text style={styles.headerTitle}>¡Hola!</Text>
            <Text style={styles.headerSubtitle}>Bienvenido a Ohmypet</Text>
          </View>

          {/* --- 2. EL FORMULARIO BLANCO --- */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Login</Text>

            {/* Input de Email */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                size={22}
                color={COLORES.textoSecundario}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo Electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORES.textoSecundario}
                editable={!loading}
              />
            </View>

            {/* Input de Contraseña */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={22}
                color={COLORES.textoSecundario}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                placeholderTextColor={COLORES.textoSecundario}
                editable={!loading}
              />
            </View>

            {/* Botón de Ingresar (Verde) */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Text>
            </TouchableOpacity>

            {/* Link a Registro */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes cuenta? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORES.principal, // Fondo verde detrás de la status bar
  },
  container: {
    flex: 1,
    backgroundColor: COLORES.fondoGris, // Usamos fondoGris en lugar de principalClaro
  },
  headerContainer: {
    backgroundColor: COLORES.principal, // Cabecera Verde
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  lottieAnimation: {
    width: 250,
    height: 250,
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORES.fondoBlanco,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORES.fondoBlanco,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORES.fondoBlanco,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -30,
    padding: 30,
    paddingTop: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORES.texto,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.fondoGris, // Input con fondo gris claro verdoso
    borderRadius: 12,
    marginBottom: 15,
    height: 55,
  },
  inputIcon: {
    marginLeft: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORES.texto,
    paddingRight: 15,
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: COLORES.principal, // Botón verde
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonText: {
    color: COLORES.fondoBlanco,
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  registerText: {
    fontSize: 16,
    color: COLORES.textoSecundario,
  },
  registerButtonText: {
    color: COLORES.principal, // Link verde
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: COLORES.inactivo, // Usamos el color inactivo del tema
  },
});