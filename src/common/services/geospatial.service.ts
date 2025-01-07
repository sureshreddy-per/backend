import { Injectable } from '@nestjs/common';

@Injectable()
export class GeospatialService {
  private readonly EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers

  /**
   * Calculate distance between two points using Haversine formula
   * @param lat1 Latitude of first point
   * @param lon1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lon2 Longitude of second point
   * @returns Distance in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Get bounding box coordinates for a given center point and radius
   * @param centerLat Center latitude
   * @param centerLon Center longitude
   * @param radiusKm Radius in kilometers
   * @returns Bounding box coordinates
   */
  getBoundingBox(centerLat: number, centerLon: number, radiusKm: number) {
    const latChange = (radiusKm / this.EARTH_RADIUS_KM) * (180 / Math.PI);
    const lonChange = (radiusKm / this.EARTH_RADIUS_KM) * (180 / Math.PI) / Math.cos(this.toRad(centerLat));

    return {
      minLat: centerLat - latChange,
      maxLat: centerLat + latChange,
      minLon: centerLon - lonChange,
      maxLon: centerLon + lonChange
    };
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
} 