import {Component, OnInit} from '@angular/core';
import {MatCheckboxChange, MatDatepickerInputEvent, MatSlideToggleChange} from "@angular/material"
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators} from "@angular/forms"
import {AngularFirestore} from "@angular/fire/firestore"
import {Router} from "@angular/router"
import {AuthService, SettingsService} from "@src/app/web/core"
import * as firebase from "firebase"
import * as moment from "moment-timezone"
import {Secret} from "@src/app/shared/interfaces/secret"
import {Competition} from "@src/app/shared/interfaces/competition"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"

export class FormCp {
    key: string
    title: string
    order: number
    classes: Array<string>

    convertToDb() {
        let tmp: { [key: string]: Array<{ key: string, title: string, order: number, devices: Array<any> }> } = {}
        this.classes.forEach((_class: string) => {
            if (!tmp[_class]) {
                tmp[_class] = [{
                    key: this.key,
                    title: this.title,
                    order: this.order,
                    devices: []
                }]
            } else {
                tmp[_class].push({
                    key: this.key,
                    title: this.title,
                    order: this.order,
                    devices: []
                })
            }
        })
        return tmp
    }
}

export function groupRequiredValidator(count: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        return control.value.filter((item) => item).length < count ? {'groupRequired': {value: control.value}} : null
    }
}

@Component({
    selector: 'app-dashboard-add',
    templateUrl: './dashboard-add.component.html',
    styleUrls: ['./dashboard-add.component.scss']
})
export class DashboardAddComponent implements OnInit {
    isLinear = true
    timezones: {[key: string]: string} = {}

    classes = [
        {value: 'hobby'}
    ]

    data = {
        user: null,
        created: firebase.firestore.Timestamp.now(),
        title: '',
        time_zone: '',

        start_date: null,
        start_time: new firebase.firestore.Timestamp(12*60*60, 0),

        end_date: null,
        duration: new firebase.firestore.Timestamp(3*60*60, 0),

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

    constructor(private fb: FormBuilder,
                private firestore: AngularFirestore,
                private router: Router,
                private settings: SettingsService,
                private auth: AuthService) {
        this.timezones = settings.timezones

        this.firstFormGroup = this.fb.group({
            title: ['', [Validators.required]],
            start_date: ['', [Validators.required]],
            start_time: ['12:00', [Validators.required, Validators.pattern('^[0-9]{1,2}\:[0-9]{1,2}$')]],
            end_date: ['', [Validators.required]],
            duration: ['03:00', [Validators.required, Validators.pattern('^[0-9]{1,2}\:[0-9]{1,2}$')]],
            timezone: [moment.tz.guess()]
        })
        this.secondFormGroup = this.fb.group({})
        this.thirdFormGroup = new FormGroup({
            'classes': this.formArrayClasses()
        })
        this.fourFromGroup = new FormGroup({
            'checkpoints': this.formArrayCheckpoints()
        })
    }

    ngOnInit() {
        console.log(
            this.settings.timezones,
            // moment.tz.guess(),
            // this.settings.timezones[moment.tz.guess()]
        )

    }

    private formArrayCheckpoints(): FormArray {
        const checkpoints = new FormArray([])
        this.data.checkpoints.forEach(() => {
            checkpoints.push(this.fb.group({
                title: ['', [Validators.required]],
                classes: this.formArrayCheckboxes()
            }))
        })
        return checkpoints
    }

    private formArrayClasses(): FormArray {
        const classes = new FormArray([])
        this.classes.forEach((_class) => {
            classes.push(new FormControl(true, [Validators.required]))
        })
        return classes
    }

    private formArrayCheckboxes(state=true): FormArray {
        const checkboxes = new FormArray([], [groupRequiredValidator(1)])
        this.classes.forEach(() => {
            checkboxes.push(new FormControl(state, []))
        })
        return checkboxes
    }

    onCheckboxChange($event: MatCheckboxChange, index: number) {
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

    onDateChange(type: string, $event: MatDatepickerInputEvent<Date>) {
        if ($event.value) {
            const formControlName: string = $event.targetElement.attributes.formcontrolname.value
            this.data[formControlName] = firebase.firestore.Timestamp.fromDate($event.value)
        }
    }

    setTime($event, name) {
        const parts: Array<string> = $event.split(':')
        let time = new firebase.firestore.Timestamp(0, 0)
        if (parts.length == 2) {
            const h = parseInt(parts[0]) * 60 * 60
            const m = parseInt(parts[1]) * 60
            time = new firebase.firestore.Timestamp(h+m, 0)
        }
        this.data[name] = time
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
                classes: this.formArrayCheckboxes()
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

    onCreate() {
        let data: Competition = {...this.data}
        data['secret'] = Object.assign({}, new Secret()) as Secret
        data['classes'] = this.classes.map((item) => item.value) as Array<string>
        data.checkpoints.forEach((item, index: number) => {
            item.classes.filter((_class) => data['classes'].indexOf(_class) >= 0)
            item.order = index
        })
        data['user'] = this.auth.user.uid

        const id = this.firestore.createId()
        this.firestore.doc(`competitions/${id}`).set(data).then(() => {
            this.router.navigate(['/dashboard'])
        })
    }
}
