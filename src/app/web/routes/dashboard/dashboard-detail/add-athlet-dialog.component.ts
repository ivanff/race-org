import {Component, Inject, ViewChild} from "@angular/core"
import {MAT_DIALOG_DATA, MatDialogRef, MatSnackBar} from "@angular/material"
import {AthletAddComponent} from "@src/app/web/shared/components/athlet/athlet-add.component"
import {FormGroupDirective} from "@angular/forms"
import {Athlet} from "@src/app/shared/interfaces/athlet"

@Component({
    selector: 'add-athlet-dialog',
    templateUrl: './add-athlet-dialog.component.html',
})
export class AddAthletDialogComponent {
    valid = false

    @ViewChild(AthletAddComponent, {static: false})
    private athletAddComponent: AthletAddComponent

    constructor(private dialogRef: MatDialogRef<AddAthletDialogComponent>,
                private _snackBar: MatSnackBar,
                @Inject(MAT_DIALOG_DATA) public data: any) { }

    onCreated($event: { athlet: Athlet, form: FormGroupDirective }): void {
        this._snackBar.open("Атлет добавлен", `${$event.athlet.fio}`, {
            duration: 5000,
            verticalPosition: "top",
            panelClass: 'snack-bar-success'
        })
        this.athletAddComponent.registerForm.reset()
        this.dialogRef.close()
    }

    onSave(model, is_valid: boolean): void {
        this.athletAddComponent.onSave(model, is_valid)
    }

    closeDialog(): void {
        this.dialogRef.close()
    }
}
