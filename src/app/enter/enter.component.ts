import {Component, NgZone, OnDestroy, OnInit} from '@angular/core'
import {Page} from "tns-core-modules/ui/page"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {ModalDialogParams} from "nativescript-angular"
import {AuthStateChangeListener} from "nativescript-plugin-firebase"

const firebase = require("nativescript-plugin-firebase")


@Component({
  selector: 'app-enter',
  templateUrl: './enter.component.html',
})
export class EnterComponent implements OnInit, OnDestroy {

  private authListener2 = {
    onAuthStateChanged: (data) => {
      this.zone.run(() => {
        if (data.loggedIn) {
          this.modalDialogParams.closeCallback()
        }
      })
    },
    thisArg: this
  } as AuthStateChangeListener

  constructor(private page: Page,
              private modalDialogParams: ModalDialogParams,
              private zone: NgZone,
              public auth: AuthService) {
    firebase.addAuthStateListener(this.authListener2)
  }

  ngOnInit() {
    console.log('>>> EnterComponent ngOnInit')
    this.page.actionBarHidden = true;
  }

  ngOnDestroy(): void {
    console.log('>>> EnterComponent ngOnDestroy')
    firebase.removeAuthStateListener(this.authListener2)
  }
}
