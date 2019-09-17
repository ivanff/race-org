import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {firestore} from 'nativescript-plugin-firebase'
import {getString} from 'tns-core-modules/application-settings'
import {RouterExtensions} from 'nativescript-angular'
import {NfcTagData} from 'nativescript-nfc'
import {BaseComponent} from "@src/app/shared/base.component"
import {Athlet} from "@src/app/home/athlet"
import {NfcService} from "@src/app/shared/nfc.service"
import {Mark} from "@src/app/home/mark"
import {CheckPoint} from "@src/app/home/checkpoint"
import {device} from "tns-core-modules/platform"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-scan',
    templateUrl: './scan.component.html',
    styleUrls: ['./scan.component.scss']
})
export class ScanComponent extends BaseComponent implements AfterViewInit, OnInit, OnDestroy {
    last_athlet: Athlet
    current_checkpoint: CheckPoint

    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef

    constructor(public routerExtensions: RouterExtensions, private zone: NgZone, public nfc: NfcService) {
        super(routerExtensions)
    }

    ngAfterViewInit() {
        if (this.activityIndicatorRef.nativeElement.busy) {
            this.zone.runOutsideAngular(() => this.nfc.doStartTagListener(this.setNfcId.bind(this)))
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
            }
        })
    }

    ngOnDestroy(): void {
        this.nfc.doStopTagListener()
    }

    setNfcId(data: NfcTagData) {
        const athlets = firebase.firestore().collection('athlets')
            .where('nfc_id', '==', data.id).get()
        athlets.then((snapshot: firestore.QuerySnapshot) => {
            const key: string = getString('cp')
            if (snapshot.docs.length === 1) {
                if (key) {
                    snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                        this.last_athlet = doc.data() as Athlet
                        const checkpoints: Array<any> = this.last_athlet.checkpoints
                        alert(this.last_athlet.fio)
                        checkpoints.push({
                            key: key,
                            created: new Date()
                        } as Mark)
                        firebase.firestore().collection('athlets').doc(doc.id).update({
                            checkpoints: checkpoints
                        }).then(() => {
                            this.activityIndicatorRef.nativeElement.busy = false
                        }, (err) => {
                            this.activityIndicatorRef.nativeElement.busy = false
                        })
                    })
                } else {
                    alert('Checkpoint isn\'t setup')
                    this.activityIndicatorRef.nativeElement.busy = false
                }
            } else {
                alert(`Athlet is\'t found which has NFC tag ${data.id}`)
                this.activityIndicatorRef.nativeElement.busy = false
            }
        })
    }

    onBusyChanged($event) {
        if ($event.object.busy) {
            this.zone.runOutsideAngular(() => this.nfc.doStartTagListener(this.setNfcId.bind(this)))
        } else {
            this.nfc.doStopTagListener()
        }
    }
}
