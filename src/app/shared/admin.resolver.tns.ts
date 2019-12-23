import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {prompt, PromptResult} from "@nativescript/core/ui/dialogs"


@Injectable()
export class AdminResolve implements Resolve<boolean> {
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
        return new Promise((resolve, reject) => {
            prompt("Enter secret key to MANAGE this options", "").then((r: PromptResult) => {
                if (r.text === '1987') {
                    resolve(true)
                } else {
                    reject("Admin code is't right")
                }
            });
        })
    }
}
