import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
    AbstractControl,
    AsyncValidatorFn,
    FormBuilder, FormControl,
    FormGroup, FormGroupDirective,
    ValidationErrors,
    Validators
} from "@angular/forms"
import {AngularFirestore, AngularFirestoreCollection} from "@angular/fire/firestore"
import {catchError, debounceTime, map, take} from "rxjs/operators"
import {Observable, throwError} from "rxjs"
import {MatSnackBar} from "@angular/material"
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http"
import {environment} from "@src/environments/environment"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Competition} from "@src/app/shared/interfaces/competition"
import * as firebase from "firebase"

export interface Check {
    success: boolean,
    error?: string
}

@Component({
    selector: 'athlet-register',
    templateUrl: './athlet-register.component.html',
    styleUrls: ['./athlet-register.component.scss']
})
export class AthletRegisterComponent implements OnInit {
    registerForm: FormGroup
    athlet: Athlet
    formIsValid = () => false

    @Input() competition: Competition
    @Output() onCreated = new EventEmitter<{athlet: Athlet, form: FormGroupDirective}>()
    @Output() onValid = new EventEmitter<Athlet>()

    athlet_collection: AngularFirestoreCollection

    constructor(public fb: FormBuilder,
                private _snackBar: MatSnackBar,
                public afs: AngularFirestore,
                private http: HttpClient) {
    }

    ngOnInit() {
        this.athlet_collection = this.afs.collection<Athlet>(`athlets_${this.competition.id}`)
        this.registerForm = this.fb.group({
            fio: ['', [<any>Validators.required]],
            number: ['', [<any>Validators.required, <any>Validators.min(1), <any>Validators.max(999)], [AthletRegisterComponent.usedValue(this.athlet_collection, 'number')]],
            class: ['', [<any>Validators.required]],
            phone: ['', [<any>Validators.minLength(10), <any>Validators.maxLength(10), Validators.pattern("^[0-9]*$")], [AthletRegisterComponent.usedValue(this.athlet_collection, 'phone')]],
            code: ['', [<any>Validators.minLength(6), <any>Validators.required], [this.checkSmsCode()]],
        })
        this.competition.athlet_extra_fields.forEach((item) => this.registerForm.addControl(item, new FormControl('', [])))

        if (!this.athlet) {
            this.registerForm.addControl('captcha', new FormControl('', [<any>Validators.required]))
        }
        setTimeout(() => this.formIsValid = () => this.registerForm.valid, 0);

        this.registerForm.valueChanges.subscribe((next) => {
        }, (error => {
            console.log('error', error)
        }))
    }

    onSave(model, is_valid: boolean, formDirective?: FormGroupDirective): Promise<Athlet> | null {
        if (is_valid) {
            let athlet = {...model}
            delete athlet.code
            delete athlet.captcha
            athlet.phone = parseInt(athlet.phone)
            athlet.marks = []
            athlet.created = firebase.firestore.Timestamp.fromDate(new Date())

            return this.athlet_collection.doc(athlet.phone + '').set(athlet).then(() => {
                 this.onCreated.emit({
                    athlet: athlet,
                    form: formDirective
                })
                return athlet
            })
        }
    }

    onSendSms(): void {
        if (this.registerForm.controls['phone'].valid) {
            this.http.post(environment.backend_gateway + '/sms',
                JSON.stringify({phone: this.registerForm.controls['phone'].value, competition_id: this.competition.id}),
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

    static usedValue(collection, field: string, inverse: boolean = false, allowed: Array<any> = []): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
            return collection.afs.collection(collection.ref.path, ref => ref.where(field, '==', parseInt(control.value))).valueChanges().pipe(
                debounceTime(300),
                take(1),
                map((athlets: Array<Athlet>) => {
                    athlets = athlets.filter((item: Athlet) => {
                        return allowed.indexOf(item[field]) < 0
                    })

                    if (inverse) {
                        return (athlets && athlets.length > 0) ? null : {
                            "unused_value": {
                                value: control.value,
                                field: field
                            }
                        }
                    }
                    return (athlets && athlets.length > 0) ? {"used_value": {value: control.value, field: field}} : null
                }))
        }
    }

    checkSmsCode(): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
            return this.http.post(environment.backend_gateway + '/check',
                JSON.stringify({
                    phone: this.registerForm.controls['phone'].value,
                    competition_id: this.competition.id,
                    code: control.value
                }), {headers: new HttpHeaders({'Content-Type': 'application/json'})}).pipe(
                debounceTime(300),
                take(1),
                map((res: Check) => {
                    if (control.value === '123456' && !environment.production) {
                        return null
                    }
                    return !res.success ? {"code": {value: control.value, msg: res.error}} : null
                })
            )
        }
    }

}
