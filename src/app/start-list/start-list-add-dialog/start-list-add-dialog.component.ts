import {
    Component
} from '@angular/core'
import {ModalDialogParams} from "nativescript-angular"
import {TextField} from "@nativescript/core/ui/text-field"
import {DialogComponent} from "@src/app/shared/dialog.component"


@Component({
    selector: 'app-start-list-add-dialog',
    templateUrl: './start-list-add-dialog.component.html'
})
export class StartListAddDialogComponent extends DialogComponent {
    size: number

    constructor(public _params: ModalDialogParams) {
        super(_params)
    }

    onSizeChange($event): void {
        const textField = <TextField>$event.object
        this.size = parseInt(textField.text)
    }

    onSplitBySize(): void {
        this.onClose({
            action: 'size',
            value: this.size
        })
    }

    onSplitByStage(): void {
        this.onClose({
            action: 'stage',
            value: this.size
        })
    }

    onAddGroup(): void {
        this.onClose({
            action: 'navigate',
            value: ['add', this._params.context['_class'], `${this._params.context['_class']}_${this._params.context['groupsCount']}`]
        })
    }
}
