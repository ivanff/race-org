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
    size: number
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
        this._params.closeCallback({
            action: 'size',
            value: this.size
        });
    }

    onSplitByStage(): void {
        this._params.closeCallback({
            action: 'stage',
            value: this.size
        });
    }

    onAddGroup(): void {
        this._params.closeCallback({
            action: 'navigate',
            value: ['add', this._params.context['_class'], `${this._params.context['_class']}_${this._params.context['groupsCount']}`]
        })
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
