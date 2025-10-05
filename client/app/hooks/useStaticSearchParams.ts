import { useEffect, useState } from 'react';
import { useServices } from '../lib/context';

export default function useStaticSearchParams() {
  const { facilitiesService } = useServices();

  const [filters, setFilters] = useState<string[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [cards, setCards] = useState<string[]>([]);

  useEffect(() => {
    facilitiesService.getStaticSearchParams()
      .then(({ filters, serviceTypes, cards }) => {
        setFilters(filters);
        setServiceTypes(serviceTypes);
        setCards(cards);
      });
  }, []);

  return { filters, serviceTypes, cards };
}