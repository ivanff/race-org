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
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {Competition} from "@src/app/shared/interfaces/competition"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"

const firebase = require('nativescript-plugin-firebase/app')
const phone = require("nativescript-phone")

@Component({
    selector: 'app-athlet-detail',
    templateUrl: './athlet-detail.component.html',
    styleUrls: ['./athlet-detail.component.scss']
})
export class AthletDetailComponent extends BaseComponent implements OnInit, OnDestroy {
    athlet: Athlet
    tap_remove_index: number | null
    current_checkpoint: Checkpoint
    checkpoints: {[key:number]: Checkpoint} = {}
    private unsubscribe: any
    private collection: firestore.CollectionReference

    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                private snackbar: SnackbarService,
                private zone: NgZone,
                private activeRoute: ActivatedRoute,
                private nfc: NfcService,
                private options: SqliteService,
                private _competition: CompetitionService
    ) {
        super(routerExtensions)
        this.collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
        this.current_checkpoint = {...this._competition.current_checkpoint}
        this._competition.selected_competition.checkpoints.forEach((item: Checkpoint) => {
            this.checkpoints[item.order] = item
        })
    }

    ngOnInit() {
        this.athlet = this.activeRoute.snapshot.data['athlet']
        this.unsubscribe = this.collection.doc(this.athlet.id).onSnapshot((doc: firestore.DocumentSnapshot) => {
            if (doc.exists) {
                const id = doc.id
                this.athlet = {id,...doc.data()} as Athlet
            }
        })
    }

    ngOnDestroy(): void {
        this.nfc.doStopTagListener()
        if (this.unsubscribe) {
            this.unsubscribe()
        }
    }

    getCheckpoints(): Array<Mark> {
        return this.athlet.checkpoints.filter((item: Mark) => item.competition_id == this._competition.selected_competition.id)
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
                this.snackbar.success(
                    'Nfc метка назначена'
                )
                this.athlet.nfc_id = data.id
            }).then(res => this.activityIndicatorRef.nativeElement.busy = false).catch(error => {
                this.snackbar.alert(
                    'Batch error: ' + error
                )
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

        if (!this.current_checkpoint) {
            alert(`This device is't manage any checkpoint`)
            return
        } else {
            if (mark.order == this.current_checkpoint.order) {
                const options = {
                    title: '',
                    message: `Удалить прохождени отметки ${this.current_checkpoint.title}`,
                    okButtonText: 'Да',
                    cancelButtonText: 'Нет',
                }
                confirm(options).then((result: boolean) => {
                    if (result) {
                        const new_checkpoints: Array<Mark> = this.athlet.checkpoints.filter((item: Mark) => {return item.created != mark.created})
                        if (new_checkpoints.length != this.athlet.checkpoints.length) {
                            this.collection.doc(this.athlet.id).update({
                                checkpoints: new_checkpoints
                            })
                        }
                    }
                })
            } else {
                this.snackbar.alert(`This device is't manage checkpoint ${mark.key}`)
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
