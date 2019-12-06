import {Component, OnInit} from '@angular/core'
import {
    FormGroupDirective,
} from "@angular/forms"
import {AthletRegisterComponent} from "@src/app/web/shared/components/athlet/athlet-register.component"

@Component({
    selector: 'athlet-add',
    templateUrl: './athlet-register.component.html',
    styleUrls: ['./athlet-register.component.scss']
})
export class AthletAddComponent extends AthletRegisterComponent implements OnInit {
    hasSubmitButton = false

    ngOnInit() {
        super.ngOnInit()
        this.registerForm.removeControl('code')
        this.registerForm.removeControl('captcha')
    }

    onPhoneInput(): void {
    }

    onSave(model, is_valid: boolean, formDirective?: FormGroupDirective): void {
        super.onSave(model, is_valid)
    }
}
