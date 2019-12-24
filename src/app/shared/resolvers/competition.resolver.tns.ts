import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {getString, hasKey} from "@nativescript/core/application-settings"
import {Competition} from "@src/app/shared/interfaces/competition"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {device} from "@nativescript/core/platform"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {catchError, first, tap} from "rxjs/operators"
import {Observable, of} from "rxjs"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {localize as L} from "nativescript-localize"


@Injectable()
export class CompetitionResolve implements Resolve<Competition | null> {

    constructor(private auth: AuthService,
                private _competition: CompetitionService,
                private snackbar: SnackbarService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Competition | null> | Observable<Competition | null> {
        if (route.params.hasOwnProperty('competition_id')) {
            let obs: any = null

            if (route.params.hasOwnProperty('parent_competition_id')) {
                obs = this._competition.firestoreCollectionObservable(
                    route.params['parent_competition_id'],
                    route.params['competition_id']
                )
            } else {
                obs = this._competition.firestoreCollectionObservable(
                    route.params['competition_id']
                )
            }

            return obs.pipe(
                first(),
                tap((competition: Competition| null) => {
                    if (competition) {
                        if (competition.user == this.auth.user.uid) {
                            return competition
                        } else if (competition.mobile_devices.filter((item: MobileDevice) => item.uuid == device.uuid).length) {
                            return competition
                        } else {
                            throw(L("Permission deny to competition"))
                        }
                    } else {
                        throw(L("Competition not found"))
                    }
                }),
                catchError((error) => {
                    this.snackbar.alert(error)
                    return of(null)
                })
            )
        } else if (hasKey('selected_competition_id')) {
            console.log(
                'selected_competition_id',
                getString('selected_competition_id')
            )
            const selected_competition_ids: Array<string> = getString('selected_competition_id').split('_')
            this._competition.selected_competition_id$.next(selected_competition_ids)
            return this._competition.selected_competition_id$.pipe(
                first()
            )
        } else {
            if (route.data.strict) {
                this.snackbar.warning(L("Competitions is't selected"))
                return Promise.reject()
            } else {
                return Promise.resolve().then(() => null)
            }
        }
    }
}
