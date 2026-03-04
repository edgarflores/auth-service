import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  InvalidCredentialsError,
  UserNotFoundError,
  EmailAlreadyExistsError,
  RefreshTokenInvalidError,
} from '../../domain/auth/errors/auth-domain.errors';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const domainError = this.mapDomainErrorToHttp(exception);
    const resolved = domainError ?? exception;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      resolved instanceof HttpException
        ? resolved.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      resolved instanceof HttpException
        ? resolved.getResponse()
        : 'Internal server error';

    const errorResponse =
      typeof message === 'object' && message !== null && 'message' in message
        ? (message as { message?: string | string[] })
        : { message };

    const body = {
      statusCode: status,
      error: HttpStatus[status] || 'Error',
      message: Array.isArray(errorResponse.message)
        ? errorResponse.message[0]
        : errorResponse.message ?? String(message),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private mapDomainErrorToHttp(exception: unknown): HttpException | null {
    if (exception instanceof InvalidCredentialsError) {
      return new UnauthorizedException('Invalid credentials');
    }
    if (exception instanceof UserNotFoundError) {
      return new UnauthorizedException('User not found');
    }
    if (exception instanceof EmailAlreadyExistsError) {
      return new ConflictException(
        'An account with this email already exists',
      );
    }
    if (exception instanceof RefreshTokenInvalidError) {
      return new UnauthorizedException('Refresh token invalid or expired');
    }
    return null;
  }
}

