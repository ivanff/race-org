import {
    Component
} from '@angular/core'
import {ModalDialogParams} from "nativescript-angular"
import {TextField} from "@nativescript/core/ui/text-field"
import {DialogComponent} from "@src/app/shared/dialog.component"
import {groupNumberMatch, sortNumber} from "@src/app/shared/helpers"


@Component({
    selector: 'app-start-list-add-dialog',
    templateUrl: './start-list-add-dialog.component.html'
})
export class StartListAddDialogComponent extends DialogComponent {
    size: number

    constructor(public params: ModalDialogParams) {
        super(params)
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
        const groupsKeys: Array<string> = this.params.context['groupsKeys']
        const groupNumbers: Array<number> = groupsKeys.map((item: string) => groupNumberMatch(item)).filter((item) => item > -1).sort(sortNumber)

        let next = 0

        if (groupNumbers.length) {
            next = groupNumbers[groupNumbers.length-1] + 1
        }

        this.onClose({
            action: 'navigate',
            value: ['add', this.params.context['_class'], `${this.params.context['_class']}_${next}`]
        })
    }
}
