import React, { useContext } from 'react';
import FacilityInfo from './facility-info';
import Search from './search';
import { DataContext } from './data-context';

export enum View {
  Search = 'search',
  Details = 'details'
}

export default function LeftPanel() {
  const { selectedFacility } = useContext(DataContext);

  return (
    <div
      className='w-[500px] bg-white shadow-md flex flex-col overflow-y-auto'
    >
      {
        !selectedFacility
          ? <Search />
          : <FacilityInfo />
      }
    </div>
  );
}