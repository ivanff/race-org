import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';
import {
    MatVerticalStepper
} from "@angular/material"
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators} from "@angular/forms"
import {AngularFirestore, DocumentReference} from "@angular/fire/firestore"
import {Router} from "@angular/router"
import * as firebase from "firebase/app"
import * as moment from "moment-timezone"
import {Competition} from "@src/app/shared/interfaces/competition"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {ReplaySubject} from "rxjs"
import {first, takeUntil} from "rxjs/operators"
import {SettingsService} from "@src/app/web/core/services/settings.service"
import {AuthService} from "@src/app/web/core/services/auth.service"
import * as _ from "lodash"


export function groupRequiredValidator(count: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        return control.value.filter((item) => item).length < count ? {'groupRequired': {value: control.value}} : null
    }
}

export const timeValidator: ValidatorFn = Validators.pattern('^[0-9]{1,2}\:[0-9]{1,2}$')

@Component({
    selector: 'app-competition',
    templateUrl: './competition.component.html',
})
export class CompetitionComponent implements OnInit, OnChanges, OnDestroy {
    timezoneFilterControl = new FormControl()
    filteredTimezones: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

    checking = [
        'manual',
        'nfc',
        'barcode'
    ]

    minDate = new Date()
    firstFormGroup: FormGroup
    secondFormGroup: FormGroup
    thirdFormGroup: FormGroup
    fourFromGroup: FormGroup
    fiveFromGroup: FormGroup

    protected _onDestroy = new ReplaySubject<any>(1)

    @Input('isLinear') isLinear = true
    @Input('clone_competition') clone_competition: Competition
    @Input('competition') competition = {
        checking: ['manual', 'nfc'],
        classes: ['hobby'],
        checkpoints: [
            {
                title: '',
                marshal: '',
                order: 0,
                classes: [
                    'hobby'
                ],
                devices: []
            } as Checkpoint
        ],
        athlet_extra_fields: [
            'city'
        ],
        mobile_devices: [],
        group_start: false,
        marshal_has_device: true,
        result_by_full_circle: true,
        stop_registration: false,

        lock_results: false,
        created: firebase.firestore.Timestamp.now()
    } as Competition

    @Output() setActiveTabEvent = new EventEmitter<number>()

    @ViewChild('stepper', {static: true}) stepper: MatVerticalStepper

    constructor(private fb: FormBuilder,
                private ref: ChangeDetectorRef,
                private firestore: AngularFirestore,
                private router: Router,
                private settings: SettingsService,
                private auth: AuthService) {
    }

    ngOnInit(): void {
        if (this.clone_competition) {
            this.competition = this.getStageInitial()
        }

        this.firstFormGroup = this.fb.group({
            title: [this.competition.title || '', [Validators.required]],
            start_date: [this.competition.start_date ? moment(this.competition.start_date.toMillis()).tz(this.competition.timezone) : null, [Validators.required]],
            start_time: [this.competition.start_time ? this.secondsToTime(this.competition.start_time) : '12:00', [Validators.required, timeValidator]],
            end_date: [this.competition.end_date ? moment(this.competition.end_date.toMillis()).tz(this.competition.timezone) : null, [Validators.required]],
            duration: [this.competition.duration ? this.secondsToTime(this.competition.duration) : '3:00', [Validators.required, timeValidator]],
            timezone: [this.competition.timezone ? this.competition.timezone : moment.tz.guess()],
            checking: this.formArrayChecking()
        })
        this.firstFormGroup.controls['end_date'].disable()

        this.firstFormGroup.valueChanges.pipe(
            takeUntil(this._onDestroy)
        ).subscribe((next: any) => {

            const start_time = this.getTime(next.start_time)
            const duration = this.getTime(next.duration)

            let end_date = null
            if (next.start_date && duration) {
                end_date = next.start_date.clone().add(
                    start_time + duration, 's'
                )
                this.firstFormGroup.controls['end_date'].patchValue(end_date,{emitEvent: false})
            }


            Object.assign(this.competition, {
                title: next.title,
                start_date: next.start_date ? firebase.firestore.Timestamp.fromDate(next.start_date.toDate()) : null,
                start_time: next.start_time ? start_time : null,
                end_date: end_date ? firebase.firestore.Timestamp.fromDate(end_date.toDate()) : null,
                duration: next.duration ? this.getTime(next.duration) : null,
                timezone: next.timezone,
                checking: this.checking.filter((item, index) => next.checking[index])
            })
        })

        this.secondFormGroup = this.fb.group({
            group_start: [this.competition.group_start],
            marshal_has_device: [this.competition.marshal_has_device],
            result_by_full_circle: [this.competition.result_by_full_circle],
            stop_registration: [this.competition.stop_registration],
        })
        this.secondFormGroup.valueChanges.pipe(
            takeUntil(this._onDestroy)
        ).subscribe((next: any) => {Object.assign(this.competition, next)})

        this.thirdFormGroup = new FormGroup({'classes': this.formArrayClasses() as FormArray})
        this.thirdFormGroup.valueChanges.subscribe((next) => {Object.assign(this.competition, next)})

        this.fourFromGroup = new FormGroup({'checkpoints': this.formArrayCheckpoints() as FormArray})
        this.fourFromGroup.valueChanges.subscribe((next) => {
            this.competition.checkpoints = next.checkpoints.map((item, order:number) => {
                const classes = this.competition.classes.filter((_class, index) => item.classes[index])
                return {...item, classes, order} as Checkpoint
            })
        })

        this.fiveFromGroup = new FormGroup({'athlet_extra_fields': this.formArrayExtraFields()})
        this.fiveFromGroup.valueChanges.subscribe((next) => {Object.assign(this.competition, next)})

        this.filteredTimezones.next(this.settings.timezones_array)
        this.timezoneFilterControl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
            this.filterTimezones()
        })
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty('competition')) {
            if (!changes['competition'].firstChange) {
                this.competition = {...changes['competition'].currentValue}
                this.ngOnInit()
            }
        }
    }

    ngOnDestroy() {
        this._onDestroy.next(null);
        this._onDestroy.complete();
    }

    private addZeroBefore(n) {
        return (n < 10 ? '0' : '') + n;
    }

    private secondsToTime(seconds: number): string {
        const duration = moment.duration(seconds, 's')
        return `${this.addZeroBefore(duration.hours())}:${this.addZeroBefore(duration.minutes())}`
    }

    private filterTimezones() {
        const search = this.timezoneFilterControl.value.toString().toLowerCase()
        this.filteredTimezones.next(
            this.settings.timezones_array.filter((item) => item.value.toLowerCase().indexOf(search) > -1)
        )
    }

    private formArrayCheckpoints(): FormArray {
        return new FormArray(
            (this.competition.checkpoints ? this.competition.checkpoints : []).map((checkpoint: Checkpoint) => {
                return this.fb.group({
                    title: [checkpoint.title, [Validators.required]],
                    marshal: [checkpoint.marshal, []],
                    classes: this.formArrayCheckboxes(checkpoint.classes),
                    devices: this.formArrayDevices(checkpoint.devices)
                })
            })
        )
    }

    private formArrayClasses(): FormArray {
        return new FormArray((this.competition.classes ? this.competition.classes : []).map((_class) => {
                return new FormControl(_class, [Validators.required])
            })
        )
    }

    private formArrayExtraFields(): FormArray {
        return new FormArray((this.competition.athlet_extra_fields ? this.competition.athlet_extra_fields : []).map((field) => {
            return new FormControl(field, [])
        }))
    }

    private formArrayChecking(): FormArray {
        const checking = new FormArray([], [groupRequiredValidator(1)])
        this.checking.forEach((value: string) => {
            checking.push(new FormControl(this.competition.checking ? this.competition.checking.indexOf(value) > -1 : false, []))
        })
        return checking
    }

    private formArrayCheckboxes(classes?: Array<string>): FormArray {
        return new FormArray((this.competition.classes ? this.competition.classes : []).map((item) => {
            return new FormControl(classes.indexOf(item) > -1, [])
        }), [groupRequiredValidator(1)])
    }

    private formArrayDevices(devices?: Array<string>): FormArray {
        return new FormArray((devices || []).map((device: string) => {
            return new FormControl(device, [])
        }))
    }

    private getTime(time: string): number {
        const parts: Array<string> = time.split(':')
        if (parts.length == 2) {
            const h = parseInt(parts[0]) * 60 * 60
            const m = parseInt(parts[1]) * 60
            return h + m
        }
        return null
    }

    private getStageInitial(): Competition {
        let competition = {...this.clone_competition}
        competition.parent_id = competition.id
        competition.title = `Этап № ${competition.title}`
        competition.is_stage = true
        delete competition.stages

        competition.start_date = firebase.firestore.Timestamp.fromMillis(
            competition.start_date.toMillis() + this.getTime('24:00') * 1000
        )
        competition.end_date = competition.start_date

        delete competition.id
        return competition
    }

    onAddExtraField() {
        (this.fiveFromGroup.controls['athlet_extra_fields'] as FormArray).push(
            new FormControl('', [])
        )
    }

    onRemoveExtraField(index: number) {
        (this.fiveFromGroup.controls['athlet_extra_fields'] as FormArray).removeAt(index)
    }

    onAddClass(): void {
        (this.thirdFormGroup.controls['classes'] as FormArray).push(
            new FormControl('', [Validators.required])
        );

        (this.fourFromGroup.controls['checkpoints'] as FormArray).controls.map((fb: FormGroup) => {
            (fb.controls['classes'] as FormArray).push(
                new FormControl(false, [])
            )
        });
    }

    onRemoveClass(index: number) {
        (this.thirdFormGroup.controls['classes'] as FormArray).removeAt(index);

        (this.fourFromGroup.controls['checkpoints'] as FormArray).controls.forEach((fb: FormGroup) => {
            (fb.controls['classes'] as FormArray).removeAt(index)
        })
    }

    onAddCp() {
        (this.fourFromGroup.controls['checkpoints'] as FormArray).push(
            this.fb.group({
                title: ['', [Validators.required]],
                marshal: ['', []],
                classes: this.formArrayCheckboxes(this.competition.classes),
                devices: this.formArrayDevices([]),
            })
        )
    }

    onRemoveCp(index: number) {
        (this.fourFromGroup.controls['checkpoints'] as FormArray).removeAt(index)
    }

    trackByIndex(index, item) {
        return index
    }

    onSave(): void {
        let collection = this.firestore.collection('competitions')

        delete this.competition.stages
        delete this.competition.secret

        if (this.competition.parent_id) {
            collection = this.firestore.collection('competitions').doc(this.competition.parent_id).collection('stages')
        }

        let p: Promise<any>;

        if (this.competition.id) {
            p = collection.doc(this.competition.id).set(this.competition)
        } else {
            this.competition.user = this.auth.user.uid
            this.competition.created = firebase.firestore.Timestamp.now()
            this.competition.lock_results = false
            p = collection.add(this.competition)
        }

        p.then((doc?: DocumentReference) => {
            if (doc) {
                this.competition.id = doc.id
            }

            if (!this.competition.parent_id) {
                const test_secret_collection = this.firestore.collection('competitions').doc(this.competition.id).collection('test_secret')

                test_secret_collection.valueChanges().pipe(
                    first()
                ).subscribe((docs: any) => {
                    if (!docs.length) {
                        const batch = this.firestore.firestore.batch()

                        batch.set(test_secret_collection.doc('admin').ref, {
                            code: _.random(100000, 999999)
                        })

                        batch.set(test_secret_collection.doc('marshal').ref, {
                            code: _.random(100000, 999999)
                        })

                        batch.set(test_secret_collection.doc('client').ref, {
                            code: _.random(100000, 999999)
                        })

                        batch.commit()
                    }
                })
            }
            this.setActiveTabEvent.emit(1)
            this.router.navigate(['/cabinet'])
        })
    }
}
