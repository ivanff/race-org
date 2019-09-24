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
import {device} from "tns-core-modules/platform"
import {FoundDialogComponent} from "@src/app/scan/found-dialog/found-dialog.component"
import {ActivatedRoute} from "@angular/router"
import * as moment from 'moment'
import {SettingsService} from "@src/app/shared/settings.service"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-scan',
    templateUrl: './scan.component.html',
    styleUrls: ['./scan.component.scss']
})
export class ScanComponent extends BaseComponent implements AfterViewInit, OnInit, OnDestroy {
    last_athlet: Athlet
    current_checkpoint: CheckPoint = null

    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef

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
        // this.onFound({phone: '9603273301'} as Athlet
    }

    ngOnDestroy(): void {
        this.nfc.doStopTagListener()
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
                    this.routerExtensions.navigate(path,{relativeTo: this.activeRoute})
                , 100)
            }
            return
        })
    }


    setNfcMark(data: NfcTagData) {
        if (this.current_checkpoint) {
            const athlets = firebase.firestore().collection('athlets')
                .where('nfc_id', '==', data.id).get()
            athlets.then((snapshot: firestore.QuerySnapshot) => {
                if (snapshot.docs.length === 1) {
                    if (this.app_settings.hasCp()) {

                        snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                            this.last_athlet = doc.data() as Athlet
                            const checkpoints: Array<Mark> = this.last_athlet.checkpoints
                            this.activityIndicatorRef.nativeElement.busy = false

                            if (checkpoints.length) {
                                const last_checkpoint = checkpoints[checkpoints.length - 1]

                                if ((moment().diff(last_checkpoint.created, 'minutes') <= 7) && (last_checkpoint.key == this.current_checkpoint.key)) {
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

                            this.onFound(this.last_athlet, 'УДАЧНО')

                            checkpoints.push({
                                key: this.current_checkpoint.key,
                                order: this.current_checkpoint.order,
                                created: new Date(),
                            } as Mark)
                            firebase.firestore().collection('athlets').doc(doc.id).update({
                                checkpoints: checkpoints
                            }).then(() => {
                            }, (err) => {
                            }).catch((err) => {
                                console.log(`Transaction error: ${err}!`)
                            })
                        })
                    } else {
                        alert('Checkpoint isn\'t setup!')
                        this.activityIndicatorRef.nativeElement.busy = false
                    }
                } else {
                    alert(`Athlet is\'t found which has NFC tag ${data.id}!`)
                    this.activityIndicatorRef.nativeElement.busy = false
                }
            })
        }
    }

    onBusyChanged($event) {
        if ($event.object.busy) {
            this.zone.runOutsideAngular(() => this.nfc.doStartTagListener(this.setNfcMark.bind(this)))
        } else {
            this.nfc.doStopTagListener()
        }
    }
}
