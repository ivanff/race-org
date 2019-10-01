import {Injectable} from '@angular/core'
import {ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router'
import {MatDialog} from "@angular/material"
import {AdminPromptComponent} from "@src/app/web/access/admin-prompt/admin-prompt.component"
import {LocalStorageService} from "angular-2-local-storage"


@Injectable()
export class AdminResolve implements Resolve<any> {
    constructor(private dialog: MatDialog,
                private route: Router,
                private activeRoute: ActivatedRoute,
                private _localStorageService: LocalStorageService) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot,): Promise<any> {
        return new Promise((resolve, reject): boolean => {
            if (this._localStorageService.get('admin_code') === '1987') {
                resolve(true)
                return
            }

            const dialogRef = this.dialog.open(AdminPromptComponent, {
                width: '250px',
                data: {}
            })
            dialogRef.afterClosed().subscribe(result => {
                if (result == '1987') {
                    resolve(true)
                    this._localStorageService.set('admin_code', result)
                } else {
                    reject("code is't valid")
                }
            })
        }).then((result) => {return result}, (err) => {
            this.route.navigate([this.route.url], {relativeTo: this.activeRoute})
        })
    }
}
