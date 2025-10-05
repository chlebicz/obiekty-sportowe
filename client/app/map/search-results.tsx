import { useContext, useEffect, useRef, useState } from 'react';
import { DataContext } from './data-context';
import useFullSearch, { getSearchParamDeps } from '../hooks/useFullSearch';
import ScrollableList from './scrollable-list';
import FoundObjectPreview from './found-object-preview';

export default function SearchResults() {
  const [page, setPage] = useState(0);
  const { searchParams } = useContext(DataContext);
  const scrollRef = useRef<HTMLDivElement>(null);
  const foundObjects = useFullSearch(searchParams, page);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({ top: 0 });

    if (page != 0)
      setPage(0);
  }, getSearchParamDeps(searchParams));

  return (
    <div
      className='flex-1 overflow-y-auto bg-gray-50 rounded-xl'
      ref={scrollRef}
    >
      <h3 className='font-semibold mb-2 text-gray-800 px-4 pt-3'>
        Znalezione obiekty
      </h3>
      {foundObjects.length === 0 ? (
        <ul className='space-y-2 px-4 pb-3'>
          <div className='flex flex-col items-center text-gray-500 py-6'>
            <p className='text-base'>
              Nie znaleziono żadnego obiektu o podanych parametrach :(
            </p>
          </div>
        </ul>
      ) : (
        <ScrollableList
          onEndReach={() => setPage(page + 1)}
          className='space-y-2 px-4 pb-3'
        >
          {
            foundObjects.map((obj) => (
              <FoundObjectPreview data={obj} key={obj.id} />
            ))
          }
        </ScrollableList>
      )}
    </div>
  );
}