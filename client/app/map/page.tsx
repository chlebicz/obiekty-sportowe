'use client';

import React, { useState } from 'react';
import { ServicesProvider } from '../lib/context';
import Navbar from './navbar';
import LeftPanel from './left-panel';
import dynamic from 'next/dynamic';
import { DataContext } from './data-context';
import { SortingOption } from '../lib/services/facilities';

const MapContents = dynamic(() => import('./map'), {
  ssr: false
});

export default function MapPage() {
  const [selectedFacility, setSelectedFacility] = useState<number | undefined>(
    undefined
  );

  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds>();

  const [searchValue, setSearchValue] = useState('');  
  const [sortingOption, setSortingOption] = useState<SortingOption>('name');

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [
    selectedServiceTypes, setSelectedServiceTypes
  ] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  return (
    <main className='flex flex-col h-screen w-full'>
      <Navbar />

      <ServicesProvider>
        <DataContext.Provider value={{
          selectedFacility, setSelectedFacility,
          searchParams: {
            mapBounds, setMapBounds,

            searchValue, setSearchValue,

            selectedFilters, setSelectedFilters,
            selectedServiceTypes, setSelectedServiceTypes,
            selectedCards, setSelectedCards,

            sortingOption, setSortingOption
          }
        }}>
          <div className='flex flex-1 min-h-0'>
            <LeftPanel />
            <MapContents />
          </div>
        </DataContext.Provider>
      </ServicesProvider>
    </main>
  );
}
