import {Component, OnDestroy, OnInit} from "@angular/core"
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"

@Component({
    templateUrl: './start-list.component.tns.html'
})
export class StartListComponent extends BaseComponent implements OnInit, OnDestroy {

    constructor(public routerExtensions: RouterExtensions) {
        super(routerExtensions)
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }

}
