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
