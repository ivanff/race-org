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
import {AngularFirestore} from "@angular/fire/firestore"
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
    templateUrl: './competition.component.html'
})
export class CompetitionComponent implements OnInit, OnChanges, OnDestroy {
    isLinear = true
    timezoneFilterControl = new FormControl()
    filteredTimezones: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

    classes:Array<{value: string}> = [
        {value: 'hobby'}
    ]
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
        classes: [], //fill when save
        checkpoints: [
            {
                title: '',
                order: 0,
                classes: [
                    'hobby'
                ],
                devices: []
            } as Checkpoint
        ]
    }

    minDate = new Date()
    firstFormGroup: FormGroup
    secondFormGroup: FormGroup
    thirdFormGroup: FormGroup
    fourFromGroup: FormGroup

    protected _onDestroy = new ReplaySubject<any>(1)

    @Input('competition') competition: Competition = null
    @Input('competition$') competition$: Observable<Competition> = null
    @Input('firstCompetition') firstCompetition: Competition = null
    @Output() setActiveTabEvent = new EventEmitter<number>()

    @ViewChild('stepper', { static: true }) stepper: MatVerticalStepper

    constructor(private fb: FormBuilder,
                private firestore: AngularFirestore,
                private router: Router,
                private settings: SettingsService,
                private auth: AuthService) {
    }

    ngOnInit() {
        if (this.competition$) {
            this.competition$.pipe(takeUntil(this._onDestroy)).subscribe((next:Competition) => {
                this.competition = next
            })
        }

        if (this.competition) {
            this.isLinear = false
            this.data.title = this.competition.title
            this.data.start_date = moment(this.competition.start_date.toMillis()).tz(this.competition.timezone)
            this.data.start_time = this.secondsToTime(this.competition.start_time)
            this.data.end_date = moment(this.competition.end_date.toMillis()).tz(this.competition.timezone)
            this.data.duration = this.secondsToTime(this.competition.duration)
            this.data.timezone = this.competition.timezone
            this.data.group_start = this.competition.group_start
            this.data.marshal_has_device = this.competition.marshal_has_device
            this.data.result_by_full_circle = this.competition.result_by_full_circle
            this.data.checking = this.competition.checking
            this.data.checkpoints = this.competition.checkpoints

            this.classes = []
            this.competition.classes.forEach((_class) => {
                this.classes.push({
                    value: _class
                })
            })
        }

        if (this.firstCompetition) {
            this.data.title = this.firstCompetition.title
            this.data.start_date = moment(this.firstCompetition.start_date.toMillis()).tz(this.firstCompetition.timezone).add(1, 'day')
            this.data.start_time = this.secondsToTime(this.firstCompetition.start_time)
            this.data.end_date = moment(this.firstCompetition.end_date.toMillis()).tz(this.firstCompetition.timezone).add(1, 'day')
            this.data.duration = this.secondsToTime(this.firstCompetition.duration)
            this.data.timezone = this.firstCompetition.timezone
            this.data.group_start = this.firstCompetition.group_start
            this.data.marshal_has_device = this.firstCompetition.marshal_has_device
            this.data.result_by_full_circle = this.firstCompetition.result_by_full_circle
            this.data.checking = this.firstCompetition.checking
            this.data.checkpoints = this.firstCompetition.checkpoints
            this.classes = []
            this.firstCompetition.classes.forEach((_class) => {
                this.classes.push({
                    value: _class
                })
            })
        }


        this.firstFormGroup = this.fb.group({
            title: [this.data.title, [Validators.required]],
            start_date: [this.data.start_date, [Validators.required]],
            start_time: [this.data.start_time, [Validators.required, timeValidator]],
            end_date: [this.data.end_date, [Validators.required]],
            duration: [this.data.duration, [Validators.required, timeValidator]],
            timezone: [this.data.timezone],
            checking: this.formArrayChecking()
        })

        this.secondFormGroup = this.fb.group({})
        this.thirdFormGroup = new FormGroup({
            'classes': this.formArrayClasses()
        })
        this.fourFromGroup = new FormGroup({
            'checkpoints': this.formArrayCheckpoints()
        })

        this.filteredTimezones.next(this.settings.timezones_array)
        this.timezoneFilterControl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
            this.filterTimezones()
        })
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty('competition')) {
            if (!changes['competition'].firstChange) {
                this.competition = changes['competition'].currentValue
                this.ngOnInit()
                this.stepper.reset()
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
        const checkpoints = new FormArray([])
        this.data.checkpoints.forEach((checkpoint) => {
            checkpoints.push(this.fb.group({
                title: ['', [Validators.required]],
                classes: this.formArrayCheckboxes(checkpoint.classes)
            }))
        })
        return checkpoints
    }

    private formArrayClasses(): FormArray {
        const classes = new FormArray([])
        this.classes.forEach((_class) => {
            classes.push(new FormControl(_class.value, [Validators.required]))
        })
        return classes
    }

    private formArrayChecking(): FormArray {
        const checking = new FormArray([], [groupRequiredValidator(1)])
        this.checking.forEach((value: string) => {
            checking.push(new FormControl(this.data.checking.indexOf(value) > -1, []))
        })
        return checking
    }

    private formArrayCheckboxes(classes?:Array<string>): FormArray {
        const checkboxes = new FormArray([], [groupRequiredValidator(1)])
        this.classes.forEach((_class) => {
            checkboxes.push(new FormControl(classes.indexOf(_class.value) > -1, []))
        })
        return checkboxes
    }

    private getTime(time: string): number {
        const parts: Array<string> = time.split(':')
        if (parts.length == 2) {
            const h = parseInt(parts[0]) * 60 * 60
            const m = parseInt(parts[1]) * 60
            return h+m
        }
        return null
    }

    onCheckboxChange($event: MatCheckboxChange, list: Array<string>) {
        if ($event.checked) {
            if (list.indexOf($event.source.value) == -1) {
                list.push(
                    $event.source.value
                )
            }
        } else {
            const index = list.indexOf($event.source.value)
            if (index > -1) {
                list.splice(index, 1)
            }
        }
    }
    onClassCheckboxChange($event: MatCheckboxChange, index: number) {
        if ($event.checked) {
            this.data.checkpoints[index].classes.push($event.source.value)
        } else {
            const y: number = this.data.checkpoints[index].classes.indexOf($event.source.value)
            if (y >= 0) {
                this.data.checkpoints[index].classes.splice(y, 1)
            }
        }

        const checkpoint = (this.fourFromGroup.controls['checkpoints'] as FormArray).controls[index] as FormGroup
        (checkpoint.controls['classes'] as FormArray).reset(
            this.classes.map((_class) => this.data.checkpoints[index].classes.indexOf(_class.value) >= 0)
        )

    }

    onDateChange(type: string, $event: MatDatepickerInputEvent<moment>, formControlName) {
        if ($event.value) {
            this.data[formControlName] = $event.value
        }
    }

    onSlideChange($event: MatSlideToggleChange) {
        this.data[$event.source.name] = $event.checked
    }

    onAddClass() {
        (this.thirdFormGroup.controls['classes'] as FormArray).push(
            new FormControl('', [Validators.required])
        )
        this.classes.push({value: ''})

        this.data.checkpoints.forEach((item: any, index: number) => {
            (this.fourFromGroup.controls['checkpoints'] as FormArray).controls.forEach((checkpoint: FormGroup) => {
                (checkpoint.controls['classes'] as FormArray).push(
                    new FormControl(false, [])
                )
            })
        })
    }

    onRemoveClass(index: number) {
        (this.thirdFormGroup.controls['classes'] as FormArray).removeAt(index)

        const deleted: Array<string> = this.classes.splice(index, 1).map((item) => item.value)

        this.data.checkpoints.forEach((item: any, y: number) => {
            item.classes = item.classes.filter((item) => deleted.indexOf(item) < 0)

            (this.fourFromGroup.controls['checkpoints'] as FormArray).controls.forEach((checkpoint: FormGroup) => {
                (checkpoint.controls['classes'] as FormArray).reset(
                    this.classes.map((_class) => this.data.checkpoints[index].classes.indexOf(_class.value) >= 0)
                )
            })

        })
    }

    onAddCp() {
        (this.fourFromGroup.controls['checkpoints'] as FormArray).push(
            this.fb.group({
                title: ['', [Validators.required]],
                classes: this.formArrayCheckboxes(this.data.classes)
            })
        )
        this.data.checkpoints.push({
            title: '',
            order: 0,
            classes: [...this.classes.map((item) => item.value)],
            devices: []
        } as Checkpoint)
    }

    onRemoveCp(index: number) {
        this.data.checkpoints.splice(index, 1);
        (this.fourFromGroup.controls['checkpoints'] as FormArray).removeAt(index)
    }

    trackByIndex(index, item) {
        return index
    }

    onSave() {

        let competition = <Competition>{}

        competition.created = this.data.created
        competition.title = this.data.title
        competition.timezone = this.data.timezone
        competition.start_date = firebase.firestore.Timestamp.fromDate(
            moment.tz(`${this.data.start_date.format('YYYY-MM-DD')} 00:00:00`, this.data.timezone).startOf('day').toDate()
        )
        competition.start_time = this.getTime(this.data.start_time)
        competition.end_date = firebase.firestore.Timestamp.fromDate(
            moment.tz(`${this.data.end_date.format('YYYY-MM-DD')} 00:00:00`, this.data.timezone).startOf('day').toDate()
        )
        competition.duration = this.getTime(this.data.duration)
        competition.checking = this.data.checking
        competition.group_start = this.data.group_start
        competition.marshal_has_device = this.data.marshal_has_device
        competition.classes = this.classes.map((item) => item.value) as Array<string>
        competition.checkpoints = this.data.checkpoints.map((item, index: number) => {
            item.classes = item.classes.filter((_class) => competition.classes.indexOf(_class) >= 0)
            item.order = index
            return item
        })

        let collection = this.firestore.collection('competitions')

        if (this.competition) {
            competition.secret = this.competition.secret
            collection.doc(this.competition.id).set(competition, {merge: true}).then(() => {
                this.router.navigate(['/dashboard'])
            })
        } else if (this.firstCompetition) {
            competition.secret = this.firstCompetition.secret
            collection.doc(this.firstCompetition.id).collection('stages').add(competition).then(() => {
                this.setActiveTabEvent.emit(0)
            })
        } else {
            competition.secret = Object.assign({}, new Secret()) as Secret
            competition.user = this.auth.user.uid
            collection.doc(this.firestore.createId()).set(competition).then(() => {
                this.router.navigate(['/dashboard'])
            })
        }
    }
}
