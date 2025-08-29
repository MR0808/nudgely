export const timezones = [
    // North America
    {
        value: 'America/New_York',
        label: 'Eastern Time (New York)',
        region: 'North America'
    },
    {
        value: 'America/Chicago',
        label: 'Central Time (Chicago)',
        region: 'North America'
    },
    {
        value: 'America/Denver',
        label: 'Mountain Time (Denver)',
        region: 'North America'
    },
    {
        value: 'America/Los_Angeles',
        label: 'Pacific Time (Los Angeles)',
        region: 'North America'
    },
    {
        value: 'America/Anchorage',
        label: 'Alaska Time (Anchorage)',
        region: 'North America'
    },
    {
        value: 'Pacific/Honolulu',
        label: 'Hawaii Time (Honolulu)',
        region: 'North America'
    },
    {
        value: 'America/Toronto',
        label: 'Eastern Time (Toronto)',
        region: 'North America'
    },
    {
        value: 'America/Vancouver',
        label: 'Pacific Time (Vancouver)',
        region: 'North America'
    },
    {
        value: 'America/Mexico_City',
        label: 'Central Time (Mexico City)',
        region: 'North America'
    },

    // Europe
    {
        value: 'Europe/London',
        label: 'Greenwich Mean Time (London)',
        region: 'Europe'
    },
    {
        value: 'Europe/Paris',
        label: 'Central European Time (Paris)',
        region: 'Europe'
    },
    {
        value: 'Europe/Berlin',
        label: 'Central European Time (Berlin)',
        region: 'Europe'
    },
    {
        value: 'Europe/Rome',
        label: 'Central European Time (Rome)',
        region: 'Europe'
    },
    {
        value: 'Europe/Madrid',
        label: 'Central European Time (Madrid)',
        region: 'Europe'
    },
    {
        value: 'Europe/Amsterdam',
        label: 'Central European Time (Amsterdam)',
        region: 'Europe'
    },
    {
        value: 'Europe/Stockholm',
        label: 'Central European Time (Stockholm)',
        region: 'Europe'
    },
    {
        value: 'Europe/Helsinki',
        label: 'Eastern European Time (Helsinki)',
        region: 'Europe'
    },
    {
        value: 'Europe/Athens',
        label: 'Eastern European Time (Athens)',
        region: 'Europe'
    },
    {
        value: 'Europe/Moscow',
        label: 'Moscow Standard Time (Moscow)',
        region: 'Europe'
    },
    {
        value: 'Europe/Istanbul',
        label: 'Turkey Time (Istanbul)',
        region: 'Europe'
    },

    // Asia
    {
        value: 'Asia/Tokyo',
        label: 'Japan Standard Time (Tokyo)',
        region: 'Asia'
    },
    {
        value: 'Asia/Shanghai',
        label: 'China Standard Time (Shanghai)',
        region: 'Asia'
    },
    {
        value: 'Asia/Hong_Kong',
        label: 'Hong Kong Time (Hong Kong)',
        region: 'Asia'
    },
    {
        value: 'Asia/Singapore',
        label: 'Singapore Standard Time (Singapore)',
        region: 'Asia'
    },
    {
        value: 'Asia/Seoul',
        label: 'Korea Standard Time (Seoul)',
        region: 'Asia'
    },
    {
        value: 'Asia/Taipei',
        label: 'Taipei Standard Time (Taipei)',
        region: 'Asia'
    },
    {
        value: 'Asia/Bangkok',
        label: 'Indochina Time (Bangkok)',
        region: 'Asia'
    },
    {
        value: 'Asia/Jakarta',
        label: 'Western Indonesia Time (Jakarta)',
        region: 'Asia'
    },
    {
        value: 'Asia/Manila',
        label: 'Philippine Standard Time (Manila)',
        region: 'Asia'
    },
    {
        value: 'Asia/Kuala_Lumpur',
        label: 'Malaysia Time (Kuala Lumpur)',
        region: 'Asia'
    },
    {
        value: 'Asia/Kolkata',
        label: 'India Standard Time (Mumbai)',
        region: 'Asia'
    },
    {
        value: 'Asia/Dubai',
        label: 'Gulf Standard Time (Dubai)',
        region: 'Asia'
    },
    {
        value: 'Asia/Riyadh',
        label: 'Arabia Standard Time (Riyadh)',
        region: 'Asia'
    },

    // Australia & Oceania
    {
        value: 'Australia/Sydney',
        label: 'Australian Eastern Time (Sydney)',
        region: 'Australia & Oceania'
    },
    {
        value: 'Australia/Melbourne',
        label: 'Australian Eastern Time (Melbourne)',
        region: 'Australia & Oceania'
    },
    {
        value: 'Australia/Brisbane',
        label: 'Australian Eastern Time (Brisbane)',
        region: 'Australia & Oceania'
    },
    {
        value: 'Australia/Perth',
        label: 'Australian Western Time (Perth)',
        region: 'Australia & Oceania'
    },
    {
        value: 'Australia/Adelaide',
        label: 'Australian Central Time (Adelaide)',
        region: 'Australia & Oceania'
    },
    {
        value: 'Pacific/Auckland',
        label: 'New Zealand Standard Time (Auckland)',
        region: 'Australia & Oceania'
    },
    {
        value: 'Pacific/Fiji',
        label: 'Fiji Time (Suva)',
        region: 'Australia & Oceania'
    },

    // South America
    {
        value: 'America/Sao_Paulo',
        label: 'Brasília Time (São Paulo)',
        region: 'South America'
    },
    {
        value: 'America/Argentina/Buenos_Aires',
        label: 'Argentina Time (Buenos Aires)',
        region: 'South America'
    },
    {
        value: 'America/Santiago',
        label: 'Chile Standard Time (Santiago)',
        region: 'South America'
    },
    {
        value: 'America/Lima',
        label: 'Peru Time (Lima)',
        region: 'South America'
    },
    {
        value: 'America/Bogota',
        label: 'Colombia Time (Bogotá)',
        region: 'South America'
    },
    {
        value: 'America/Caracas',
        label: 'Venezuela Time (Caracas)',
        region: 'South America'
    },

    // Africa
    {
        value: 'Africa/Cairo',
        label: 'Eastern European Time (Cairo)',
        region: 'Africa'
    },
    {
        value: 'Africa/Lagos',
        label: 'West Africa Time (Lagos)',
        region: 'Africa'
    },
    {
        value: 'Africa/Johannesburg',
        label: 'South Africa Standard Time (Johannesburg)',
        region: 'Africa'
    },
    {
        value: 'Africa/Nairobi',
        label: 'East Africa Time (Nairobi)',
        region: 'Africa'
    },
    {
        value: 'Africa/Casablanca',
        label: 'Western European Time (Casablanca)',
        region: 'Africa'
    },

    // UTC
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)', region: 'UTC' }
];

export type Timezone = (typeof timezones)[0];
