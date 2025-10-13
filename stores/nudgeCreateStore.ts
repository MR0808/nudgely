import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NudgeCreateStore {
    title: string;
    setTitle: (title: string) => void;
    description: string;
    setDescription: (description: string) => void;
    frequency: string;
    setFrequency: (frequency: string) => void;
    time: string;
    setTime: (time: string) => void;
    recipient: string;
    setRecipient: (recipient: string) => void;
}

export const useNudgeCreateStore = create(
    persist<NudgeCreateStore>(
        (set) => ({
            title: '',
            setTitle: (title) => set({ title }),
            description: '',
            setDescription: (description) => set({ description }),
            frequency: '',
            setFrequency: (frequency) => set({ frequency }),
            time: '',
            setTime: (time) => set({ time }),
            recipient: '',
            setRecipient: (recipient) => set({ recipient })
        }),
        { name: 'nudgeCreate-storage' } // Key for localStorage
    )
);
