export interface Locale {
    value: string;
    label: string;
    region: string;
    nativeName: string;
}

export const locales: Locale[] = [
    // English
    {
        value: 'en-US',
        label: 'English (United States)',
        region: 'English',
        nativeName: 'English'
    },
    {
        value: 'en-GB',
        label: 'English (United Kingdom)',
        region: 'English',
        nativeName: 'English'
    },
    {
        value: 'en-CA',
        label: 'English (Canada)',
        region: 'English',
        nativeName: 'English'
    },
    {
        value: 'en-AU',
        label: 'English (Australia)',
        region: 'English',
        nativeName: 'English'
    },

    // Spanish
    {
        value: 'es-ES',
        label: 'Spanish (Spain)',
        region: 'Spanish',
        nativeName: 'Español'
    },
    {
        value: 'es-MX',
        label: 'Spanish (Mexico)',
        region: 'Spanish',
        nativeName: 'Español'
    },
    {
        value: 'es-AR',
        label: 'Spanish (Argentina)',
        region: 'Spanish',
        nativeName: 'Español'
    },
    {
        value: 'es-CO',
        label: 'Spanish (Colombia)',
        region: 'Spanish',
        nativeName: 'Español'
    },

    // French
    {
        value: 'fr-FR',
        label: 'French (France)',
        region: 'French',
        nativeName: 'Français'
    },
    {
        value: 'fr-CA',
        label: 'French (Canada)',
        region: 'French',
        nativeName: 'Français'
    },
    {
        value: 'fr-BE',
        label: 'French (Belgium)',
        region: 'French',
        nativeName: 'Français'
    },
    {
        value: 'fr-CH',
        label: 'French (Switzerland)',
        region: 'French',
        nativeName: 'Français'
    },

    // German
    {
        value: 'de-DE',
        label: 'German (Germany)',
        region: 'German',
        nativeName: 'Deutsch'
    },
    {
        value: 'de-AT',
        label: 'German (Austria)',
        region: 'German',
        nativeName: 'Deutsch'
    },
    {
        value: 'de-CH',
        label: 'German (Switzerland)',
        region: 'German',
        nativeName: 'Deutsch'
    },

    // Italian
    {
        value: 'it-IT',
        label: 'Italian (Italy)',
        region: 'Italian',
        nativeName: 'Italiano'
    },
    {
        value: 'it-CH',
        label: 'Italian (Switzerland)',
        region: 'Italian',
        nativeName: 'Italiano'
    },

    // Portuguese
    {
        value: 'pt-BR',
        label: 'Portuguese (Brazil)',
        region: 'Portuguese',
        nativeName: 'Português'
    },
    {
        value: 'pt-PT',
        label: 'Portuguese (Portugal)',
        region: 'Portuguese',
        nativeName: 'Português'
    },

    // Dutch
    {
        value: 'nl-NL',
        label: 'Dutch (Netherlands)',
        region: 'Dutch',
        nativeName: 'Nederlands'
    },
    {
        value: 'nl-BE',
        label: 'Dutch (Belgium)',
        region: 'Dutch',
        nativeName: 'Nederlands'
    },

    // Russian
    {
        value: 'ru-RU',
        label: 'Russian (Russia)',
        region: 'Russian',
        nativeName: 'Русский'
    },

    // Chinese
    {
        value: 'zh-CN',
        label: 'Chinese (Simplified)',
        region: 'Chinese',
        nativeName: '中文'
    },
    {
        value: 'zh-TW',
        label: 'Chinese (Traditional)',
        region: 'Chinese',
        nativeName: '中文'
    },
    {
        value: 'zh-HK',
        label: 'Chinese (Hong Kong)',
        region: 'Chinese',
        nativeName: '中文'
    },

    // Japanese
    {
        value: 'ja-JP',
        label: 'Japanese (Japan)',
        region: 'Japanese',
        nativeName: '日本語'
    },

    // Korean
    {
        value: 'ko-KR',
        label: 'Korean (South Korea)',
        region: 'Korean',
        nativeName: '한국어'
    },

    // Arabic
    {
        value: 'ar-SA',
        label: 'Arabic (Saudi Arabia)',
        region: 'Arabic',
        nativeName: 'العربية'
    },
    {
        value: 'ar-EG',
        label: 'Arabic (Egypt)',
        region: 'Arabic',
        nativeName: 'العربية'
    },
    {
        value: 'ar-AE',
        label: 'Arabic (UAE)',
        region: 'Arabic',
        nativeName: 'العربية'
    },

    // Hindi
    {
        value: 'hi-IN',
        label: 'Hindi (India)',
        region: 'Hindi',
        nativeName: 'हिन्दी'
    },

    // Other European
    {
        value: 'sv-SE',
        label: 'Swedish (Sweden)',
        region: 'Nordic',
        nativeName: 'Svenska'
    },
    {
        value: 'no-NO',
        label: 'Norwegian (Norway)',
        region: 'Nordic',
        nativeName: 'Norsk'
    },
    {
        value: 'da-DK',
        label: 'Danish (Denmark)',
        region: 'Nordic',
        nativeName: 'Dansk'
    },
    {
        value: 'fi-FI',
        label: 'Finnish (Finland)',
        region: 'Nordic',
        nativeName: 'Suomi'
    },
    {
        value: 'pl-PL',
        label: 'Polish (Poland)',
        region: 'Eastern Europe',
        nativeName: 'Polski'
    },
    {
        value: 'cs-CZ',
        label: 'Czech (Czech Republic)',
        region: 'Eastern Europe',
        nativeName: 'Čeština'
    },
    {
        value: 'hu-HU',
        label: 'Hungarian (Hungary)',
        region: 'Eastern Europe',
        nativeName: 'Magyar'
    },
    {
        value: 'ro-RO',
        label: 'Romanian (Romania)',
        region: 'Eastern Europe',
        nativeName: 'Română'
    },
    {
        value: 'bg-BG',
        label: 'Bulgarian (Bulgaria)',
        region: 'Eastern Europe',
        nativeName: 'Български'
    },
    {
        value: 'hr-HR',
        label: 'Croatian (Croatia)',
        region: 'Eastern Europe',
        nativeName: 'Hrvatski'
    },
    {
        value: 'sk-SK',
        label: 'Slovak (Slovakia)',
        region: 'Eastern Europe',
        nativeName: 'Slovenčina'
    },
    {
        value: 'sl-SI',
        label: 'Slovenian (Slovenia)',
        region: 'Eastern Europe',
        nativeName: 'Slovenščina'
    },
    {
        value: 'et-EE',
        label: 'Estonian (Estonia)',
        region: 'Baltic',
        nativeName: 'Eesti'
    },
    {
        value: 'lv-LV',
        label: 'Latvian (Latvia)',
        region: 'Baltic',
        nativeName: 'Latviešu'
    },
    {
        value: 'lt-LT',
        label: 'Lithuanian (Lithuania)',
        region: 'Baltic',
        nativeName: 'Lietuvių'
    },
    {
        value: 'el-GR',
        label: 'Greek (Greece)',
        region: 'Southern Europe',
        nativeName: 'Ελληνικά'
    },
    {
        value: 'tr-TR',
        label: 'Turkish (Turkey)',
        region: 'Southern Europe',
        nativeName: 'Türkçe'
    },

    // Other Asian
    {
        value: 'th-TH',
        label: 'Thai (Thailand)',
        region: 'Southeast Asia',
        nativeName: 'ไทย'
    },
    {
        value: 'vi-VN',
        label: 'Vietnamese (Vietnam)',
        region: 'Southeast Asia',
        nativeName: 'Tiếng Việt'
    },
    {
        value: 'id-ID',
        label: 'Indonesian (Indonesia)',
        region: 'Southeast Asia',
        nativeName: 'Bahasa Indonesia'
    },
    {
        value: 'ms-MY',
        label: 'Malay (Malaysia)',
        region: 'Southeast Asia',
        nativeName: 'Bahasa Melayu'
    },
    {
        value: 'tl-PH',
        label: 'Filipino (Philippines)',
        region: 'Southeast Asia',
        nativeName: 'Filipino'
    },

    // Other
    {
        value: 'he-IL',
        label: 'Hebrew (Israel)',
        region: 'Middle East',
        nativeName: 'עברית'
    },
    {
        value: 'fa-IR',
        label: 'Persian (Iran)',
        region: 'Middle East',
        nativeName: 'فارسی'
    },
    {
        value: 'ur-PK',
        label: 'Urdu (Pakistan)',
        region: 'South Asia',
        nativeName: 'اردو'
    },
    {
        value: 'bn-BD',
        label: 'Bengali (Bangladesh)',
        region: 'South Asia',
        nativeName: 'বাংলা'
    },
    {
        value: 'ta-IN',
        label: 'Tamil (India)',
        region: 'South Asia',
        nativeName: 'தமிழ்'
    },
    {
        value: 'te-IN',
        label: 'Telugu (India)',
        region: 'South Asia',
        nativeName: 'తెలుగు'
    },
    {
        value: 'mr-IN',
        label: 'Marathi (India)',
        region: 'South Asia',
        nativeName: 'मराठी'
    },
    {
        value: 'gu-IN',
        label: 'Gujarati (India)',
        region: 'South Asia',
        nativeName: 'ગુજરાતી'
    },
    {
        value: 'kn-IN',
        label: 'Kannada (India)',
        region: 'South Asia',
        nativeName: 'ಕನ್ನಡ'
    },
    {
        value: 'ml-IN',
        label: 'Malayalam (India)',
        region: 'South Asia',
        nativeName: 'മലയാളം'
    },
    {
        value: 'pa-IN',
        label: 'Punjabi (India)',
        region: 'South Asia',
        nativeName: 'ਪੰਜਾਬੀ'
    }
];

export function findLocaleByValue(value: string): Locale | undefined {
    return locales.find((locale) => locale.value === value);
}

export function getLocaleLabel(value: string): string {
    const locale = findLocaleByValue(value);
    return locale ? locale.label : value;
}
