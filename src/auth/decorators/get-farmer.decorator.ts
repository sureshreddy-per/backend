import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const GetFarmer = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.farmer) {
      throw new UnauthorizedException('Farmer not found');
    }
    return request.farmer;
  },
); 