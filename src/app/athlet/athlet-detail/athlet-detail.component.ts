import {Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {Nfc, NfcTagData} from 'nativescript-nfc'
import {RouterExtensions} from 'nativescript-angular'
import {firestore} from 'nativescript-plugin-firebase'
import {ActivatedRoute} from '@angular/router'
import {confirm} from 'tns-core-modules/ui/dialogs'
import {BaseComponent} from "@src/app/shared/base.component"
import {NfcService} from "@src/app/mobile/services/nfc.service"
import {Mark} from "@src/app/shared/interfaces/mark"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {SqliteService} from "@src/app/mobile/services/sqlite.service"

const firebase = require('nativescript-plugin-firebase/app')
const phone = require("nativescript-phone")

@Component({
    selector: 'app-athlet-detail',
    templateUrl: './athlet-detail.component.html',
    styleUrls: ['./athlet-detail.component.scss']
})
export class AthletDetailComponent extends BaseComponent implements OnInit, OnDestroy {
    private unsubscribe: any
    athlet: Athlet
    tap_remove_index: number | null
    checkpoint: Checkpoint
    collection: firestore.CollectionReference = firebase.firestore().collection('athlets')

    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                private zone: NgZone,
                private activeRoute: ActivatedRoute,
                private nfc: NfcService,
                private options: SqliteService
    ) {
        super(routerExtensions)
    }

    ngOnInit() {
        this.athlet = this.activeRoute.snapshot.data['athlet']
        if (this.options.hasCp()) {
            this.checkpoint = this.options.getCp()
        }

        this.unsubscribe = this.collection.doc(this.athlet.id).onSnapshot({includeMetadataChanges: true}, (doc: firestore.DocumentSnapshot) => {
            if (doc.exists) {
                this.athlet = {...doc.data()} as Athlet
            }
        })
    }

    ngOnDestroy(): void {
        this.nfc.doStopTagListener()
        this.unsubscribe()
    }

    setNfcId(data: NfcTagData) {
        let batch = firebase.firestore().batch()
        const athlets = this.collection.where('nfc_id', '==', data.id).get()

        athlets.then((snapshot: firestore.QuerySnapshot) => {
            snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                batch = batch.update(this.collection.doc(doc.id), {nfc_id: null})
            })
            batch.update(this.collection.doc(this.athlet.id), {
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
                this.collection.doc(this.athlet.id).update({
                    nfc_id: null
                }).then(() => {
                    this.athlet.nfc_id = null
                })
            }
        })
    }

    onRemoveCp($event: any, mark: Mark): void {
        this.tap_remove_index = $event.index
        setTimeout(() => {
                this.tap_remove_index = null
            }
        , 500)

        if (!this.checkpoint) {
            alert(`This device is't manage any checkpoint`)
            return
        } else {
            if (mark.order == this.checkpoint.order) {
                const options = {
                    title: '',
                    message: `Удалить прохождени отметки ${this.checkpoint.title}`,
                    okButtonText: 'Да',
                    cancelButtonText: 'Нет',
                }
                confirm(options).then((result: boolean) => {
                    if (result) {
                        const new_checkpoints: Array<Mark> = this.athlet.checkpoints.filter((item: Mark) => {return item.order != mark.order})

                        if (new_checkpoints.length != this.athlet.checkpoints.length) {
                            firestore.collection('athlets').doc(this.athlet.id).update({
                                checkpoints: new_checkpoints
                            })
                        }
                    }
                })
            } else {
                alert(`This device is't manage checkpoint ${mark.key}`)
            }
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
