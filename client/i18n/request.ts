import { getRequestConfig } from 'next-intl/server';
 
export default getRequestConfig(async () => {
  const locale = 'pl';
 
  return {
    locale,
    messages: (await import(`./${locale}.json`)).default
  };
});