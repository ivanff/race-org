import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {first, map, tap} from "rxjs/operators"
import {AngularFireAuth} from "@angular/fire/auth"
import {AuthService} from "@src/app/web/core"

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private afAuth: AngularFireAuth,
                private auth: AuthService,
                private router: Router) {
    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | boolean {

        if (this.auth.user) {
            return true
        }

        return this.afAuth.authState.pipe(
            first(),
            map(user => !!user),
            tap(loggedIn => {
                if (!loggedIn) {
                    console.log("access denied")
                    this.router.navigate(['/auth/login']);
                }
            }),
        )
    }
}
