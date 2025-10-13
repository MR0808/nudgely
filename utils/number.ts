export const addOrdinalSuffix = (num: number | undefined): string => {
    if (num) {
        if (!Number.isFinite(num) || num < 0) {
            throw new Error('Input must be a valid positive number');
        }

        const j = num % 10;
        const k = num % 100;

        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
    } else {
        return '';
    }
};
