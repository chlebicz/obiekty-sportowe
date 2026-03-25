'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { 'api-url' as apiUrl } from '../config.json';
import { useTranslations } from 'next-intl';
import { FaceFrownIcon } from '@heroicons/react/24/outline';

const LoadingSpinner = () => {
  return (
    <div className='flex justify-center items-center'>
      <div className={'w-12 h-12 rounded-full animate-spin border-5'
        + ' border-solid border-gray-600 border-t-white'}></div>
    </div>
  );
};

export default function Home() {
  const [isError, setIsError] = useState(false);
  const router = useRouter();
  const t = useTranslations('LoadingScreen');

  useEffect(() => {
    // fetch(apiUrl)
    //   .then(() => router.push('/map'))
    //   .catch(() => setIsError(true));
  }, [router]);

  if (isError)
    return (
      <div className='flex justify-center items-center h-screen flex-col gap-3 text-center px-2'>
        <FaceFrownIcon className='w-14 h-14' />
        {t('error')}
      </div>
    );

  return (
    <div className='flex justify-center items-center h-screen flex-col gap-3 text-center px-2'>
      <LoadingSpinner />
      {t('pleaseWait')}
    </div>
  );
}
