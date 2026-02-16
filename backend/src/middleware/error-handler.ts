import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import logger from '../utils/logger';
import { sendError } from '../utils/response';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  sendError(res, 'Internal server error', 500);
}
