import {Component, OnDestroy, OnInit} from '@angular/core'
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"
import * as appversion from "nativescript-appversion"
import {openUrl} from "@nativescript/core/utils/utils"
import {ActivatedRoute} from "@angular/router"

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
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

    ngOnInit(): void {
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
