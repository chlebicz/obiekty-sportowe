import SearchFilters from './search-filters';
import SearchInput from './search-input';
import SearchSorting from './search-sorting';

export default function SearchParams() {
  return (
    <div className='p-4 flex flex-col'>
      <SearchInput />
      <SearchFilters />
      <SearchSorting />
    </div>
  );
}