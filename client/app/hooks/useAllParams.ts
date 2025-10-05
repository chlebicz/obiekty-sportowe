import { useContext } from 'react';
import { DataContext, SetState } from '../map/data-context';
import useStaticSearchParams from './useStaticSearchParams';

export const getParamToggler = (
  setState: SetState<string[]>, filter: string
) =>
  () =>
    setState(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );

export interface ExpandedParam {
  type: string;
  value: string;
  isSelected: boolean;
  toggle: () => any;
}

export function buildParamGroup(
  type: string, values: string[],
  selected: string[], setSelected: SetState<string[]>
): ExpandedParam[] {
  return values.map(value => ({
    type,
    value,
    isSelected: selected.includes(value),
    toggle: getParamToggler(setSelected, value)
  }));
}

export default function useAllParams() {
  const { searchParams: { 
    selectedFilters, setSelectedFilters,
    selectedServiceTypes, setSelectedServiceTypes,
    selectedCards, setSelectedCards
  } } = useContext(DataContext);

  const { filters, serviceTypes, cards } = useStaticSearchParams();

  return [
    ...buildParamGroup('Filtry', filters, selectedFilters, setSelectedFilters),
    ...buildParamGroup(
      'Usługi', serviceTypes, selectedServiceTypes, setSelectedServiceTypes
    ),
    ...buildParamGroup('Karty', cards, selectedCards, setSelectedCards)
  ];
}