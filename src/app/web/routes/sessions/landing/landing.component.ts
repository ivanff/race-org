import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AuthService} from "@src/app/web/core/services/auth.service"
import {Router} from "@angular/router"

@Component({
    selector: 'app-landing',
    templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit, AfterViewInit {
    constructor(private auth: AuthService, private route: Router) {
    }

    ngOnInit() {
        if (this.auth.user) {
            this.route.navigate(['/cabinet'], {
                replaceUrl: true
            });
        }
    }

    ngAfterViewInit() {
    }
}
