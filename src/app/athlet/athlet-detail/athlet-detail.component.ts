import {Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core'
import {NfcTagData} from 'nativescript-nfc'
import {RouterExtensions} from 'nativescript-angular'
import {firestore} from 'nativescript-plugin-firebase'
import {ActivatedRoute} from '@angular/router'
import {BaseComponent} from "@src/app/shared/base.component"
import {NfcService} from "@src/app/mobile/services/nfc.service"
import {Mark} from "@src/app/shared/interfaces/mark"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {localize as L} from "nativescript-localize"
import {CompetitionDetailQrComponent} from "@src/app/home/competition/competition-detail/competition-detail-qr/competition-detail-qr.component"
import {ModalDialogOptions, ModalDialogService} from "nativescript-angular"
import {action} from "@nativescript/core/ui/dialogs"
import {GET_OFF} from "@src/app/shared/helpers"

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
    checkpoints: { [key: number]: Checkpoint } = {}
    actions = false
    private unsubscribe: any
    private collection: firestore.CollectionReference

    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                private snackbar: SnackbarService,
                private zone: NgZone,
                private activeRoute: ActivatedRoute,
                private _modalService: ModalDialogService,
                private _vcRef: ViewContainerRef,
                public nfc: NfcService,
                public _competition: CompetitionService
    ) {
        super(routerExtensions)
        this.actions = this.activeRoute.snapshot.data['actions']
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
                this.athlet = {id, ...doc.data()} as Athlet
            }
        })
    }

    ngOnDestroy(): void {
        this.nfc.doStopTagListener()
        if (this.unsubscribe) {
            this.unsubscribe()
        }
    }

    getMarks(): Array<Mark> {
        return this.athlet.marks
            .filter((item: Mark) => item.competition_id == this._competition.selected_competition.id)
            .sort((a, b) => a.created > b.created ? -1 : a.created < b.created ? 1 : 0)
    }

    getGroup(): string {
        if (this.athlet.group) {
            if (this.athlet.group.hasOwnProperty(this._competition.selected_competition.id)) {
                return this.athlet.group[this._competition.selected_competition.id].id
            }
        }
        return L('not assigned')
    }

    setNfcId(data: NfcTagData) {
        let batch = firebase.firestore().batch()
        const athlets = this.collection.where('nfc_id', '==', data.id).get()
        const batchCommit = () => {
            batch.commit().then(() => {
                this.snackbar.success(
                    L('NFC tag is assigned')
                )
                this.athlet.nfc_id = data.id
            }).then(res => this.activityIndicatorRef.nativeElement.busy = false).catch(error => {
                this.snackbar.alert(
                    L('Batch commit error: %s', error)
                )
            })
        }

        athlets.then((snapshot: firestore.QuerySnapshot) => {
            let replacedAthlet: Athlet | null = null

            snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                if (doc.exists) {
                    const id = doc.id
                    replacedAthlet = {id, ...doc.data()} as Athlet
                    batch = batch.update(this.collection.doc(doc.id), {
                        nfc_id: null
                    })
                }
            })
            batch.update(this.collection.doc(this.athlet.id), {
                nfc_id: data.id
            })

            this.activityIndicatorRef.nativeElement.busy = false

            if (replacedAthlet) {
                this.snackbar.confirm(L("This nfc tag is already assigned to %s (%s)", replacedAthlet.fio, replacedAthlet.phone.toString())).then((result: boolean) => {
                    if (result) {
                        batchCommit()
                    } else {
                        this.snackbar.warning(L("Canceled"))
                    }
                })
            } else {
                batchCommit()
            }
        })
    }

    onClearNfc() {
        this.snackbar.confirm(L('Clear NFC tag')).then((result: boolean) => {
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
            this.snackbar.alert(L('This device is\'t READER in current competition!'))
            return
        } else {
            if (mark.order == this.current_checkpoint.order) {
                this.snackbar.confirm(L('Delete the passage of the mark %s', this.current_checkpoint.title)).then((result: boolean) => {
                    if (result) {
                        const marks: Array<Mark> = this.athlet.marks.filter((item: Mark) => {
                            return item.created != mark.created
                        })
                        if (marks.length != this.athlet.marks.length) {
                            this.collection.doc(this.athlet.id).update({
                                marks: marks
                            })
                        }
                    }
                })
            } else {
                this.snackbar.alert(L('This device is\'t manage checkpoint', mark.key))
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

    onGetOff(): void {
        action({
            message: L("Reason for the absence"),
            cancelButtonText: L("Cancel"),
            actions: [
                L('Allowed (AAA)'),
                L("Did Not Start (DNS)"),
                L("Did Not Finish (DNF)"),
                L("Disqualified (DSQ)"),
            ]
        }).then((result: string | null) => {
            let get_off = undefined
            if (result.indexOf('DNS') >= 0) {
                get_off = 'DNS'
            } else if (result.indexOf('DNF') >= 0) {
                get_off = 'DNF'
            } else if (result.indexOf('DSQ') >= 0) {
                get_off = 'DSQ'
            } else if (result.indexOf('AAA') >= 0) {
                get_off = null
            }

            if (get_off !== undefined) {
                this.collection.doc(this.athlet.id).update({
                    get_off: get_off
                })
            }
        })
    }

    getOffStatus(): string {
        return this.athlet.get_off ? GET_OFF[this.athlet.get_off] : L("Allowed")
    }

    onTapQr(): void {
        const options: ModalDialogOptions = {
            viewContainerRef: this._vcRef,
            context: {
                athlet: this.athlet,
            },
            fullscreen: true
        };

        this._modalService.showModal(CompetitionDetailQrComponent, options)
    }
}
