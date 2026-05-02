import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  details?: unknown;
}

interface HttpResponse {
  status(statusCode: number): { json(body: ErrorResponse): void };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawResponse = isHttpException ? exception.getResponse() : undefined;
    const statusText = HttpStatus[status] ?? 'Error';

    const body: ErrorResponse =
      typeof rawResponse === 'object' && rawResponse !== null
        ? {
            statusCode: status,
            message:
              'message' in rawResponse
                ? (rawResponse as { message: string | string[] }).message
                : 'Request failed',
            error:
              'error' in rawResponse
                ? String((rawResponse as { error: string }).error)
                : statusText,
            details: 'details' in rawResponse ? rawResponse.details : undefined,
          }
        : {
            statusCode: status,
            message: isHttpException ? String(rawResponse) : 'Internal server error',
            error: isHttpException ? statusText : 'Internal Server Error',
          };

    response.status(status).json(body);
  }
}
