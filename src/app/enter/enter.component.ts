import {Component, OnDestroy, OnInit} from '@angular/core'
import {Page} from "tns-core-modules/ui/page"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {TextField} from "tns-core-modules/ui/text-field"
import * as firebase from 'nativescript-plugin-firebase'
import {VerificationObservableModel} from "@src/app/mobile/observable/verification-custom-observable"
firebase["requestPhoneAuthVerificationCode"] = onRequestPhoneAuthVerificationCode;

const verificationObservable: VerificationObservableModel = new VerificationObservableModel()

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
  phoneNumber: string = '9603273301'

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

  getPhone() {
    return this.phoneNumber
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
}
