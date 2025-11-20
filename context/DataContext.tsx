import React, { createContext, useState, useContext, ReactNode } from 'react';

// Definimos qué datos y funciones compartiremos
interface DataContextType {
  clientsTrigger: number;
  appointmentsTrigger: number;
  refreshClients: () => void;
  refreshAppointments: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Proveedor del contexto (El envoltorio)
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clientsTrigger, setClientsTrigger] = useState(0);
  const [appointmentsTrigger, setAppointmentsTrigger] = useState(0);

  const refreshClients = () => setClientsTrigger(prev => prev + 1);
  const refreshAppointments = () => setAppointmentsTrigger(prev => prev + 1);

  return (
    <DataContext.Provider value={{ 
      clientsTrigger, 
      appointmentsTrigger, 
      refreshClients, 
      refreshAppointments 
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe usarse dentro de un DataProvider');
  }
  return context;
};