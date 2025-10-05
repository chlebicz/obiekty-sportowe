import { useContext } from 'react';
import { SortingOption } from '../lib/services/facilities';
import { DataContext } from './data-context';

export default function SearchSorting() {
  const {
    searchParams: { sortingOption, setSortingOption }
  } = useContext(DataContext);

  return (
    <div>
      <h3 className='font-semibold mb-2'>Sortuj według</h3>
      <select
        className='w-full border rounded-lg px-3 py-2.5 text-sm
          text-gray-700 focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500'
        value={sortingOption}
        onChange={
          e => setSortingOption(e.currentTarget.value as SortingOption)
        }
      >
        <option value='name'>Nazwa</option>
        <option value='distance'>Odległość</option>
        <option value='rating'>Oceny</option>
      </select>
    </div>
  );
}