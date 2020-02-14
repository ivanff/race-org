import {Component, OnDestroy, OnInit} from "@angular/core"
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"
import {interval, Observable} from "rxjs"
import {map} from "rxjs/operators"
import * as moment from 'moment-timezone'

@Component({
    templateUrl: './start-list.component.tns.html'
})
export class StartListComponent extends BaseComponent implements OnInit, OnDestroy {
    time: Observable<string>

    constructor(public routerExtensions: RouterExtensions) {
        super(routerExtensions)
        this.time = interval(1000).pipe(map((i) => {
            return moment().format('HH:mm:ss')
        }))
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }
}
