import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AuthService} from "@src/app/mobile/services/auth.service"
import {map} from "rxjs/operators"
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService) {
    }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.auth.user$.pipe(
            map((user) => {
                return !!user
            })
        )
    }
}
