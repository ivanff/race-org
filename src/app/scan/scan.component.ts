import {
    AfterViewInit,
    Component,
    ElementRef,
    NgZone,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef
} from '@angular/core'
import {firestore} from 'nativescript-plugin-firebase'
import {ModalDialogService, RouterExtensions} from 'nativescript-angular'
import {NfcTagData} from 'nativescript-nfc'
import {BaseComponent} from "@src/app/shared/base.component"
import {NfcService} from "@src/app/mobile/services/nfc.service"
import {Mark} from "@src/app/shared/interfaces/mark"
import {isAndroid} from "@nativescript/core/platform"
import {ActivatedRoute} from "@angular/router"
import * as moment from 'moment'
import {TextField} from "@nativescript/core/ui/text-field"
import {BehaviorSubject, defer, EMPTY, Observable, Observer, ReplaySubject, Subject} from "rxjs"
import {debounceTime, map, startWith, switchMap, take, takeUntil, tap} from "rxjs/operators"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {SqliteService} from "@src/app/mobile/services/sqlite.service"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {Msg} from "@src/app/shared/interfaces/msg"
import {keepAwake, allowSleepAgain} from "nativescript-insomnia";
import {BarcodeService} from "@src/app/mobile/services/barcode.service"
import {QrAthlet} from "@src/app/shared/interfaces/qr"
import {localize as L} from "nativescript-localize"

const firebase = require('nativescript-plugin-firebase/app')


@Component({
    selector: 'app-scan',
    templateUrl: './scan.component.html',
    styleUrls: ['./scan.component.scss']
})
export class ScanComponent extends BaseComponent implements AfterViewInit, OnInit, OnDestroy {
    last_athlet: Athlet
    current_checkpoint: Checkpoint = null
    number$ = new BehaviorSubject(null)
    input_number = ''
    // foundedNumbers$ = new Subject()
    foundedNumbers$: any
    private collection: firestore.CollectionReference
    private destroy = new ReplaySubject<any>(1)
    private $lastAthlet: any


    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef
    @ViewChild('textField', {static: false}) textFieldRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                public nfc: NfcService,
                private zone: NgZone,
                private snackbar: SnackbarService,
                private barcode: BarcodeService,
                private modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private activeRoute: ActivatedRoute,
                public _competition: CompetitionService,
                private options: SqliteService) {
        super(routerExtensions)
        this.collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
        this.current_checkpoint = activeRoute.snapshot.data['current_checkpoint']

        const z = []
        this.foundedNumbers$ = (new BehaviorSubject<string>(null)).pipe(
            map((i) => {
                if (i != null) {
                    z.unshift(i)
                }
                return z.join('; ')
            })
        )
    }

    private _missingCheck(date: Date) {
        // Если мало чек поинтов значит трасса короткая, проверка предыдущей отметки соркатить до минуты
        return moment().diff(date, 'minutes') < (this._competition.selected_competition.checkpoints.length > 1 ? 5 : 1)
    }

    ngAfterViewInit() {
        if (this.activityIndicatorRef.nativeElement.busy) {
            this.zone.runOutsideAngular(() => this.nfc.doStartTagListener(this.setNfcMark.bind(this)))
        }
    }

    ngOnInit() {
        keepAwake().then(() => {
            this.snackbar.success(L("Disable device sleeping"))
        })

        this.$lastAthlet = this.number$.pipe(
            debounceTime(500),
            switchMap((value) => {
                const number: number = parseInt(value)
                if (number) {
                    return defer(() => {
                        return this.collection.where('number', '==', number).get({source: 'cache'}).then((item) => {
                            return item
                        })
                    }).pipe(
                        map((snapshot: firestore.QuerySnapshot) => {
                            let athlet: Athlet | null
                            if (snapshot.docs.length === 1) {
                                if (this.current_checkpoint) {
                                    snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                                        const id = doc.id
                                        athlet = {id, ...doc.data()} as Athlet
                                    })
                                }
                            } else {
                                athlet = null
                            }
                            return athlet
                        }),
                        takeUntil(this.destroy)
                    )
                } else {
                    return EMPTY
                }
            }),
            takeUntil(this.destroy)
        )

        this.$lastAthlet.subscribe((athlet: Athlet) => {
            this.last_athlet = athlet
        })
    }

    ngOnDestroy(): void {
        console.log('>> ScanComponent ngOnDestroy')
        allowSleepAgain().then(() => {
            this.snackbar.success(L("Enable device sleeping"))
        })
        this.nfc.doStopTagListener()
        this.destroy.next(null)
        this.destroy.complete()
    }

    onScan(): void {
        this.barcode.scan().then((result) => {
            try {
                const data: QrAthlet = JSON.parse(result.text)
                setTimeout(() => {
                    this.input_number = data.number.toString()
                }, 100)
                this.snackbar.success(L("Athlete number is found"))
            } catch (e) {
                this.snackbar.alert(L('Athlete number is\'t found: %s', e))
            }

        })
    }

    onFound(athlet: Athlet, msg: string, error?: boolean): void {
        this.snackbar.snackbar$.next({
            level: error ? 'alert' : 'success',
            msg: `<${athlet.number}> ${msg}`,
            timeout: 3000
        } as Msg)
    }

    private setMark(mark: Mark) {
        const marks: Array<Mark> = this.last_athlet.marks.filter((mark: Mark): boolean => {
            return mark.competition_id == this._competition.selected_competition.id
        })
        // this.activityIndicatorRef.nativeElement.busy = false

        if (marks.length) {
            const last_mark = marks[marks.length - 1]

            if (this._missingCheck(last_mark.created) && (last_mark.order == this.current_checkpoint.order)) {
                this.snackbar.alert(L('The current mark was set recently!'))
                return
            }

            if (this.current_checkpoint.order > 0) {
                if ((this.current_checkpoint.order - 1) != last_mark.order) {
                    this.onFound(this.last_athlet, L('The Marshal\'s previous mark may have been missed'), true)
                }
            }
        } else {
            if (this.current_checkpoint.order != 0) {
                this.onFound(this.last_athlet, L('The Marshal\'s previous mark may have been missed'), true)
            }
        }

        // if (moment() > this._competition.finish_time) {
        //     this.onFound(this.last_athlet, L('The competition is over, time is up!'), true)
        // }

        this.onFound(this.last_athlet, L('THE PASSAGE MARK RECORDED'))
        this.foundedNumbers$.next(this.last_athlet.number)

        this.collection.doc(this.last_athlet.id).update({marks: [...this.last_athlet.marks, mark]}).then(() => {
        }).catch((err) => {
            this.snackbar.alert(`Transaction error: ${err}!`)
        })
    }

    setNfcMark(data: NfcTagData) {
        if (this.current_checkpoint) {
            const mark: Mark = {
                order: this.current_checkpoint.order,
                created: new Date(),
                competition_id: this._competition.selected_competition.id
            }
            this.options.insert(data.id, '', mark).then((sqlite_id: number) => {
                this.collection.where('nfc_id', '==', data.id).get().then((snapshot: firestore.QuerySnapshot) => {
                    if (snapshot.docs.length === 1) {
                        snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                            const id = doc.id
                            this.last_athlet = {id, ...doc.data()} as Athlet
                            if (sqlite_id) {
                                this.options.update(sqlite_id, data.id, `id[${this.last_athlet.id}]`, mark)
                            }
                            this.setMark(mark)
                            this.last_athlet = null
                        })
                    } else {
                        this.snackbar.alert(L('Athlete is\'t found by NFC tag\n%s', data.id.toString()))
                        this.activityIndicatorRef.nativeElement.busy = false
                        this.last_athlet = null
                    }
                })
                return sqlite_id
            })

        }
    }

    setNumberMark(textField: TextField, ) {
        if (this.current_checkpoint) {
            const mark: Mark = {
                order: this.current_checkpoint.order,
                created: new Date(),
                competition_id: this._competition.selected_competition.id
            }
            let sqlite_id: number = null
            this.options.insert([], `number[${this.last_athlet.number}]`, mark).then(id => sqlite_id = id)

            this.setMark(mark)
            this.last_athlet = null
            textField.text = ''
            textField.dismissSoftInput()
            if (isAndroid) {
                textField.android.clearFocus()
            }
        }
    }

    onBusyChanged($event) {
        if ($event.object.busy) {
            this.zone.runOutsideAngular(() => this.nfc.doStartTagListener(this.setNfcMark.bind(this)))
        } else {
            this.nfc.doStopTagListener()
        }
    }

    onTextChange($event): void {
        const textField = <TextField>$event.object
        this.number$.next(textField.text)
        this.last_athlet = null
    }

    onReturnPress(textField: TextField): void {
        console.log(
            'onReturnPress'
        )
        this.$lastAthlet.pipe(
            take(1)
        ).subscribe((last_athlet) => {
            if (last_athlet) {
                this.setNumberMark(textField)
            }
        })
    }
}

