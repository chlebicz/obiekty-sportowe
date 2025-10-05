import { FormEvent, useContext, useEffect, useRef, useState } from 'react';
import { FuzzySearchResult } from '../lib/services/facilities';
import { DataContext } from './data-context';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import useFuzzySearch from '../hooks/useFuzzySearch';

function SearchInputDropdownFilteredItem({ item }: {
  item: FuzzySearchResult
}) {
  const { setSelectedFacility } = useContext(DataContext);

  return (
    <li
      className='px-2 py-3 text-sm text-gray-700 hover:bg-gray-100
        cursor-pointer rounded-lg flex items-center gap-1'
      onMouseDown={() => setSelectedFacility(item.id)}
    >
      <MapPinIcon
        className='w-5 h-5 flex-shrink-0 relative top-[-1.5px] text-blue-500'
      />
      <span className='leading-none font-semibold'>{item.name}</span>
    </li>
  );
}

function SearchInputDropdown({ searchDraft, ref }:
  { searchDraft: string, ref?: React.Ref<HTMLUListElement> }
) {
  const { loading, result } = useFuzzySearch(searchDraft);

  let content: React.ReactNode;
  if (loading)
    content = (
      <li className='px-4 py-2 text-sm text-gray-400'>
        Ładowanie...
      </li>
    );
  else if (result.length === 0)
    content = (
      <li className='px-4 py-2 text-sm text-gray-400'>
        Brak wyników
      </li>
    );
  else
    content = result.map((item) => (
      <SearchInputDropdownFilteredItem item={item} key={item.id} />
    ));

  return (
    <ul
      className='absolute top-full left-0 mt-1 w-full bg-white
        border rounded-lg shadow-lg z-10'
      ref={ref}
    >
      {content}
    </ul>
  );
}

export default function SearchInput() {
  const { searchParams: {
    searchValue, setSearchValue
  } } = useContext(DataContext);

  const [searchDraft, setSearchDraft] = useState(searchValue || '');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current || !inputRef.current)
        return;

      const inDropdown = dropdownRef.current.contains(event.target as Node);
      const inInput = inputRef.current.contains(event.target as Node);

      if (dropdownRef.current && !inDropdown && !inInput)
        setIsDropdownVisible(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchValue(searchDraft);
    setIsDropdownVisible(false);
  }

  return (
    <div className='mb-4 relative'>
      <label className='relative block'>
        <span
          className='absolute inset-y-0 left-0 flex items-center
            pl-3 text-gray-400 pointer-events-none'
        >
          <MagnifyingGlassIcon className='h-5 w-5' />
        </span>
        <form onSubmit={handleSubmit}>
          <input
            type='text'
            placeholder='Wyszukaj...'
            className='pl-10 pr-3 py-2.5 w-full border rounded-lg text-sm
              text-gray-700 placeholder-gray-400 focus:outline-none
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            value={searchDraft}
            onChange={e => setSearchDraft(e.currentTarget.value)}
            onFocus={() => setIsDropdownVisible(true)}
            ref={inputRef}
          />
        </form>
      </label>

      {isDropdownVisible && <SearchInputDropdown
        searchDraft={searchDraft}
        ref={dropdownRef}
      />}
    </div>
  );
}