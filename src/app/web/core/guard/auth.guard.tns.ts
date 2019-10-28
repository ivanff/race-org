import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AuthService} from "@src/app/mobile/services/auth.service"
import {map} from "rxjs/operators"
import {RouterExtensions} from "nativescript-angular"
@Injectable()
export class AuthGuard {
    constructor(private auth: AuthService, private routerExtensions: RouterExtensions) {
    }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (!!this.auth.user) {
            return true
        } else {
            this.routerExtensions.navigate([''])
            return false
        }
    }
}
