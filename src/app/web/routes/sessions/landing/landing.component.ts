import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AuthService} from "@src/app/web/core/services/auth.service"

@Component({
    selector: 'app-landing',
    templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit, AfterViewInit {
    constructor(private auth: AuthService) {
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
    }
}
