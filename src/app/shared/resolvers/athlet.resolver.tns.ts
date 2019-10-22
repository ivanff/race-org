import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {firestore} from 'nativescript-plugin-firebase'
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {CompetitionService} from "@src/app/mobile/services/competition.service"

const firebase = require('nativescript-plugin-firebase/app')

@Injectable()
export class AthletResolve implements Resolve<Athlet> {
    constructor(private _competition: CompetitionService) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return firebase.firestore().collection(`athlets_${this._competition.selected_competition.id}`)
            .doc(route.params.id).get()
            .then((doc: firestore.DocumentSnapshot) => {
                const id: string = doc.id
                return {id, ...doc.data()} as Athlet
            }, (err) => console.log('AthletResolve error', err))
    }
}
