import React, { useContext } from 'react';
import FacilityInfo from './facility-info';
import Search from './search';
import { DataContext } from './data-context';

export enum View {
  Search = 'search',
  Details = 'details'
}

export default function LeftPanel() {
  const { selectedFacility, isLeftPanelVisible } = useContext(DataContext);

  return (
    <div
      className={
        'w-full max-w-[400px] bg-white shadow-md flex-col overflow-y-auto'
          + (isLeftPanelVisible ? ' flex' : ' hidden')
          + ' lg:flex'
      }
    >
      {
        !selectedFacility
          ? <Search />
          : <FacilityInfo />
      }
    </div>
  );
}