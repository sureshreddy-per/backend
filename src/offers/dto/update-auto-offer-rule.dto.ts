import { PartialType } from "@nestjs/mapped-types";
import { CreateAutoOfferRuleDto } from "./create-auto-offer-rule.dto";

export class UpdateAutoOfferRuleDto extends PartialType(
  CreateAutoOfferRuleDto,
) {}
