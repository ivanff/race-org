import {Component, OnInit} from '@angular/core';
import {
    AbstractControl,
    AsyncValidatorFn,
    FormBuilder,
    FormGroup, FormGroupDirective,
    ValidationErrors,
    ValidatorFn,
    Validators
} from "@angular/forms"
import {Athlet} from "@src/app/home/athlet"
import {AngularFirestore} from "@angular/fire/firestore"
import {catchError, debounceTime, map, take} from "rxjs/operators"
import {Observable, throwError} from "rxjs"
import {MatSnackBar} from "@angular/material"
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http"
import {environment} from "@src/environments/environment"

export interface Check {success: boolean, error?: string}

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup
    code_is_send: boolean

    constructor(private _fb: FormBuilder,
                private _snackBar: MatSnackBar,
                private firestore: AngularFirestore,
                private http: HttpClient) {
    }

    ngOnInit() {
        this.code_is_send = false
        this.registerForm = this._fb.group({
            fio: ['', [<any>Validators.required]],
            number: ['', [<any>Validators.required, <any>Validators.min(1), <any>Validators.max(999)], [RegisterComponent.usedValue(this.firestore, 'number')]],
            class: ['', [<any>Validators.required]],
            city: [''],
            command: [''],
            bike: [''],
            phone: ['', [<any>Validators.minLength(10), <any>Validators.maxLength(10), Validators.pattern("^[0-9]*$")], [RegisterComponent.usedValue(this.firestore, 'phone')]],
            code: ['', [<any>Validators.minLength(6), <any>Validators.required], [this.checkSmsCode()]],
        })
    }

    onSave(model, is_valid: boolean, formDirective?: FormGroupDirective): void {
        if (is_valid) {
            let athlet = {...model}
            delete athlet.code
            athlet.phone = parseInt(athlet.phone)
            athlet.checkpoints = []
            this.firestore.collection('athlets').doc(athlet.phone + '').set(athlet).then(() => {
                if (formDirective) {
                    formDirective.resetForm()
                }
                this.registerForm.reset()
                this._snackBar.open("Поздравляем", "Ждем Вас 28.09.2019", {
                    duration: 5000,
                    verticalPosition: "top"
                })
            })
        }
    }

    onSendSms(): void {
        if (this.registerForm.controls['phone'].valid) {
            this.http.post(environment.sms_gateway + '/sms',
                JSON.stringify({phone: this.registerForm.controls['phone'].value}),
                {headers: new HttpHeaders({'Content-Type': 'application/json'})}).pipe(
                catchError((err: HttpErrorResponse) => {
                    if (err.error) {
                        this._snackBar.open("Ошибка", err.error.body, {
                            duration: 5000,
                            verticalPosition: "top"
                        })
                        return throwError(err.error.body)
                    }
                }),
                map((res) => {
                    res
                })
            ).subscribe(() => {
                this.code_is_send = true
                this._snackBar.open("Код выслан", "проверьте телефон", {
                    duration: 5000,
                    verticalPosition: "top"
                })
            })
        }
    }

    onPhoneInput(): void {
        this.registerForm.controls['code'].reset()
    }

    static usedValue(firestore, field: string): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
            return firestore.collection('athlets', ref => ref.where(field, '==', parseInt(control.value))).valueChanges().pipe(
                debounceTime(300),
                take(1),
                map((athlets: Array<Athlet>) => {
                    return (athlets && athlets.length > 0) ? {"used_value": {value: control.value, field: field}} : null
                }))
        }
    }

    checkSmsCode(): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
            return this.http.post(environment.sms_gateway + '/check',
                JSON.stringify({phone: this.registerForm.controls['phone'].value, code: control.value}),{headers: new HttpHeaders({'Content-Type': 'application/json'})}).pipe(
                    debounceTime(300),
                    take(1),
                    map((res: Check) => {
                        if (control.value === '123456') {
                            return null
                        }
                        return !res.success ? {"code": {value: control.value, msg: res.error}} : null
                    })
            )
        }
    }

}
