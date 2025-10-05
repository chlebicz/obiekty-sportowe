import { useContext } from 'react';
import useFacilityData from '../hooks/useFacilityData';
import { DataContext } from './data-context';
import { Facility } from '../lib/model/facility';
import ImageGallery from './image-gallery';

function List({ points }: { points: string[] }) {
  return (
    <ul className='list-disc list-inside text-gray-800'>
      {points.map((s: string) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}

function TextSection({ header, children }: {
  header: string, children: React.ReactNode
}) {
  return (
    <div className='p-4 space-y-3 flex-1'>
      <div>
        <h3 className='text-sm font-semibold text-gray-600 uppercase'>
          {header}
        </h3>
        {children}
      </div>
    </div>
  );
}

function GoBackButton({ onClick }: { onClick: () => any }) {
  return (
    <div className='pt-3 pl-4'>
      <button
        className='text-gray-500 text-sm font-medium transition-colors
          duration-300 hover:text-blue-500 cursor-pointer'
        onClick={onClick}
      >
        ← Wróć do listy
      </button>
    </div>
  );
}

function FacilityHeader({ name, address }: { name: string, address: string }) {
  return (
    <div className='p-4 border-b border-gray-200'>
      <h2 className='text-xl font-semibold text-gray-800'>{name}</h2>
      <p className='text-sm text-gray-500'>
        {address}
      </p>
    </div>
  );
}

function FacilityFooter({ goBack, navigate }: {
  goBack: () => any, navigate: () => any
}) {
  return (
    <div className='p-4 border-t border-gray-200 flex justify-end gap-2'>
      <button
        className='px-4 py-2 rounded-lg bg-gray-100 text-gray-700
          hover:bg-gray-200 transition cursor-pointer'
        onClick={goBack}
      >
        Wróć
      </button>
      <button
        className='px-4 py-2 rounded-lg bg-blue-600 text-white
          hover:bg-blue-700 transition cursor-pointer'
        onClick={navigate}
      >
        Nawiguj
      </button>
    </div>
  );
}

function FacilityInfo({ data }: { data: Facility }) {
  const { setSelectedFacility } = useContext(DataContext);

  const navigateLink = data.getNavigateLink();

  const goBack = () => setSelectedFacility(undefined);

  return (
    <>
      <GoBackButton onClick={goBack} />

      <FacilityHeader name={data.name} address={data.fullAddress} />

      <div
        className='h-48 bg-gray-200 flex items-center justify-center 
          text-gray-500'
      >
        <ImageGallery images={data.images} className='h-48 w-full' />
      </div>

      <TextSection header='Usługi'>
        <List points={data.serviceTypes} />
      </TextSection>

      {data.cards.length !== 0 &&
        <TextSection header='Karty'>
          <List points={data.cards} />
        </TextSection>}

      {(data.phone || data.email) &&
        <TextSection header='Kontakt'>
          {data.phone && <>Telefon: {data.phone}<br /></>}
          {data.email && `Email: ${data.email}`}
        </TextSection>}

      {data.website &&
          <TextSection header='Strona internetowa'>
          <a href={data.website}>{data.website}</a>
        </TextSection>}

      {data.fanpage &&
        <TextSection header='Fanpage'>
          <a href={data.fanpage}>{data.fanpage}</a>
        </TextSection>}

      {data.description &&
        <TextSection header='Opis'>
          {data.description}
        </TextSection>}

      <TextSection header='Godziny otwarcia'>
        <List points={data.getReadableOpenHours()} />
      </TextSection>

      <FacilityFooter
        goBack={goBack}
        navigate={() => window.open(navigateLink)}
      />
    </>
  );
}

export default function FacilityInfoContainer() {
  const { selectedFacility } = useContext(DataContext);
  const data = useFacilityData(selectedFacility);

  return (
    <>
      {data ? <FacilityInfo data={data} /> : 'Ładowanie...'}
    </>
  );
}