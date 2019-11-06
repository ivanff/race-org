import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {
    MatCheckboxChange,
    MatDatepickerInputEvent,
    MatSlideToggleChange,
    MatVerticalStepper
} from "@angular/material"
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators} from "@angular/forms"
import {AngularFirestore, DocumentReference} from "@angular/fire/firestore"
import {Router} from "@angular/router"
import * as firebase from "firebase/app"
import * as moment from "moment-timezone"
import {Secret} from "@src/app/shared/interfaces/secret"
import {Competition} from "@src/app/shared/interfaces/competition"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {Observable, ReplaySubject, Subject} from "rxjs"
import {takeUntil} from "rxjs/operators"
import {SettingsService} from "@src/app/web/core/services/settings.service"
import {AuthService} from "@src/app/web/core/services/auth.service"


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
    // isLinear = true
    isLinear = false
    timezoneFilterControl = new FormControl()
    filteredTimezones: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

    checking = [
        'manual',
        'nfc',
        'barcode'
    ]

    data = {
        user: null,
        created: firebase.firestore.Timestamp.now(),
        title: '',
        timezone: moment.tz.guess(),

        start_date: null,
        start_time: '12:00',

        end_date: null,
        duration: '3:00',

        checking: [
            'manual',
            'nfc',
        ],
        group_start: false,
        marshal_has_device: true,
        result_by_full_circle: true,
        classes: [
            'hobby'
        ],
        checkpoints: [
            {
                title: '',
                order: 0,
                classes: [
                    'hobby'
                ],
                devices: []
            } as Checkpoint
        ],
        athlet_extra_fields: [
            'city'
        ]
    }

    minDate = new Date()
    firstFormGroup: FormGroup
    secondFormGroup: FormGroup
    thirdFormGroup: FormGroup
    fourFromGroup: FormGroup
    fiveFromGroup: FormGroup

    protected _onDestroy = new ReplaySubject<any>(1)

    @Input('clone') clone = false
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
        created: firebase.firestore.Timestamp.now()
    } as Competition
    // @Input('competition$') competition$: Observable<Competition> = null
    // @Input('firstCompetition') firstCompetition: Competition = null
    @Output() setActiveTabEvent = new EventEmitter<number>()

    @ViewChild('stepper', {static: true}) stepper: MatVerticalStepper

    constructor(private fb: FormBuilder,
                private firestore: AngularFirestore,
                private router: Router,
                private settings: SettingsService,
                private auth: AuthService) {
    }

    ngOnInit(): void {
        if (this.clone) {
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
        this.firstFormGroup.valueChanges.pipe(
            takeUntil(this._onDestroy)
        ).subscribe((next: any) => {
            Object.assign(this.competition, {
                title: next.title,
                start_date: next.start_date ? firebase.firestore.Timestamp.fromDate(next.start_date.toDate()) : null,
                start_time: next.start_time ? this.getTime(next.start_time) : null,
                end_date: next.end_date ? firebase.firestore.Timestamp.fromDate(next.end_date.toDate()) : null,
                duration: next.duration ? this.getTime(next.duration) : null,
                timezone: next.timezone,
                checking: this.checking.filter((item, index) => next.checking[index])
            })
        })

        this.secondFormGroup = this.fb.group({
            group_start: [this.competition.group_start],
            marshal_has_device: [this.competition.marshal_has_device],
            result_by_full_circle: [this.competition.result_by_full_circle],
        })
        this.secondFormGroup.valueChanges.pipe(
            takeUntil(this._onDestroy)
        ).subscribe((next: any) => {Object.assign(this.competition, next)})

        this.thirdFormGroup = new FormGroup({'classes': this.formArrayClasses() as FormArray})
        this.thirdFormGroup.valueChanges.subscribe((next) => {Object.assign(this.competition, next)})

        this.fourFromGroup = new FormGroup({'checkpoints': this.formArrayCheckpoints() as FormArray})
        this.fourFromGroup.valueChanges.subscribe((next) => {
            this.competition.checkpoints = next.checkpoints.map((item) => {
                const classes = this.competition.classes.filter((_class, index) => item.classes[index])
                return {...item, classes} as Checkpoint
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
                const competition = {...changes['competition'].currentValue}
                this.stepper.reset()
                setTimeout(() => {
                    this.competition = competition
                    this.ngOnInit()
                }, 100)
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
                    classes: this.formArrayCheckboxes(checkpoint.classes)
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
        let competition = {...this.competition}
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
                classes: this.formArrayCheckboxes(this.competition.classes)
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

        if (this.competition.parent_id) {
            collection = this.firestore.collection('competitions').doc(this.competition.parent_id).collection('stages')
        } else {
            if (!this.competition.id) {
                this.competition.secret = Object.assign({}, new Secret()) as Secret
            }
        }

        let p: Promise<any>;

        if (this.competition.id) {
            p = collection.doc(this.competition.id).set(this.competition)
        } else {
            this.competition.user = this.auth.user.uid
            this.competition.secret = Object.assign({}, new Secret()) as Secret
            p = collection.add(this.competition)
        }

        p.then((doc?: DocumentReference) => {
            if (doc) {
                this.competition.id = doc.id
            }
            this.router.navigate(['/dashboard'])
        })
    }
}
