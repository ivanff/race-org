import {Component} from '@angular/core'
import {RouterExtensions} from 'nativescript-angular'
import {RadSideDrawer} from "nativescript-ui-sidedrawer"
import {getRootView} from "tns-core-modules/application"

@Component({
    selector: 'app-base',
    template: '',
    styleUrls: []
})
export class BaseComponent {

    constructor(public routerExtensions: RouterExtensions) {
    }

    goBack(): void {
        this.routerExtensions.back()
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>getRootView();
        sideDrawer.toggleDrawerState();
    }
}
