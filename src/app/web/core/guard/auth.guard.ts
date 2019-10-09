import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AuthService} from "@src/app/web/core/services/auth.service"
import {map, take, tap} from "rxjs/operators"

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) {
    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | boolean {
        if (this.auth.user) {
            return true;
        }

        return this.auth.currentUserObservable.pipe(
            take(1),
        ).pipe(
            map(user => !!user)
        ).pipe(
            tap(loggedIn => {
                if (!loggedIn) {
                    console.log("access denied")
                    this.router.navigate(['/auth/login']);
                }
            })
        )

    }
}
