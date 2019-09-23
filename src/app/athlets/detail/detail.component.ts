import {Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {Nfc, NfcTagData} from 'nativescript-nfc'
import {RouterExtensions} from 'nativescript-angular'
import {firestore} from 'nativescript-plugin-firebase'
import {ActivatedRoute} from '@angular/router'
import {confirm} from 'tns-core-modules/ui/dialogs'
import {EventData} from 'tns-core-modules/data/observable'
import {BaseComponent} from "@src/app/shared/base.component"
import {Athlet} from "@src/app/home/athlet"
import {NfcService} from "@src/app/shared/nfc.service"
import {Mark} from "@src/app/home/mark"
import {getString} from "tns-core-modules/application-settings"

const firebase = require('nativescript-plugin-firebase/app')
const phone = require( "nativescript-phone" )

@Component({
    selector: 'app-detail',
    templateUrl: './detail.component.html',
    styleUrls: ['./detail.component.scss']
})
export class DetailComponent extends BaseComponent implements OnInit, OnDestroy {
    athlet: Athlet
    tap_remove_index: number
    cp: string
    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                private zone: NgZone,
                private activeRoute: ActivatedRoute,
                private nfc: NfcService
    ) {
        super(routerExtensions)
        this.athlet = this.activeRoute.snapshot.data['athlet']
        this.cp = getString('cp')
    }

    ngOnInit() {}

    ngOnDestroy(): void {
        this.nfc.doStopTagListener()
    }

    setNfcId(data: NfcTagData) {
        let batch = firebase.firestore().batch()
        const collection = firebase.firestore().collection('athlets')
        const athlets = collection.where('nfc_id', '==', data.id).get()

        athlets.then((snapshot: firestore.QuerySnapshot) => {
            snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                batch = batch.update(collection.doc(doc.id), {nfc_id: null})
            })
            batch.update(collection.doc(this.athlet.phone + ''), {
                nfc_id: data.id
            })

            this.activityIndicatorRef.nativeElement.busy = false
            batch.commit().then(() => {
                alert('Nfc метка назначена')
                this.athlet.nfc_id = data.id
            }).then(res => this.activityIndicatorRef.nativeElement.busy = false).catch(error => {
                console.log('Batch error: ' + error)
            })
        })
    }

    onClearNfc() {
        const options = {
            title: '',
            message: 'Очистить nfc метку',
            okButtonText: 'Yes',
            cancelButtonText: 'No',
        }
        confirm(options).then((result: boolean) => {
            if (result) {
                firebase.firestore().collection('athlets').doc(this.athlet.phone + '').update({
                    nfc_id: null
                }).then(() => {
                    this.athlet.nfc_id = null
                })
            }
        })
    }

    onRemoveCp($event: EventData, i: number): void {
        this.tap_remove_index = i
        const mark: Mark = this.athlet.checkpoints[i]
        if (mark.key == this.cp) {
            const options = {
                title: '',
                message: `Удалить прохождени отметки ${mark.key}`,
                okButtonText: 'Да',
                cancelButtonText: 'Нет',
            }
            confirm(options).then((result: boolean) => {
                if (result) {
                    const checkpoints: Array<Mark> = this.athlet.checkpoints
                    checkpoints.splice(i, 1)
                    firestore.collection('athlets').doc(this.athlet.phone + '').update({
                        checkpoints: checkpoints
                    })
                }
            })
        } else {
            alert(`This device is't manage checkpoint ${mark.key}`)
        }
    }

    onBusyChanged($event): void {
        if ($event.object.busy) {
            this.zone.runOutsideAngular(() => this.nfc.doStartTagListener(this.setNfcId.bind(this)))
        } else {
            this.nfc.doStopTagListener()
        }
    }

    onPhone(): void {
        phone.dial('+7' + this.athlet.phone)
    }
    onSms(): void {
        phone.sms('+7' + this.athlet.phone)
    }
}
