import {Component, OnInit} from '@angular/core';
import {ModalDialogParams, RouterExtensions} from "nativescript-angular"
import {ActivatedRoute} from "@angular/router"

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html',
    styleUrls: ['./root.component.scss']
})
export class RootComponent implements OnInit {

    constructor(private _routerExtensions: RouterExtensions,
                private activeRoute: ActivatedRoute,
                private params: ModalDialogParams) {
    }

    ngOnInit(): void {
        this._routerExtensions.navigate([{outlets: {root: this.params.context.path}}], {relativeTo: this.activeRoute});
    }

}
