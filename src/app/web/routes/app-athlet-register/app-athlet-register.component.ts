import {Component, OnDestroy, OnInit} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute} from "@angular/router"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {MatSnackBar} from "@angular/material"
import {AngularFirestore, AngularFirestoreCollection} from "@angular/fire/firestore"
import {
    catchError,
    debounceTime,
    first,
    map,
    skipWhile,
    switchMap,
    take,
    takeUntil
} from "rxjs/operators"
import {combineLatest, Observable, ReplaySubject, throwError} from "rxjs"
import {
    AbstractControl,
    AsyncValidatorFn,
    FormBuilder,
    FormGroup, FormGroupDirective,
    ValidationErrors,
    Validators
} from "@angular/forms"
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http"
import {AthletRegisterComponent, Check} from "@src/app/web/shared/components/athlet/athlet-register.component"
import {environment} from "@src/environments/environment"

@Component({
    selector: 'app-app-athlet-register',
    styleUrls: ['../../shared/components/athlet/athlet-register.component.scss'],
    templateUrl: './app-athlet-register.component.html',
})
export class AppAthletRegisterComponent implements OnInit, OnDestroy {
    competition: Competition
    athlet: Athlet
    action: string = 'register'
    getAthletForm: FormGroup
    formIsValid = () => false

    private athlet_collection: AngularFirestoreCollection
    protected _onDestroy = new ReplaySubject<any>(1)

    constructor(private router: ActivatedRoute,
                private afs: AngularFirestore,
                private _fb: FormBuilder,
                private http: HttpClient,
                private _snackBar: MatSnackBar) {
        this.competition = this.router.snapshot.data['competition']
    }

    ngOnInit() {
        this.athlet_collection = this.afs.collection<Athlet>(`athlets_${this.competition.id}`)

        this.getAthletForm = this._fb.group({
            phone: ['', [<any>Validators.minLength(10), <any>Validators.maxLength(10), Validators.pattern("^[0-9]*$")], [AthletRegisterComponent.usedValue(this.athlet_collection, 'phone', true)]],
            code: [{
                value: '',
                disabled: true
            }, [<any>Validators.minLength(6), <any>Validators.required], [this.checkSmsCode()]],
            captcha: ['', []]
        })
        this.getAthletForm.statusChanges.pipe(
            map((next) => {
                if (this.getAthletForm.controls['captcha'].valid && this.getAthletForm.controls['phone'].valid) {
                    if (this.getAthletForm.controls['code'].disabled) {
                        this.getAthletForm.controls['code'].reset({value: '', disabled: false})
                        return 'SKIP'
                    }
                }
                return next
            }),
            skipWhile((next) => {
                return next == 'SKIP'
            })
        ).subscribe((next) => {
            if (next == 'VALID') {
                this.athlet_collection.doc(this.getAthletForm.controls['phone'].value).valueChanges().pipe(
                    first()
                ).subscribe((doc: Athlet) => {
                    doc.id = this.getAthletForm.controls['phone'].value
                    this.athlet = doc
                })
            }
        })

        setTimeout(() => this.formIsValid = () => this.getAthletForm.valid, 0);

        // this.afs.collectionGroup(`test_secret`, (query => query.where('code', '==', 123456)))
        //     .snapshotChanges()
        //     .pipe(
        //         switchMap((snapshot: Array<any>) => {
        //             return combineLatest(
        //                 snapshot.map((item) => {
        //                     return this.afs.collection('/competitions/').doc(item.payload.doc.ref.parent.parent.id)
        //                         .valueChanges()
        //                         .pipe(
        //                             first(),
        //                             map((competition) => {
        //                                 return {...competition,}
        //                             })
        //                         )
        //                 })
        //             )
        //         })
        //     ).subscribe((next) => {
        //         console.log(next)
        //     })

        this.afs.collection('competitions').doc(this.competition.id).valueChanges().pipe(
            takeUntil(this._onDestroy)
        ).subscribe((doc) => {
            console.log(doc)
            Object.assign(this.competition, doc)
        })
    }

    ngOnDestroy(): void {
        this._onDestroy.next(null)
        this._onDestroy.complete()
    }

    onPhoneInput(): void {
        this.getAthletForm.controls['code'].reset()
    }

    onSwitchForm($event: any, action: string): void {
        $event.preventDefault()
        this.action = action
        if (action == 'register') {

        } else if (action == 'change') {
            this.athlet = null
            this.getAthletForm.reset()
        }
    }

    onCreated($event: { athlet: Athlet, form: FormGroupDirective }) {
        $event.form.resetForm()
        $event.form.form.reset()
        this._snackBar.open("Поздравляем", `Ждем Вас ${this.competition.start_date.toDate()}`, {
            duration: 5000,
            verticalPosition: "top"
        })
    }

    onChange($event: { athlet: Athlet, form: FormGroupDirective }) {
        this._snackBar.open("Сохранено", `Ждем Вас ${this.competition.start_date.toDate()}`, {
            duration: 5000,
            verticalPosition: "top"
        })
    }

    checkSmsCode(): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
            if (control.value === '123456' && !environment.production) {
                return new Promise((resolve => {
                    resolve(null)
                }))
            }

            return this.http.post(environment.google_gateway + '/check_sms',
                JSON.stringify({
                    phone: this.getAthletForm.controls['phone'].value,
                    competitionId: this.competition.id,
                    code: control.value
                }), {headers: new HttpHeaders({'Content-Type': 'application/json'})}).pipe(
                debounceTime(300),
                take(1),
                map((res: Check) => {
                    return !res.success ? {"code": {value: control.value, msg: res.error}} : null
                })
            )
        }
    }

    onSendSms(): void {
        if (this.getAthletForm.controls['phone'].valid) {
            this.http.post(environment.backend_gateway + '/sms',
                JSON.stringify({
                    phone: this.getAthletForm.controls['phone'].value,
                    competition_id: this.competition.id
                }),
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


}
