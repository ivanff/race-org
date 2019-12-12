import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {firestore} from 'nativescript-plugin-firebase'
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {CompetitionService} from "@src/app/mobile/services/competition.service"

const firebase = require('nativescript-plugin-firebase/app')

@Injectable()
export class AthletListResolve implements Resolve<Array<Athlet>> {
    constructor(private _competition: CompetitionService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Array<Athlet>> {
        const colRef: firestore.CollectionReference =firebase.firestore().collection(this._competition.getAthletsCollectionPath())
        if (route.params.hasOwnProperty('class')) {
            return colRef.where('class', '==', route.params['class'])
                .get().then((snapshot: firestore.QuerySnapshot) => {
                    const athlets: Array<Athlet> = []
                    snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                        const id = doc.id
                        athlets.push({id, ...doc.data()} as Athlet)
                    })
                    return athlets
                })
        } else if (route.params.hasOwnProperty('group')) {
            return colRef.where(`group.${this._competition.selected_competition.id}.id`, '==', route.params['group'])
                .get().then((snapshot: firestore.QuerySnapshot) => {
                    const athlets: Array<Athlet> = []
                    snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                        const id = doc.id
                        athlets.push({id, ...doc.data()} as Athlet)
                    })
                    return athlets
                })
        }

    }
}
