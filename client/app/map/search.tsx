import React from 'react';
import SearchResults from './search-results';
import SearchParams from './search-params';

export default function Search() {
  return (
    <div className='flex flex-col h-full bg-white rounded-2xl shadow'>
      <SearchParams />
      <SearchResults />
    </div>
  );
}