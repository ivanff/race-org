import {Injectable} from '@angular/core'
import {ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router'
import {MatDialog} from "@angular/material"
import {AdminPromptComponent} from "@src/app/web/access/admin-prompt/admin-prompt.component"


@Injectable()
export class AdminResolve implements Resolve<any> {
    constructor(private dialog: MatDialog, private route: Router, private activeRoute: ActivatedRoute) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot,): Promise<any> {
        return new Promise((resolve, reject) => {
            // resolve(true)
            // return
            const dialogRef = this.dialog.open(AdminPromptComponent, {
                width: '250px',
                data: {}
            })
            dialogRef.afterClosed().subscribe(result => {
                if (result == '1987') {
                    resolve(true)
                } else {
                    reject("code is't valid")
                }
            })
        }).then(() => {}, (err) => {
            this.route.navigate([this.route.url], {relativeTo: this.activeRoute})
        })
    }
}
