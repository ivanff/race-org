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
import {firestore} from "nativescript-plugin-firebase"

const firebase = require('nativescript-plugin-firebase/app')

@Injectable()
export class CompetitionResolve implements Resolve<Competition | null> {

    constructor(private auth: AuthService, private competition: CompetitionService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Competition | null> | Observable<Competition | null> {
        if (route.params.hasOwnProperty('competition_id')) {
            let collection: firestore.DocumentReference

            if (route.params.hasOwnProperty('parent_competition_id')) {
                collection = firebase.firestore().collection('competitions')
                    .doc(route.params['parent_competition_id']).collection('stages')
                    .doc(route.params['competition_id'])
            } else {
                collection = firebase.firestore().collection('competitions')
                    .doc(route.params['competition_id'])
            }

            return collection.get().then((doc: firestore.DocumentSnapshot) => {
                if (doc.exists) {
                    const id = doc.id
                    const competition = {id, ...doc.data()} as Competition
                    if (route.params.hasOwnProperty('parent_competition_id')) {
                        competition.parent_id = route.params['parent_competition_id']
                    }
                    if (competition.user == this.auth.user.uid) {
                        return competition
                    } else if (competition.mobile_devices.filter((item: MobileDevice) => item.uuid == device.uuid).length) {
                        return competition
                    } else {
                        return null
                    }
                } else {
                    return null
                }
            })
        } else if (hasKey('selected_competition_id')) {
            const selected_competition_ids: Array<string> = getString('selected_competition_id').split('_')
            this.competition.selected_competition_id$.next(selected_competition_ids.length == 1 ? selected_competition_ids[0]: selected_competition_ids)
            return this.competition.selected_competition_id$.pipe(
                first()
            )
        } else {
            return Promise.resolve().then(() => null)
        }
    }
}
