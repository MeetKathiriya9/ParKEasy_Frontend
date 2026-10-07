/**
 * The signed-in user's vehicles (DOC sections 10/18/21).
 *
 * Thin wrappers over the `/vehicles` routes, mirroring `lib/profile.ts` so
 * pages never build a URL or reach for Axios directly.
 *
 * There is no `isEV` in any input: the server derives it from `fuelType` and
 * answers a `422` if one is sent. `isDefault` is likewise never sent on
 * create - the first vehicle becomes the default automatically - and on edit
 * must go through `PATCH /vehicles/{id}/default`.
 */

import { del, get, patch, post } from './api';
import { endpoints } from './endpoints';
import type { FuelType, Vehicle, VehicleCreateInput, VehicleUpdateInput, VehicleType } from '@/types';

/** `GET /vehicles` - own vehicles only; `userId` comes from the token. */
export async function fetchVehicles(): Promise<Vehicle[]> {
  return get<Vehicle[]>(endpoints.vehicles.list);
}

/** `POST /vehicles` - 201. The first vehicle of a user becomes the default. */
export async function createVehicle(input: VehicleCreateInput): Promise<Vehicle> {
  return post<Vehicle>(endpoints.vehicles.create, input);
}

/** `PATCH /vehicles/{id}` - partial update of the editable fields only. */
export async function updateVehicle(id: string, input: VehicleUpdateInput): Promise<Vehicle> {
  return patch<Vehicle>(endpoints.vehicles.update(id), input);
}

/** `DELETE /vehicles/{id}` - 204; a promoted vehicle may take over as default. */
export async function removeVehicle(id: string): Promise<void> {
  await del<void>(endpoints.vehicles.remove(id));
}

/**
 * `PATCH /vehicles/{id}/default` - promotes one vehicle and clears the flag on
 * the rest. The response only carries the promoted vehicle, so callers should
 * re-read the list to see the demoted one.
 */
export async function setDefaultVehicle(id: string): Promise<Vehicle> {
  return patch<Vehicle>(endpoints.vehicles.setDefault(id), {});
}

/** Display names for the wire values of `VehicleType`. */
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  hatchback: 'Hatchback',
  motorcycle: 'Motorcycle',
  truck: 'Truck',
  van: 'Van',
  other: 'Other',
};

/** Display names for the wire values of `FuelType`. */
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
  cng: 'CNG',
  other: 'Other',
};

/**
 * Normalises a plate the same way the server does so duplicate checks happen
 * before a round trip: `ABC-1234`, `abc 1234` and `Abc1234` are one value.
 */
export function normalizeRegistration(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/** Matches `REGISTRATION_PATTERN` on the server: 2-20 letters and digits. */
export function registrationIsValid(value: string): boolean {
  return /^[A-Z0-9]{2,20}$/.test(normalizeRegistration(value));
}
