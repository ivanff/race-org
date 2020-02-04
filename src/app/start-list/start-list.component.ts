import {Component, OnDestroy, OnInit} from "@angular/core"
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"
import {ActivatedRoute} from "@angular/router"

@Component({
    templateUrl: './start-list.component.tns.html'
})
export class StartListComponent extends BaseComponent implements OnInit, OnDestroy {

    constructor(public routerExtensions: RouterExtensions,
                private activeRoute: ActivatedRoute) {
        super(routerExtensions)
    }

    ngOnInit(): void {
        this.routerExtensions.navigate([{outlets: {startList: ['list']}}], {
            relativeTo: this.activeRoute,
            replaceUrl: true,
            clearHistory: true
        })
    }

    ngOnDestroy(): void {
    }
}
