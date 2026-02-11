import * as de from './languages/de.json';
import * as en from './languages/en.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const languages: Record<string, any> = { de, en };

export function localize(string: string, search = '', replace = ''): string {
  const lang = (localStorage.getItem('selectedLanguage') || 'de').replace(/['"]+/g, '').replace('-', '_');
  let translated: string;
  try {
    translated = string.split('.').reduce((o: any, i: string) => o[i], languages[lang]);
  } catch {
    translated = string.split('.').reduce((o: any, i: string) => o[i], languages['en']);
  }
  if (translated === undefined) {
    translated = string.split('.').reduce((o: any, i: string) => o[i], languages['en']);
  }
  if (search !== '' && replace !== '') {
    translated = translated.replace(search, replace);
  }
  return translated;
}
