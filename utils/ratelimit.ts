export const calculateCooldownSeconds = (resetTime: Date): number => {
    return Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
};
