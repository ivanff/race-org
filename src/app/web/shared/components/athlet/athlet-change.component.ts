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
        console.log(
            this.athlet
        )
        this.allowed.push(this.athlet.number)
        super.ngOnInit()
        this.registerForm.addControl('get_off', new FormControl(this.athlet.get_off))
        this.registerForm.removeControl('phone')
        this.registerForm.removeControl('code')
        this.registerForm.removeControl('captcha')
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
