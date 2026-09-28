import type { Rng } from './rng';

/** Content a sim sends: short on purpose — minimum resources, real behaviour. */

const PRODUCTS = [
  ['Garri (50kg)', 38500], ['Rice, parboiled (50kg)', 72000], ['Cement, Dangote (50kg)', 9800], ['Brown beans (paint bucket)', 6500],
  ['Palm oil (25L)', 45000], ['Semovita (10kg)', 11200], ['Tomato paste (carton)', 21000], ['Yam (tuber, medium)', 2800],
] as const;
const CITIES = ['Lagos', 'Ibadan', 'Abuja', 'Kano', 'Enugu', 'Port Harcourt', 'Benin City', 'Jos'] as const;

export const simMark = (token: string) => `[SIM-${token}]`;

export function pricePoint(rng: Rng) {
  const [product, base] = rng.pick(PRODUCTS);
  return { product, price_ngn: Math.round((base as number) * (0.9 + rng.next() * 0.25) / 50) * 50, city: rng.pick(CITIES) };
}

export const endpointName = (token: string, what: string) => `sim-${token.toLowerCase()}-${what}`;
