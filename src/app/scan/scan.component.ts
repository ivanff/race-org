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
import {getString} from 'tns-core-modules/application-settings'
import {ModalDialogOptions, ModalDialogService, RouterExtensions} from 'nativescript-angular'
import {NfcTagData} from 'nativescript-nfc'
import {BaseComponent} from "@src/app/shared/base.component"
import {Athlet} from "@src/app/home/athlet"
import {NfcService} from "@src/app/shared/nfc.service"
import {Mark} from "@src/app/home/mark"
import {CheckPoint} from "@src/app/home/checkpoint"
import {device, isAndroid} from "tns-core-modules/platform"
import {FoundDialogComponent} from "@src/app/scan/found-dialog/found-dialog.component"
import {ActivatedRoute} from "@angular/router"
import * as moment from 'moment'
import {SettingsService} from "@src/app/shared/settings.service"
import {TextField} from "tns-core-modules/ui/text-field"
import {BehaviorSubject, defer, empty, ReplaySubject} from "rxjs"
import {debounceTime, map, switchMap, takeUntil} from "rxjs/operators"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-scan',
    templateUrl: './scan.component.html',
    styleUrls: ['./scan.component.scss']
})
export class ScanComponent extends BaseComponent implements AfterViewInit, OnInit, OnDestroy {
    last_athlet: Athlet
    current_checkpoint: CheckPoint = null
    number$ = new BehaviorSubject(null)
    destroy = new ReplaySubject<any>(1)
    collection = firebase.firestore().collection('athlets')

    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef
    @ViewChild('textField', {static: false}) textFieldRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                private zone: NgZone,
                public nfc: NfcService,
                private modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private activeRoute: ActivatedRoute,
                private app_settings: SettingsService) {
        super(routerExtensions)
    }

    ngAfterViewInit() {
        if (this.activityIndicatorRef.nativeElement.busy) {
            this.zone.runOutsideAngular(() => this.nfc.doStartTagListener(this.setNfcMark.bind(this)))
        }
    }

    ngOnInit() {
        const checkpoints = firebase.firestore().collection('checkpoints')
            .where('device', '==', device.uuid).get()

        checkpoints.then((snapshot: firestore.QuerySnapshot) => {
            if (snapshot.docs.length === 1) {
                snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                    const id = doc.id
                    this.current_checkpoint = {id, ...doc.data()} as CheckPoint
                })
            } else {
                alert('This device is\'t READER in current competition!')
            }
        })

        this.number$.pipe(
            debounceTime(1000),
            switchMap((value) => {
                const number: number = parseInt(value)
                if (number) {
                    return defer(() => {
                        return this.collection.where('number', '==', number).get()
                    }).pipe(
                        map((snapshot: firestore.QuerySnapshot) => {
                            let athlet: Athlet | null
                            if (snapshot.docs.length === 1) {
                                if (this.app_settings.hasCp()) {
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
                    return empty()
                }
            })
        ).subscribe((athlet: Athlet) => {
            this.last_athlet = athlet
        })

        // this.onFound({phone: '9603273301'} as Athlet
    }

    ngOnDestroy(): void {
        this.nfc.doStopTagListener()
        this.destroy.next(null)
        this.destroy.complete()
    }

    onFound(athlet: Athlet, msg: string, error?: boolean): void {
        const options: ModalDialogOptions = {
            context: {
                athlet: athlet,
                msg: msg,
                error: error
            },
            viewContainerRef: this.viewContainerRef,
            fullscreen: false
        };

        this.modalService.showModal(FoundDialogComponent, options).then((path: Array<string> | null) => {
            if (path) {
                setTimeout(() =>
                        this.routerExtensions.navigate(path, {relativeTo: this.activeRoute})
                    , 100)
            }
            return
        })
    }

    private setMark(mark: Mark) {
        const checkpoints: Array<Mark> = this.last_athlet.checkpoints
        this.activityIndicatorRef.nativeElement.busy = false

        if (checkpoints.length) {
            const last_checkpoint = checkpoints[checkpoints.length - 1]

            if ((moment().diff(last_checkpoint.created, 'minutes') <= 5) && (last_checkpoint.key == this.current_checkpoint.key)) {
                alert('Текущая метка отмечена менее 5 минут назад!\nПовторная отметка прохождения!')
                return
            }

            if (this.current_checkpoint.order > 0) {
                if ((this.current_checkpoint.order - 1) != last_checkpoint.order) {
                    this.onFound(this.last_athlet, 'Возможно пропущена предыдущая отметка маршала', true)
                    return
                }
            }
        } else {
            if (this.current_checkpoint.order != 0) {
                this.onFound(this.last_athlet, 'Возможно пропущена предыдущая отметка маршала', true)
                return
            }
        }

        if (moment() > moment(this.app_settings.competition.finish)) {
            this.onFound(this.last_athlet, 'Соревнование окончено, время вышло!', true)
        }

        this.onFound(this.last_athlet, 'УДАЧНО')

        checkpoints.push(mark)
        this.collection.doc(this.last_athlet.id).update({checkpoints: checkpoints}).then(() => {
        }, (err) => {
        }).catch((err) => {
            console.log(`Transaction error: ${err}!`)
        })
    }

    setNfcMark(data: NfcTagData) {
        if (this.current_checkpoint) {
            const mark: Mark = {
                key: this.current_checkpoint.key,
                order: this.current_checkpoint.order,
                created: new Date(),
            }
            this.app_settings.insert(data.id, '', mark).then((sqlite_id: number) => {
                const athlets = this.collection.where('nfc_id', '==', data.id).get()
                athlets.then((snapshot: firestore.QuerySnapshot) => {
                    if (snapshot.docs.length === 1) {
                        if (this.app_settings.hasCp()) {
                            snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                                const id = doc.id
                                this.last_athlet = {id, ...doc.data()} as Athlet
                                if (sqlite_id) {
                                    this.app_settings.update(sqlite_id, data.id, `id[${this.last_athlet.id}]`, mark)
                                }
                                this.setMark(mark)
                            })
                        } else {
                            alert('Checkpoint isn\'t setup!')
                            this.activityIndicatorRef.nativeElement.busy = false
                        }
                    } else {
                        alert(`Athlet is\'t found which has NFC tag ${data.id}!`)
                        this.activityIndicatorRef.nativeElement.busy = false
                        this.last_athlet = null
                    }
                })
            })

        }
    }

    setNumberMark(textField: TextField) {
        if (this.current_checkpoint) {
            const mark: Mark = {
                key: this.current_checkpoint.key,
                order: this.current_checkpoint.order,
                created: new Date(),
            }
            let sqlite_id: number = null
            this.app_settings.insert([], `number[${this.last_athlet.number}]`, mark).then(id => sqlite_id = id)

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
