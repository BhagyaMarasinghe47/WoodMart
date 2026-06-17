import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(this.withAuthHeader(request)).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401 || request.url.includes('/auth/')) {
          return throwError(() => error);
        }

        const refreshToken = this.authService.getRefreshToken();
        if (!refreshToken || request.headers.has('X-Auth-Retry')) {
          if (this.authService.currentUserValue) {
            this.authService.logout();
          }
          return throwError(() => error);
        }

        return this.authService.refreshToken().pipe(
          switchMap(() => {
            const retry = this.withAuthHeader(request).clone({
              setHeaders: { 'X-Auth-Retry': 'true' }
            });
            return next.handle(retry);
          }),
          catchError(() => {
            this.authService.logout();
            return throwError(() => error);
          })
        );
      })
    );
  }

  private withAuthHeader(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.authService.getToken();
    if (!token) {
      return request;
    }

    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
}
