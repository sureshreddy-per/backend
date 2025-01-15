import { IsNotEmpty, IsString, IsUUID, IsEnum } from "class-validator";
import { NotificationType } from "../enums/notification-type.enum";

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
