import { Component, OnInit } from '@angular/core';
import {Item} from "@src/app/scan/local-log/item"
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"
import {SettingsService} from "@src/app/shared/settings.service"

@Component({
  selector: 'app-local-log',
  templateUrl: './local-log.component.html',
  styleUrls: ['./local-log.component.scss']
})
export class LocalLogComponent extends BaseComponent implements  OnInit {
  items: Array<Item> = []
  pending: boolean = false

  constructor(public routerExtensions: RouterExtensions, private app_settings: SettingsService) {
    super(routerExtensions)
  }

  ngOnInit() {
    this.pending = this.app_settings.fetch().then((items: Array<Item>) => this.items = [...items]).pending
  }

}
