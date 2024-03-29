import {Component, OnDestroy, OnInit} from '@angular/core'
import {Page} from "@nativescript/core/ui/page"
import {AuthService, verificationObservable} from "@src/app/mobile/services/auth.service"
import {TextField} from "@nativescript/core/ui/text-field"
import * as firebase from 'nativescript-plugin-firebase'

firebase["requestPhoneAuthVerificationCode"] = onRequestPhoneAuthVerificationCode


function onRequestPhoneAuthVerificationCode(onUserResponse: (phoneAuthVerificationCode: string) => void, verificationPrompt: string) {
    verificationObservable.on("onverify", (data) => {
        onUserResponse(data.object.get("verificationCode"));
    });
}

@Component({
    selector: 'app-enter',
    templateUrl: './enter.component.html',
})
export class EnterComponent implements OnInit, OnDestroy {
    phoneNumber: string = ''
    pending: boolean = false

    constructor(private page: Page,
                public auth: AuthService) {
    }

    ngOnInit() {
        console.log('>>> EnterComponent ngOnInit')
        this.page.actionBarHidden = true;
    }

    ngOnDestroy(): void {
        console.log('>>> EnterComponent ngOnDestroy')
    }

    onOverlayDummyTouch() {}

    getPhone() {
        return this.phoneNumber
    }

    googleLogin() {
        this.setPending()
        this.auth.googleLogin().then(() => {
            this.setPending(false)
        }).catch(() => {
            this.setPending(false)
        })
    }

    facebookLogin() {
        this.setPending()
        this.auth.facebookLogin().then(() => {
            this.setPending(false)
        }).catch(() => {
            this.setPending(false)
        })
    }

    onPhoneNumberChange($event) {
        const textField = <TextField>$event.object
        this.phoneNumber = textField.text
    }

    onPhoneNumberLogin(): void {
        if (this.phoneNumber) {
            this.auth.phoneLogin(`+7${this.phoneNumber}`)
        }
    }

    setPending(value: boolean = true) {
        this.pending = value
    }
}
