import { DetailedHTMLProps, HTMLAttributes, useEffect, useRef } from 'react';

export default function ScrollableList({
  children, onEndReach, ...props
}: {
  children: React.ReactNode[],
  onEndReach: () => any
} & DetailedHTMLProps<HTMLAttributes<HTMLUListElement>, HTMLUListElement>) {
  const listEndRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    let fired = false;

    const observer = new IntersectionObserver(
      entries => {
        if (!fired && entries[0].isIntersecting) {
          onEndReach();
          fired = true;
        }
      },
      { threshold: 1 }
    );

    if (listEndRef.current)
      observer.observe(listEndRef.current);

    return () => {
      if (listEndRef.current)
        observer.unobserve(listEndRef.current);
    }
  }, [children.length]);

  return (
    <ul {...props}>
      {children}
      <li className='display-none' ref={listEndRef}></li>
    </ul>
  );
}