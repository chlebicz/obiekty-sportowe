import React, { createContext } from 'react';
import { FacilitiesService } from './services/facilities';
import ApiClient from './api-client';

const facilitiesService = new FacilitiesService(new ApiClient());

export const ServicesContext = createContext({
  facilitiesService
});

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  return (
    <ServicesContext.Provider value={{ facilitiesService }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  return React.useContext(ServicesContext);
}