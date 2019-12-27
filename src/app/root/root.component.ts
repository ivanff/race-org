import {Component, OnInit} from '@angular/core';
import {ModalDialogParams, RouterExtensions} from "nativescript-angular"
import {ActivatedRoute} from "@angular/router"

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html'
})
export class RootComponent implements OnInit {
    constructor(private routerExtensions: RouterExtensions,
                private activeRoute: ActivatedRoute,
                private params: ModalDialogParams) {
    }
    ngOnInit(): void {
        let extras = {relativeTo: this.activeRoute}
        if (this.params.context.hasOwnProperty('extras')) {
            extras = this.params.context['extras']
        }
        this.routerExtensions.navigate([{outlets: {startList: this.params.context.path}}], extras)
    }
}
