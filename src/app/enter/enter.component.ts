import {Component, OnDestroy, OnInit} from '@angular/core'
import {Page} from "tns-core-modules/ui/page"
import {AuthService} from "@src/app/mobile/services/auth.service"


@Component({
  selector: 'app-enter',
  templateUrl: './enter.component.html',
})
export class EnterComponent implements OnInit, OnDestroy {

  constructor(private page: Page, public auth: AuthService) {
  }

  ngOnInit() {
    console.log('>>> EnterComponent ngOnInit')
    this.page.actionBarHidden = true;
  }

  ngOnDestroy(): void {
    console.log('>>> EnterComponent ngOnDestroy')
  }


}
