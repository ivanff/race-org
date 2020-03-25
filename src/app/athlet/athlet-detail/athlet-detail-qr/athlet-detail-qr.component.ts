import {Component, OnDestroy, OnInit} from '@angular/core'
import {ModalDialogParams} from "nativescript-angular"
import {QRCode} from "qrcode-generator-ts"
import * as application from "@nativescript/core/application"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Competition} from "@src/app/shared/interfaces/competition"
import {QrAthlet} from "@src/app/shared/interfaces/qr"
import {ImageSource} from "@nativescript/core/image-source"

@Component({
    selector: 'app-athlet-detail-qr',
    templateUrl: './athlet-detail-qr.component.html',
})
export class AthletDetailQrComponent implements OnInit, OnDestroy {
    athlet: Athlet
    competition: Competition
    imageFromBase64 = null

    constructor(private _params: ModalDialogParams) {
        this.athlet = _params.context.athlet
        this.competition = _params.context.competition
        const qr = new QRCode()
        qr.setTypeNumber(5)
        qr.addData(JSON.stringify({
            id: this.athlet.id,
            number: this.athlet.number,
            competition_id: this.competition.parent_id || this.competition.id
        } as QrAthlet))
        qr.make()

        this.imageFromBase64 = ImageSource.fromBase64Sync(qr.toDataURL(10).replace('data:image/gif;base64,', ''))
    }

    private basePassed(args: any): void {
        args.cancel = true
        args.stopEvent = true
        this.onClose()
    }

    ngOnInit() {
        console.log('>> CompetitionDetailQrComponent ngOnInit')
        application.android.on(application.AndroidApplication.activityBackPressedEvent, this.basePassed, this)
    }

    ngOnDestroy(): void {
        console.log('>> CompetitionDetailQrComponent ngOnDestroy')
        application.android.off(application.AndroidApplication.activityBackPressedEvent, this.basePassed, this)
    }

    onClose(): void {
        this._params.closeCallback();
    }
}
