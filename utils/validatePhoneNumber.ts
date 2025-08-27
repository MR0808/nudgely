import {
    parsePhoneNumberFromString,
    isValidPhoneNumber,
    type CountryCode
} from 'libphonenumber-js';

// Helper function to validate and format phone number
export const validatePhoneNumber = (
    phone: string
): {
    isValid: boolean;
    formatted?: string;
    country?: string;
} => {
    try {
        // Try to parse the phone number
        let phoneNumber = parsePhoneNumberFromString(phone);

        if (phoneNumber && isValidPhoneNumber(phone)) {
            return {
                isValid: true,
                formatted: phoneNumber.formatInternational(),
                country: phoneNumber.country
            };
        }

        const commonCountries: CountryCode[] = [
            'AU',
            'US',
            'GB',
            'CA',
            'NZ',
            'DE',
            'FR',
            'IT',
            'ES',
            'JP',
            'IN',
            'BR',
            'MX'
        ];

        for (const countryCode of commonCountries) {
            try {
                phoneNumber = parsePhoneNumberFromString(phone, countryCode);
                if (phoneNumber && phoneNumber.isValid()) {
                    return {
                        isValid: true,
                        formatted: phoneNumber.formatInternational(),
                        country: phoneNumber.country
                    };
                }
            } catch {
                // Continue to next country
                continue;
            }
        }

        return { isValid: false };
    } catch {
        return { isValid: false };
    }
};
