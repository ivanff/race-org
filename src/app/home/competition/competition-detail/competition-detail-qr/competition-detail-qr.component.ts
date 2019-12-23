import {Component, OnDestroy, OnInit} from '@angular/core'
import {ModalDialogParams} from "nativescript-angular"
import {fromBase64} from "@nativescript/core/image-source"
import {QRCode} from "qrcode-generator-ts"
import * as application from "@nativescript/core/application"

@Component({
    selector: 'app-competition-detail-qr',
    templateUrl: './competition-detail-qr.component.html',
})
export class CompetitionDetailQrComponent implements OnInit, OnDestroy {
    code: number
    role: string
    imageFromBase64 = null

    constructor(private _params: ModalDialogParams) {
        this.role = _params.context.role
        this.code = _params.context.code
        const qr = new QRCode()
        qr.setTypeNumber(2)
        qr.addData(this.code.toString())
        qr.make()
        this.imageFromBase64 = fromBase64(qr.toDataURL(10).replace('data:image/gif;base64,', ''))
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
