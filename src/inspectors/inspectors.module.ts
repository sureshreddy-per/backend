import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Inspector } from "./entities/inspector.entity";
import { InspectorsService } from "./inspectors.service";
import { InspectorsController } from "./inspectors.controller";
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/services/users.service";

@Module({
  imports: [TypeOrmModule.forFeature([Inspector]), UsersModule],
  providers: [InspectorsService],
  controllers: [InspectorsController],
  exports: [InspectorsService],
})
export class InspectorsModule {}
