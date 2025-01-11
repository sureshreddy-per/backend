export class BaseResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;

  constructor(success: boolean, data?: T, message?: string, error?: any) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
  }

  static success<T>(data: T, message?: string): BaseResponse<T> {
    return new BaseResponse(true, data, message);
  }

  static error<T>(message: string, error?: any): BaseResponse<T> {
    return new BaseResponse(false, undefined, message, error);
  }
}
