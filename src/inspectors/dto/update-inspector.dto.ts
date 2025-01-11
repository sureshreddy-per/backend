import { PartialType } from "@nestjs/mapped-types";
import { CreateInspectorDto } from "./create-inspector.dto";

export class UpdateInspectorDto extends PartialType(CreateInspectorDto) {}
