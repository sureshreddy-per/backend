import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { FarmersService } from "../../farmers/farmers.service";

@Injectable()
export class FarmerMiddleware implements NestMiddleware {
  constructor(private readonly farmersService: FarmersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.user) {
      try {
        const farmer = await this.farmersService.findByUserId(req.user["id"]);
        req["farmer"] = farmer;
      } catch (error) {
        // Only throw error for farmer-specific endpoints
        if (req.path.includes("/produce") && req.method !== "GET") {
          throw new UnauthorizedException("Farmer not found");
        }
      }
    }
    next();
  }
}
