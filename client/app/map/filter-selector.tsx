import { useState, useRef, useEffect, useContext } from 'react';
import useStaticSearchParams from '../hooks/useStaticSearchParams';
import TabbedSelector, { CheckboxItem } from './tabbed-selector';
import { DataContext } from './data-context';
import useAllParams from '../hooks/useAllParams';
import { useTranslations } from 'next-intl';

function FilterSearchResults({ searchTerm }: { searchTerm: string }) {
  const allParams = useAllParams();
  const t = useTranslations('FilterSelector');

  const results = allParams.filter(f =>
    f.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (results.length === 0)
    return (
      <div className='max-h-48 overflow-y-auto space-y-2'>
        <p className='text-gray-400 text-sm'>{t('noResults')}</p>
      </div>
    );

  return (
    <div className='max-h-48 overflow-y-auto space-y-2'>
      {results.map(item => (
        <CheckboxItem
          label={item.value}
          checked={item.isSelected}
          onChange={item.toggle}
          type={item.type}
          key={item.type + ':' + item.value}
        />
      ))}
    </div>
  );
}

function ParamTabs() {
  const t = useTranslations('FilterSelector');
  const { filters, serviceTypes, cards } = useStaticSearchParams();
  
  const { searchParams: {
    selectedFilters, setSelectedFilters,
    selectedServiceTypes, setSelectedServiceTypes,
    selectedCards, setSelectedCards
  } } = useContext(DataContext);

  const tabs = [
    {
      name: t('filters'),
      options: filters,
      selected: selectedFilters
    },
    {
      name: t('services'),
      options: serviceTypes,
      selected: selectedServiceTypes
    },
    {
      name: t('cards'),
      options: cards,
      selected: selectedCards
    }
  ];

  const handleTabContentChange = (tab: string, selected: string[]) => {
    if (tab === t('filters'))
      setSelectedFilters(selected);
    else if (tab === t('services'))
      setSelectedServiceTypes(selected);
    else if (tab === t('cards'))
      setSelectedCards(selected);
  }

  return (
    <TabbedSelector
      tabs={tabs}
      onTabContentChange={handleTabContentChange}
    />
  );
}

export default function FilterSelector(
  { hide, buttonRef }:
    {
      hide: Function,
      buttonRef: React.RefObject<HTMLButtonElement | null>
    }
) {
  const t = useTranslations('FilterSelector');
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !buttonRef.current!.contains(e.target as Node)
      ) {
        hide();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hide, buttonRef]);

  return (
    <div
      ref={dropdownRef}
      className='absolute left-0 mt-2 w-full bg-white
        border border-gray-200 rounded-2xl shadow-md p-4 z-20'
    >
      <input
        type='text'
        placeholder={t('searchFilters')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className='w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg
          text-sm focus:outline-none focus:border-blue-400 text-black'
      />

      {searchTerm === '' ? (
        <ParamTabs />
      ) : (
        <FilterSearchResults searchTerm={searchTerm} />
      )}
    </div>
  );
}
