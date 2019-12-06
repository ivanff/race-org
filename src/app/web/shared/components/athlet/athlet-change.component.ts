import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core'
import {
    FormControl,
    FormGroupDirective,
    Validators
} from "@angular/forms"
import {AthletRegisterComponent} from "@src/app/web/shared/components/athlet/athlet-register.component"
import {Athlet} from "@src/app/shared/interfaces/athlet"

@Component({
    selector: 'athlet-change',
    templateUrl: './athlet-register.component.html',
    styleUrls: ['./athlet-register.component.scss']
})
export class AthletChangeComponent extends AthletRegisterComponent implements OnInit, OnChanges {
    @Input() athlet: Athlet

    ngOnInit() {
        super.ngOnInit()
        this.registerForm.removeControl('phone')
        this.registerForm.removeControl('code')
        this.registerForm.removeControl('captcha')
        this.registerForm.setControl('number', new FormControl('', [<any>Validators.required, <any>Validators.min(1), <any>Validators.max(999)], [AthletRegisterComponent.usedValue(this.athlet_collection, 'number', false, [this.athlet.number])]))

        this._fillForm()
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.athlet = {...changes.athlet.currentValue}
        if (this.registerForm) {
            this._fillForm()
        }
    }

    private _fillForm() {
        for (let key in this.registerForm.controls) {
            if (this.athlet.hasOwnProperty(key)) {
                this.registerForm.controls[key].setValue(this.athlet[key])
            }
        }
    }

    onPhoneInput(): void {
    }

    onSave(model, is_valid: boolean, formDirective?: FormGroupDirective): void {
        model.phone = this.athlet.id
        super.onSave(model, is_valid)
    }
}
