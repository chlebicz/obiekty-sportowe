import React, { useContext, useState } from 'react';
import { DataContext } from './data-context';
import { useTranslations } from 'next-intl';

function HamburgerLine({ className }: { className: string }) {
  return (
    <span
      className={`bg-white transition-all duration-300 ease-out 
        h-0.5 w-6 my-0.5 rounded-sm ${className}`}
    ></span>
  );
}

function HamburgerMenuIcon({ isOpen, onClick, className }: {
  isOpen: boolean, onClick: React.MouseEventHandler, className?: string
}) {
  return (
    <button
      className={
        'flex flex-col justify-center cursor-pointer ' + (className || '')
      }
      onClick={onClick}
    >
      <HamburgerLine className={isOpen ? 'translate-y-1.5 rotate-45' : ''} />
      <HamburgerLine className={isOpen ? 'opacity-0' : 'opacity-100'} />
      <HamburgerLine className={isOpen ? '-translate-y-1.5 -rotate-45' : ''} />
    </button>
  );
};

export default function Navbar() {
  const t = useTranslations('Navbar');
  const {
    isLeftPanelVisible, setIsLeftPanelVisible
  } = useContext(DataContext);

  return (
    <nav className='bg-blue-600 text-white px-6 py-4 shadow-md'>
      <div className='flex items-center justify-between'>
        <HamburgerMenuIcon
          isOpen={isLeftPanelVisible}
          onClick={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
          className='block lg:hidden' />

        <h1 className='text-lg'>{t('sportsFacilities')}</h1>

        <div className='hidden lg:flex gap-6 text-sm font-medium'>
          <a
            href='https://github.com/chlebicz'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-blue-300 transition-colors'
          >
            {t('author')}
          </a>
          <a
            href='https://github.com/chlebicz/obiekty-sportowe'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-blue-300 transition-colors'
          >
            {t('github')}
          </a>
        </div>
      </div>
    </nav>
  );
}