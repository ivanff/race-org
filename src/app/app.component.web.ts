import {AfterViewInit, Component, OnInit} from '@angular/core'
import {PreloaderService} from "@src/app/web/core"

@Component({
    selector: 'app-root',
    template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit, AfterViewInit {
    constructor(private preloader: PreloaderService) {}

    ngOnInit() {}

    ngAfterViewInit() {
        this.preloader.hide();
    }
}
