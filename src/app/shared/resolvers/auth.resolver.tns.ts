import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, CanActivate, Resolve, Router, RouterStateSnapshot} from '@angular/router'
import {AuthService} from "@src/app/mobile/services/auth.service"
import {RouterExtensions} from "nativescript-angular"
import {Observable} from "rxjs"
import {map, take, tap} from "rxjs/operators"

// @Injectable()
// export class AuthResolve implements Resolve<any> {
//
//     constructor(private auth: AuthService, private routerExtensions: RouterExtensions) {
//     }
//
//     resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
//         return new Promise((resolve, reject) => {
//             if (this.auth.user) {
//                 this.routerExtensions.navigate(['/home'], {clearHistory: true, replaceUrl: true})
//                 reject()
//             } else {
//                 resolve(true)
//             }
//         })
//     }
// }

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
