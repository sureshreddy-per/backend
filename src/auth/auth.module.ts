import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { RedisModule } from "../redis/redis.module";
import { FarmersModule } from "../farmers/farmers.module";
import { BuyersModule } from "../buyers/buyers.module";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { APP_GUARD } from "@nestjs/core";
import { InspectorsModule } from "../inspectors/inspectors.module";
import { TwilioService } from "../twilio/twilio.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    UsersModule,
    RedisModule,
    FarmersModule,
    BuyersModule,
    InspectorsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRATION") || "24h",
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    TwilioService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
