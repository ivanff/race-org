import {Component, OnDestroy, OnInit} from '@angular/core'
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"
import * as appversion from "nativescript-appversion"
import {openUrl} from "tns-core-modules/utils/utils"

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends BaseComponent implements OnInit, OnDestroy {
    pending: boolean = false
    version = ''

    constructor(public routerExtensions: RouterExtensions) {
        super(routerExtensions)
        appversion.getVersionName().then((v: string) => {
            this.version = v
        })
    }

    ngOnInit() {
    }

    ngOnDestroy(): void {
    }

    navigateTo(path: string, extras?: any): void {
        this.routerExtensions.navigate([path], extras)
    }

    goTo(url: string): void {
        openUrl(url)
    }
}
