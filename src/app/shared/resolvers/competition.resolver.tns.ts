import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {getString, hasKey} from "tns-core-modules/application-settings"
import {Competition} from "@src/app/shared/interfaces/competition"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {device} from "tns-core-modules/platform"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {first, map} from "rxjs/operators"
import {Observable} from "rxjs"

const firebase = require("nativescript-plugin-firebase")

@Injectable()
export class CompetitionResolve implements Resolve<Competition | null> {

    constructor(private auth: AuthService, private competition: CompetitionService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Competition | null> | Observable<Competition | null> {
        if (route.params.hasOwnProperty('competition_id')) {
            return firebase.firestore.collection('competitions').doc(route.params['competition_id']).get().then((doc: firebase.firestore.DocumentSnapshot) => {
                const id = doc.id
                const competition = {id, ...doc.data()} as Competition
                if (competition.user == this.auth.user.uid) {
                    return competition
                } else if (competition.mobile_devices.filter((item: MobileDevice) => item.uuid == device.uuid).length) {
                    return competition
                } else {
                    return null
                }
            })
        } else if (hasKey('selected_competition_id')) {
            this.competition.selected_competition_id$.next(getString('selected_competition_id'))
            return this.competition.selected_competition_id$.pipe(
                first()
            )
        } else {
            return Promise.resolve().then(() => null)
        }
    }
}
