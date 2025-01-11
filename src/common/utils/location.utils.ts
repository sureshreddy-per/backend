import { BadRequestException } from '@nestjs/common';

export interface Location {
  latitude: number;
  longitude: number;
}

export function isValidLatitude(lat: number): boolean {
  return !isNaN(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng: number): boolean {
  return !isNaN(lng) && lng >= -180 && lng <= 180;
}

export function validateLocation(location: string): void {
  if (!location) {
    throw new BadRequestException('Location is required');
  }

  const [lat, lng] = location.split(',').map(Number);
  
  if (isNaN(lat) || isNaN(lng)) {
    throw new BadRequestException('Location must be in format "latitude,longitude"');
  }

  if (!isValidLatitude(lat)) {
    throw new BadRequestException('Invalid latitude. Must be between -90 and 90');
  }

  if (!isValidLongitude(lng)) {
    throw new BadRequestException('Invalid longitude. Must be between -180 and 180');
  }
}

export function parseLocation(location: string): Location {
  validateLocation(location);
  const [lat, lng] = location.split(',').map(Number);
  return { latitude: lat, longitude: lng };
}

export function formatLocation(latitude: number, longitude: number): string {
  if (!isValidLatitude(latitude)) {
    throw new BadRequestException('Invalid latitude. Must be between -90 and 90');
  }

  if (!isValidLongitude(longitude)) {
    throw new BadRequestException('Invalid longitude. Must be between -180 and 180');
  }

  return `${latitude},${longitude}`;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
} 