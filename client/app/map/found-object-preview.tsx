import { useContext } from 'react';
import { Facility } from '../lib/model/facility';
import { DataContext } from './data-context';

export default function FoundObjectPreview({ data }: { data: Facility }) {
  const { setSelectedFacility } = useContext(DataContext);

  const navigateLink = data.getNavigateLink();

  const isOpen = data.isOpenNow();

  return (
    <li
      className={`
        p-4 bg-white rounded-lg shadow-sm hover:bg-gray-100
        cursor-pointer
      `}
      onClick={() => setSelectedFacility(data.id)}
    >
      <div className='flex flex-col gap-1'>
        <h3 className='font-medium'>{data.name}</h3>
        <p className='text-sm text-gray-500'>{data.shortAddress}</p>
        <p className={
          'text-sm ' + (isOpen ? 'text-green-600' : 'text-red-600')
        }>{isOpen ? 'Otwarte' : 'Zamknięte'}</p>

        <div className='flex gap-2 mt-2'>
          <button
            className={`
              px-3 py-1 text-sm rounded-md bg-blue-500 text-white
              hover:bg-blue-600 transition-colors cursor-pointer
            `}
            onClick={() => window.open(navigateLink)}
          >
            Nawiguj
          </button>
          <button
            className={`
              px-3 py-1 text-sm rounded-md border border-gray-300
              text-gray-700 hover:bg-gray-200 transition-colors
              cursor-pointer
            `}
            onClick={() => setSelectedFacility(data.id)}
          >
            Więcej informacji
          </button>
        </div>
      </div>
    </li>
  );
}