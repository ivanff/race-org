import {Injectable, OnDestroy} from '@angular/core';
import {AbstractControl, AsyncValidatorFn, ValidationErrors} from "@angular/forms"
import {Observable, of} from "rxjs"
import {environment} from "@src/environments/environment"
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http"
import {catchError, debounceTime, map, take} from "rxjs/operators"
import {Check} from "@src/app/web/shared/components/athlet/athlet-register.component"


@Injectable({
    providedIn: 'root',
})
export class BackendService implements OnDestroy {
    private jsonHttpHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
    })

    constructor(private http: HttpClient) {
    }

    ngOnDestroy(): void {
    }

    checkSmsCodeValidator(data: any): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
            if (control.value === 123456 && !environment.production) {
                return new Promise((resolve => {
                    resolve(null)
                }))
            }
            if (control.value.toString().length < 6) {
                return new Promise((resolve => {
                    resolve({"required": true})
                }))
            }

            return this.http.post(environment.google_gateway + '/check_sms', JSON.stringify(Object.assign(data, {value: control.value})),
                {headers: this.jsonHttpHeaders, observe: 'body', responseType: 'json'})
                .pipe(
                    debounceTime(300),
                    take(1),
                    map((resp) => {
                        return null
                    }),
                    catchError((err) => {
                        return of({"code": {value: control.value, message: err.error.message}})
                    }),
                )
        }
    }
}
