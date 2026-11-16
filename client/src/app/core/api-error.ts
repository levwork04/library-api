import { HttpErrorResponse } from '@angular/common/http';

export function apiError(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 403) {
      return 'Недостаточно прав. Добавление и изменение доступны только администратору.';
    }
    if (error.status === 401) {
      return 'Нужно войти в систему.';
    }
    const message = error.error?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}
