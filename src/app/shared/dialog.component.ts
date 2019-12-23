import {ModalDialogParams} from "nativescript-angular"
import * as application from "@nativescript/core/application"
import {OnDestroy, OnInit} from "@angular/core"

export class DialogComponent implements OnInit, OnDestroy {
    constructor(public _params: ModalDialogParams) {
    }

    ngOnInit() {
        console.log('>> DialogComponent ngOnInit')
        application.android.on(application.AndroidApplication.activityBackPressedEvent, this.basePassed, this)
    }

    ngOnDestroy(): void {
        console.log('>> DialogComponent ngOnDestroy')
        application.android.off(application.AndroidApplication.activityBackPressedEvent, this.basePassed, this)
    }

    private basePassed(args: any): void {
        args.cancel = true
        args.stopEvent = true
        this.onClose()
    }

    onClose(args?:any): void {
        this._params.closeCallback(args)
    }
}
