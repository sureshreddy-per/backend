declare module 'h3-js' {
  export const h3: {
    latLngToCell(lat: number, lng: number, res: number): string;
    cellToLatLng(h3Index: string): [number, number];
  };
} 