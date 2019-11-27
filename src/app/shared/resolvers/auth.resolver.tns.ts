import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router'
import {AuthService} from "@src/app/mobile/services/auth.service"
import {RouterExtensions} from "nativescript-angular"
import {Observable} from "rxjs"

@Injectable()
export class AuthResolve implements CanActivate {
    constructor(private auth: AuthService, private routerExtensions: RouterExtensions) {
    }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        if (this.auth.user) {
            this.routerExtensions.navigate(['/home'])
            return false
        }
        return true
    }
}
