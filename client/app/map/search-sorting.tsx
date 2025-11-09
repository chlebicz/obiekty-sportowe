import { useContext } from 'react';
import { SortingOption } from '../lib/services/facilities';
import { DataContext } from './data-context';
import { useTranslations } from 'next-intl';

export default function SearchSorting() {
  const t = useTranslations('SearchSorting');

  const {
    searchParams: { sortingOption, setSortingOption }
  } = useContext(DataContext);

  return (
    <div>
      <h3 className='text-black font-semibold mb-2'>{t('sortBy')}</h3>
      <select
        className='w-full border rounded-lg px-3 py-2.5 text-sm
          text-gray-700 focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500'
        value={sortingOption}
        onChange={
          e => setSortingOption(e.currentTarget.value as SortingOption)
        }
      >
        <option value='name'>{t('name')}</option>
        <option value='distance'>{t('distance')}</option>
        <option value='rating'>{t('rating')}</option>
      </select>
    </div>
  );
}