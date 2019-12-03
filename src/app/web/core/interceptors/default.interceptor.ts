import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';

import {Observable, of, throwError} from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';

/** Pass untouched request through to the next request handler. */
@Injectable()
export class DefaultInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      mergeMap((event: any) => {
        return of(event);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.error) {
          if (err.error.message) {
            return throwError(err)
          }
        } else {
          console.error(err)
          return of(err)
        }
      })
    );
  }
}
