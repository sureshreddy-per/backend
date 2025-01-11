import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    database: {
      status: string;
      connected: boolean;
    };
    uptime: number;
  }> {
    let dbStatus = "healthy";
    let dbConnected = true;

    try {
      // Check database connection
      await this.dataSource.query("SELECT 1");
    } catch (error) {
      dbStatus = "unhealthy";
      dbConnected = false;
    }

    return {
      status: dbConnected ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        connected: dbConnected,
      },
      uptime: process.uptime(),
    };
  }
}
