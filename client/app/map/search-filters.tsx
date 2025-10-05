import { useContext, useRef, useState } from 'react';
import { DataContext } from './data-context';
import useAllParams from '../hooks/useAllParams';
import FilterSelector from './filter-selector';

function FilterItem({ item, onClick }: {
  item: string, onClick: () => any
}) {
  return (
    <span
      className={`
        relative group overflow-hidden px-3 py-1 rounded-full text-sm
        bg-blue-100 text-blue-800 cursor-pointer transition-colors
        duration-300
      `}
      key={item}
      onClick={onClick}
    >
      <span
        className={`
          relative group-hover:line-through transition-all
          duration-300
        `}
      >
        {item}
      </span>
    </span>
  );
}

export default function SearchFilters() {
  const { searchParams: {
    setSearchValue,
    setSelectedFilters,
    setSelectedServiceTypes,
    setSelectedCards
  } } = useContext(DataContext);

  const clearSearchParams = () => {
    setSearchValue('');
    setSelectedCards([]);
    setSelectedFilters([]);
    setSelectedServiceTypes([]);
  }

  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const allParams = useAllParams();
  const selectedParams = allParams.filter(p => p.isSelected);

  return (
    <div className='mb-4 w-full relative'>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='font-semibold'>Filtry</h3>

        <button
          className={`
            text-gray-500 text-sm font-medium transition-colors
            duration-300 hover:text-red-500 cursor-pointer
          `}
          onClick={clearSearchParams}
        >
          Wyczyść
        </button>
      </div>

      <div className='flex flex-wrap gap-2 items-center'>
        {selectedParams.map(param => (
          <FilterItem
            item={param.value}
            onClick={param.toggle}
            key={param.value}
          />
        ))}

        <button
          className={`
            bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-600
            hover:bg-gray-300 cursor-pointer
          `}
          onClick={() => setIsOpen(!isOpen)}
          ref={buttonRef}
        >
          + Dodaj
        </button>
      </div>

      {isOpen && (
        <FilterSelector
          hide={() => setIsOpen(false)}
          buttonRef={buttonRef}
        />
      )}
    </div>
  );
}