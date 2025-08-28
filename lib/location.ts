'use server';

import { prisma } from '@/lib/prisma';

export const getAllCountries = async () => {
    try {
        const countries = await prisma.country.findMany({
            orderBy: { name: 'asc' }
        });

        return countries;
    } catch {
        return null;
    }
};

export const getCountryByName = async (name: string) => {
    try {
        const country = await prisma.country.findFirst({
            where: { name }
        });

        return country;
    } catch {
        return null;
    }
};

export const getCountryById = async (id: string) => {
    try {
        const country = await prisma.country.findFirst({
            where: { id }
        });

        return country;
    } catch {
        return null;
    }
};

export const getRegionsByCountry = async (id: string) => {
    try {
        const states = await prisma.region.findMany({
            where: { countryId: id },
            orderBy: { name: 'asc' }
        });

        return states;
    } catch (error) {
        return null;
    }
};

export const getRegionById = async (id: string) => {
    try {
        const state = await prisma.region.findFirst({
            where: { id }
        });

        return state;
    } catch {
        return null;
    }
};
