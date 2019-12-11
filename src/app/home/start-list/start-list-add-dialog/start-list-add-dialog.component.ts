import {
    Component,
    OnInit,
} from '@angular/core'
import {ModalDialogParams} from "nativescript-angular"
import {TextField} from "tns-core-modules/ui/text-field"
import * as application from "tns-core-modules/application"


@Component({
    selector: 'app-start-list-add-dialog',
    templateUrl: './start-list-add-dialog.component.html',
    styleUrls: ['./start-list-add-dialog.component.scss']
})
export class StartListAddDialogComponent implements OnInit {
    private size: number
    constructor(private _params: ModalDialogParams) {
    }

    ngOnInit() {
        console.log('>> StartListAddDialogComponent ngOnInit')
        application.android.on(application.AndroidApplication.activityBackPressedEvent, this.basePassed, this)
    }

    ngOnDestroy(): void {
        console.log('>> StartListAddDialogComponent ngOnDestroy')
        application.android.off(application.AndroidApplication.activityBackPressedEvent, this.basePassed, this)
    }

    onSizeChange($event): void {
        const textField = <TextField>$event.object
        this.size = parseInt(textField.text)
    }

    onSplitBySize(): void {

    }

    onSplitByStage(): void {

    }

    onAddGroup(): void {

    }

    private basePassed(args: any): void {
        args.cancel = true
        args.stopEvent = true
        this.onClose()
    }

    onClose(): void {
        this._params.closeCallback();
    }
}
