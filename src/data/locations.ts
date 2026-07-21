/**
 * Provinces (and their cities) used to assign a route's location. Names mirror
 * the backend payload (provinceName / cityName). In the real API a route is
 * created with the province id; here we key selects by name to keep the mock
 * self-contained.
 */
export interface Province {
  id: number;
  name: string;
}

export const PROVINCES: Province[] = [
  { id: 1, name: "ANDRES IBAÑEZ" },
  { id: 2, name: "OBISPO SANTISTEVAN" },
  { id: 3, name: "WARNES" },
  { id: 4, name: "SARA" },
];

/** All mock cities belong to the Santa Cruz department. */
export const DEPARTMENT_NAME = "SANTA CRUZ";

/** A city and the province it belongs to (Santa Cruz department). */
export interface City {
  name: string;
  provinceName: string;
}

export const CITIES: City[] = [
  { name: "SANTA CRUZ", provinceName: "ANDRES IBAÑEZ" },
  { name: "MONTERO", provinceName: "OBISPO SANTISTEVAN" },
  { name: "WARNES", provinceName: "WARNES" },
  { name: "LA GUARDIA", provinceName: "ANDRES IBAÑEZ" },
  { name: "COTOCA", provinceName: "ANDRES IBAÑEZ" },
  { name: "PORTACHUELO", provinceName: "SARA" },
];

/** Look up the province a city belongs to. */
export function provinceForCity(cityName: string): string | undefined {
  return CITIES.find((c) => c.name === cityName)?.provinceName;
}
