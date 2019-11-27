import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {Observable} from "rxjs"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {RouterExtensions} from "nativescript-angular"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {localize as L} from "nativescript-localize"


@Injectable()
export class CheckpointResolver implements Resolve<Checkpoint | null> {

    constructor(private routerExtension: RouterExtensions,
                private _competition: CompetitionService,
                private snackbar: SnackbarService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Checkpoint | null> | Observable<Checkpoint | null> {
        return new Promise((resolve, reject) => {
            if (this._competition.current_checkpoint) {
                resolve(this._competition.current_checkpoint)
            } else {
                this.snackbar.alert(L("This device is\'t READER in current competition!"))
                reject(null)
                this.routerExtension.navigate(['/home/competitions'])
            }
        })
    }
}
