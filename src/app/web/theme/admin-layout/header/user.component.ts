import {Component} from '@angular/core';
import {Router} from "@angular/router"
import {AuthService} from "@src/app/web/core"

@Component({
    selector: 'app-user',
    template: `
        <a mat-button href="javascript:void(0)" [matMenuTriggerFor]="menu">
<!--            <img-->
<!--                    class="matero-user-avatar r-full align-middle"-->
<!--                    src="assets/images/avatar.jpg"-->
<!--                    width="24"-->
<!--                    alt="avatar"-->
<!--            />-->
            <span class="align-middle">
                {{auth.user.displayName || auth.user.email || auth.user.phoneNumber}}
            </span>
        </a>

        <mat-menu #menu="matMenu">
<!--            <a routerLink="/profile/overview" mat-menu-item>-->
<!--                <mat-icon>account_circle</mat-icon>-->
<!--                <span>Profile</span>-->
<!--            </a>-->
            <a routerLink="/profile/settings" mat-menu-item>
                <mat-icon>settings</mat-icon>
                <span>Settings</span>
            </a>
            <a (click)="onLogout()" mat-menu-item>
                <mat-icon>exit_to_app</mat-icon>
                <span>Logout</span>
            </a>
        </mat-menu>
    `,
})
export class UserComponent {
    constructor(private route: Router, public auth: AuthService) {

    }

    onLogout() {
        this.auth.logout().then(() => {
          this.route.navigate(['/auth/login'])
        })
    }
}
