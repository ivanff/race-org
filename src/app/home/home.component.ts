import {Component, OnInit} from '@angular/core'
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends BaseComponent implements OnInit {

    constructor(public routerExtensions: RouterExtensions) {
        super(routerExtensions)
    }

    ngOnInit() {
    }
}
