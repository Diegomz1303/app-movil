// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase'; // Importamos el cliente

// Importamos TODAS las pantallas
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen'; // ¡La nueva pantalla!

const Stack = createNativeStackNavigator();

export default function App() {
  // Estado para guardar la sesión del usuario
  const [session, setSession] = useState<Session | null>(null);
  // Estado de carga para evitar "parpadeos"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtenemos la sesión actual al cargar la app
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    // 2. Escuchamos cambios en la autenticación (Login, Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Limpiamos la suscripción al desmontar el componente
    return () => subscription.unsubscribe();
  }, []);

  // No mostramos nada mientras cargamos la sesión
  if (loading) {
    return null; // O un componente de "Cargando..."
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Ocultamos el header en todas
        }}
      >
        {/* Usamos un condicional (ternario) */}
        {/* ¿HAY SESIÓN? */}
        {session ? (
          // SÍ: Muestra el Panel de Admin
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        ) : (
          // NO: Muestra las pantallas de Login y Registro
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}