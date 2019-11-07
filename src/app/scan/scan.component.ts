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
import {ModalDialogOptions, ModalDialogService, RouterExtensions} from 'nativescript-angular'
import {NfcTagData} from 'nativescript-nfc'
import {BaseComponent} from "@src/app/shared/base.component"
import {NfcService} from "@src/app/mobile/services/nfc.service"
import {Mark} from "@src/app/shared/interfaces/mark"
import {isAndroid} from "tns-core-modules/platform"
import {FoundDialogComponent} from "@src/app/scan/found-dialog/found-dialog.component"
import {ActivatedRoute} from "@angular/router"
import * as moment from 'moment'
import {TextField} from "tns-core-modules/ui/text-field"
import {BehaviorSubject, defer, EMPTY, ReplaySubject} from "rxjs"
import {debounceTime, map, switchMap, takeUntil} from "rxjs/operators"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {SqliteService} from "@src/app/mobile/services/sqlite.service"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {Msg} from "@src/app/shared/interfaces/msg"
import {keepAwake, allowSleepAgain} from "nativescript-insomnia";

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
    private collection: firestore.CollectionReference
    private destroy = new ReplaySubject<any>(1)

    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef
    @ViewChild('textField', {static: false}) textFieldRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                public nfc: NfcService,
                private zone: NgZone,
                private snackbar: SnackbarService,
                private modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private activeRoute: ActivatedRoute,
                private _competition: CompetitionService,
                private options: SqliteService) {
        super(routerExtensions)
        this.collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
        this.current_checkpoint = activeRoute.snapshot.data['current_checkpoint']
    }

    ngAfterViewInit() {
        if (this.activityIndicatorRef.nativeElement.busy) {
            this.zone.runOutsideAngular(() => this.nfc.doStartTagListener(this.setNfcMark.bind(this)))
        }
    }

    ngOnInit() {
        keepAwake().then(() => {
            this.snackbar.warning("Disable device sleeping")
        })
        this.number$.pipe(
            debounceTime(2000),
            switchMap((value) => {
                const number: number = parseInt(value)
                if (number) {
                    return defer(() => {
                        return this.collection.where('number', '==', number).get()
                    }).pipe(
                        map((snapshot: firestore.QuerySnapshot) => {
                            console.log(snapshot.docs)
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
            })
        ).subscribe((athlet: Athlet) => {
            this.last_athlet = athlet
        })

        // this.onFound({phone: '9603273301'} as Athlet
    }

    ngOnDestroy(): void {
        console.log('>> ScanCompenent ngOnDestroy')
        allowSleepAgain().then(() => {
            this.snackbar.warning("Enable device sleeping")
        })
        this.nfc.doStopTagListener()
        this.destroy.next(null)
        this.destroy.complete()
    }

    onFound(athlet: Athlet, msg: string, error?: boolean): void {

        this.snackbar.snackbar$.next({
            level: error ? 'alert' : 'success',
            msg: `${athlet.number}\n${msg}`,
            timeout: 3000
        } as Msg)

        // const options: ModalDialogOptions = {
        //     context: {
        //         athlet: athlet,
        //         msg: msg,
        //         error: error
        //     },
        //     viewContainerRef: this.viewContainerRef,
        //     fullscreen: false
        // };
        //
        // this.modalService.showModal(FoundDialogComponent, options).then((path: Array<string> | null) => {
        //     if (path) {
        //         setTimeout(() =>
        //                 this.routerExtensions.navigate(path, {relativeTo: this.activeRoute})
        //             , 100)
        //     }
        //     return
        // })
    }

    private setMark(mark: Mark) {
        const marks: Array<Mark> = this.last_athlet.marks.filter((mark: Mark) => mark.competition_id == this._competition.selected_competition.id)
        // this.activityIndicatorRef.nativeElement.busy = false

        if (marks.length) {
            const last_mark = marks[marks.length - 1]

            if ((moment().diff(last_mark.created, 'minutes') <= 5) && (last_mark.order == this.current_checkpoint.order)) {
                this.snackbar.alert('Текущая метка отмечена менее 5 минут назад!')
                return
            }

            if (this.current_checkpoint.order > 0) {
                if ((this.current_checkpoint.order - 1) != last_mark.order) {
                    this.onFound(this.last_athlet, 'Возможно пропущена предыдущая отметка маршала', true)
                }
            }
        } else {
            if (this.current_checkpoint.order != 0) {
                this.onFound(this.last_athlet, 'Возможно пропущена предыдущая отметка маршала', true)
            }
        }

        if (moment() > this._competition.finish_time) {
            this.onFound(this.last_athlet, 'Соревнование окончено, время вышло!', true)
        }

        this.onFound(this.last_athlet, 'ПРОХОЖДЕНИЕ ТОЧКИ ЗАПИСАНО')

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
                        alert(`Athlet is\'t found which has NFC tag ${data.id}!`)
                        this.activityIndicatorRef.nativeElement.busy = false
                        this.last_athlet = null
                    }
                })
                return sqlite_id
            })

        }
    }

    setNumberMark(textField: TextField) {
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
    }
}
