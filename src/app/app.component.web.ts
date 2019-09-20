import {Component, NgZone, OnInit} from '@angular/core'
import {ActivatedRoute, ChildActivationEnd, Router} from "@angular/router"
import {filter, take} from "rxjs/operators"

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    private _activatedUrl: string

    constructor(public zone: NgZone,
                private router: Router,
                private route: ActivatedRoute) {
        this.router.events.pipe(
            filter((event:any) => event instanceof ChildActivationEnd),
        ).subscribe((event: ChildActivationEnd) => {
            this._activatedUrl = event.snapshot['_routerState'].url
        })
    }

    ngOnInit(): void {}
}
