import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {firestore} from 'nativescript-plugin-firebase'
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {StartListGroup} from "@src/app/shared/interfaces/start-list"

const firebase = require('nativescript-plugin-firebase/app')

@Injectable()
export class AthletListResolve implements Resolve<Athlet[]> {
    constructor(private _competition: CompetitionService) {
    }

    private hasGroup(athlet: Athlet): boolean {
        if (athlet.hasOwnProperty('group')) {
            return athlet.group ? athlet.group.hasOwnProperty(this._competition.selected_competition.id) : false
        } else {
            return false
        }
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Athlet[]> {
        let colRef: firestore.CollectionReference | firestore.Query =firebase.firestore().collection(this._competition.getAthletsCollectionPath())

        if (route.params.hasOwnProperty('class')) {
            colRef = colRef.where('class', '==', route.params['class'])
        }

        return colRef.get().then((snapshot: firestore.QuerySnapshot): Athlet[] => {
            const athlets: Array<Athlet> = []

            snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                const id = doc.id
                const athlet = {id, ...doc.data()} as Athlet

                if (!this.hasGroup(athlet)) {
                    athlet.group = athlet.group || {}
                    athlet.group[this._competition.selected_competition.id] = {
                        id: athlet.class,
                        order: -1,
                        start_time: null
                    } as StartListGroup
                }
                athlets.push(athlet)
            })

            return athlets
        })
    }
}
