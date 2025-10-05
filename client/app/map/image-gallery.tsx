import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ButtonHTMLAttributes, DetailedHTMLProps, useState } from 'react';

function GalleryDot(
  { active, className, ...props }: { active: boolean } & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement
  >
) {
  let resultClassName = 'w-2.5 h-2.5 rounded-full transition cursor-pointer ';
  if (active)
    resultClassName += 'bg-white';
  else
    resultClassName += 'bg-white/50 hover:bg-white/80';

  if (className)
    resultClassName += ' ' + className;

  return (
    <button
      className={resultClassName}
      {...props}
    />
  )
}

export default function ImageGallery({ images, className }: {
  images: string[], className?: string
}) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className={`
          bg-gray-200 flex items-center justify-center
          text-gray-500 ${className}
        `}
      >
        <span>Brak dostępnych obrazków :(</span>
      </div>
    );
  }

  const prev = () =>
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const next = () =>
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className={`relative overflow-hidden shadow-md ${className}`}>
      <img
        src={images[current]}
        alt={`Gallery image ${current + 1}`}
        className='w-full h-full object-cover transition-all duration-500'
      />

      <button
        onClick={prev}
        className='absolute left-3 top-1/2 -translate-y-1/2 bg-black/40
          hover:bg-black/60 text-white p-2 rounded-full transition
          cursor-pointer'
      >
        <ArrowLeftIcon className='h-5 w-5' />
      </button>

      <button
        onClick={next}
        className='absolute right-3 top-1/2 -translate-y-1/2 bg-black/40
          hover:bg-black/60 text-white p-2 rounded-full transition
          cursor-pointer'
      >
        <ArrowRightIcon className='h-5 w-5' />
      </button>

      <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2'>
        {images.map((_, idx) => (
          <GalleryDot
            key={idx}
            active={current === idx}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
}