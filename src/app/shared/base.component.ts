import {Component} from '@angular/core'
import {RouterExtensions} from 'nativescript-angular'
import {RadSideDrawer} from "nativescript-ui-sidedrawer"
import {getRootView} from "@nativescript/core/application"
import {ActivatedRoute} from "@angular/router"

@Component({
    selector: 'app-base',
    template: '',
    styleUrls: []
})
export class BaseComponent {

    constructor(public routerExtensions: RouterExtensions) {
    }

    goBack(): void {
        if (this.routerExtensions.canGoBack()) {
            this.routerExtensions.back()
        }
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>getRootView()
        if (sideDrawer) {
            sideDrawer.toggleDrawerState()
        }
    }
}
