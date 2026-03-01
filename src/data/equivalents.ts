import { FoodEquivalent } from '../types';

/**
 * NutriTico v3 - Clinical Equivalents Database
 * Source: GABSA Costa Rica + ADA Standards
 */

export const EQUIVALENTS_DB: FoodEquivalent[] = [
    // PROTEÍNAS
    { id: 'p1', name: 'Pollo (Pechuga)', group: 'Proteína', calories: 120, macros: { p: 25, c: 0, f: 2 }, equivalentPortion: '100g (Centro de mano)' },
    { id: 'p2', name: 'Huevo entero', group: 'Proteína', calories: 75, macros: { p: 6, c: 0, f: 5 }, equivalentPortion: '1 unidad' },
    { id: 'p3', name: 'Salmón', group: 'Proteína', calories: 180, macros: { p: 20, c: 0, f: 10 }, equivalentPortion: '100g' },
    { id: 'p4', name: 'Carne Molida (Magra)', group: 'Proteína', calories: 150, macros: { p: 22, c: 0, f: 7 }, equivalentPortion: '100g' },

    // CARBOHIDRATOS (Clínicos)
    { id: 'c1', name: 'Arroz cocido', group: 'Carbohidratos', calories: 130, macros: { p: 2, c: 28, f: 0 }, equivalentPortion: '1/2 Taza' },
    { id: 'c2', name: 'Papa horneada', group: 'Carbohidratos', calories: 140, macros: { p: 3, c: 32, f: 0 }, equivalentPortion: '1 mediana' },
    { id: 'c3', name: 'Pan Integral', group: 'Carbohidratos', calories: 80, macros: { p: 4, c: 15, f: 1 }, equivalentPortion: '1 Rebanada' },
    { id: 'c4', name: 'Avena integral', group: 'Carbohidratos', calories: 150, macros: { p: 5, c: 27, f: 3 }, equivalentPortion: '1/2 Taza (cruda)' },

    // GRASAS
    { id: 'g1', name: 'Aceite de Oliva', group: 'Grasas', calories: 120, macros: { p: 0, c: 0, f: 14 }, equivalentPortion: '1 Cda (15ml)' },
    { id: 'g2', name: 'Aguacate', group: 'Grasas', calories: 160, macros: { p: 2, c: 8, f: 15 }, equivalentPortion: '1/2 Unidad peq.' },
    { id: 'g3', name: 'Almendras', group: 'Grasas', calories: 164, macros: { p: 6, c: 6, f: 14 }, equivalentPortion: '30g (Puñado)' },

    // VEGETALES Y FIBRA (DASH/GABSA)
    { id: 'v1', name: 'Brócoli', group: 'Vegetales', calories: 30, macros: { p: 2, c: 6, f: 0 }, equivalentPortion: '1 Taza cocida' },
    { id: 'v2', name: 'Espinaca', group: 'Vegetales', calories: 10, macros: { p: 1, c: 2, f: 0 }, equivalentPortion: '2 Tazas crudas' },

    // FRUTAS
    { id: 'f1', name: 'Manzana', group: 'Frutas', calories: 95, macros: { p: 0, c: 25, f: 0 }, equivalentPortion: '1 unidad Mediana' },
    { id: 'f2', name: 'Banano', group: 'Frutas', calories: 105, macros: { p: 1, c: 27, f: 0 }, equivalentPortion: '1 unidad Mediana' }
];

export const findEquivalentByQuery = (query: string): FoodEquivalent | null => {
    const q = query.toLowerCase();
    return EQUIVALENTS_DB.find(f => f.name.toLowerCase().includes(q) || f.id === q) || null;
};
