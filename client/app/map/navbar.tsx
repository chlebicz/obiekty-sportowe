export default function Navbar() {
  return (
    <nav className='bg-blue-600 text-white px-6 py-4 shadow-md'>
      <div className='flex items-center justify-between'>
        <h1 className='text-lg'>Obiekty sportowe</h1>

        <div className='flex gap-6 text-sm font-medium'>
          <a
            href='https://github.com/polishchlieb'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-blue-300 transition-colors'
          >
            Autor
          </a>
          <a
            href='https://github.com/polishchlieb/obiekty-sportowe'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-blue-300 transition-colors'
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}