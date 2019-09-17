import {Component, OnInit} from '@angular/core';
import {RouterExtensions} from "nativescript-angular"
import {ActivatedRoute} from "@angular/router"

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html',
    styleUrls: ['./root.component.scss']
})
export class RootComponent implements OnInit {

    constructor(private _routerExtensions: RouterExtensions,
                private activeRoute: ActivatedRoute) {
    }

    ngOnInit(): void {
        this._routerExtensions.navigate([{outlets: {root: ["athlets"]}}], {relativeTo: this.activeRoute});
    }

}
