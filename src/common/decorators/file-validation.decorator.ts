import { UseInterceptors, applyDecorators, UsePipes } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { StorageUploadType } from "../enums/storage-upload-type.enum";
import { FileValidationPipe } from "../pipes/file-validation.pipe";

export function ValidateFile(type: StorageUploadType) {
  return applyDecorators(
    UseInterceptors(FileInterceptor("file")),
    UsePipes(FileValidationPipe.forType(type))
  );
}

export function ValidateFiles(type: StorageUploadType) {
  return applyDecorators(
    UseInterceptors(FilesInterceptor("files")),
    UsePipes(FileValidationPipe.forType(type))
  );
} 