import { diskStorage } from "multer";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { BadRequestException } from "@nestjs/common";

export const imageConfig = {
  storage: diskStorage({
    destination: "./uploads/produce/images",
    filename: (req, file, callback) => {
      const uniqueSuffix = uuidv4();
      callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return callback(
        new BadRequestException("Only image files are allowed!"),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
};

export const videoConfig = {
  storage: diskStorage({
    destination: "./uploads/produce/videos",
    filename: (req, file, callback) => {
      const uniqueSuffix = uuidv4();
      callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.originalname.match(/\.(mp4|mov|avi)$/)) {
      return callback(
        new BadRequestException(
          "Only video files (mp4, mov, avi) are allowed!",
        ),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
};
