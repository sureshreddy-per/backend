export interface Language {
  code: string;
  name: string;
  isActive: boolean;
  direction: 'ltr' | 'rtl';
  isIndian?: boolean;
}

export interface LanguageConfig {
  defaultLanguage: string;
  supportedLanguages: Language[];
}

export const languageConfig: LanguageConfig = {
  defaultLanguage: 'en',
  supportedLanguages: [
    {
      code: 'en',
      name: 'English',
      isActive: true,
      direction: 'ltr'
    },
    // Major Indian Languages
    {
      code: 'hi',
      name: 'Hindi',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'bn',
      name: 'Bengali',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'te',
      name: 'Telugu',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'ta',
      name: 'Tamil',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'mr',
      name: 'Marathi',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'gu',
      name: 'Gujarati',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'kn',
      name: 'Kannada',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'ml',
      name: 'Malayalam',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'pa',
      name: 'Punjabi',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'or',
      name: 'Odia',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    {
      code: 'as',
      name: 'Assamese',
      isActive: true,
      direction: 'ltr',
      isIndian: true
    },
    // Other languages
    {
      code: 'es',
      name: 'Spanish',
      isActive: true,
      direction: 'ltr'
    },
    {
      code: 'fr',
      name: 'French',
      isActive: true,
      direction: 'ltr'
    }
  ]
}; 