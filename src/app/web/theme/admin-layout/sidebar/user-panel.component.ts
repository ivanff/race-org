import { Component } from '@angular/core';
import {Router} from "@angular/router"
import {AuthService} from "@src/app/web/core"

@Component({
  selector: 'app-user-panel',
  template: `
    <div
      class="matero-user-panel p-y-16 b-t-1 b-b-1"
      fxLayout="column"
      fxLayoutAlign="center center"
    >
      <h4 class="matero-user-panel-name m-t-0 m-b-8 f-w-400">{{auth.user.displayName}}</h4>
      <h5 class="matero-user-panel-email m-t-0 m-b-8 f-w-400">{{auth.user.email || auth.user.phoneNumber}}</h5>
      <div class="matero-user-panel-icons text-nowrap">
<!--        <a routerLink="/profile/overview" mat-icon-button>-->
<!--          <mat-icon class="icon-18">account_circle</mat-icon>-->
<!--        </a>-->
        <a routerLink="/profile/settings" mat-icon-button>
          <mat-icon class="icon-18">settings</mat-icon>
        </a>
        <a (click)="onLogout()" mat-icon-button>
          <mat-icon class="icon-18">exit_to_app</mat-icon>
        </a>
      </div>
    </div>
  `,
})
export class UserPanelComponent {
  constructor(private route: Router, public auth: AuthService) {
  }

  onLogout() {
    this.auth.logout().then(() => {
      this.route.navigate(['/auth/login'])
    })
  }



}
