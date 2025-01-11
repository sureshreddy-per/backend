import { PartialType } from "@nestjs/swagger";
import { CreateSynonymDto } from "./create-synonym.dto";

export class UpdateSynonymDto extends PartialType(CreateSynonymDto) {}
