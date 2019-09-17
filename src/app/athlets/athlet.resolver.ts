import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {firestore} from 'nativescript-plugin-firebase'
import {Athlet} from "@src/app/home/athlet"

const firebase = require('nativescript-plugin-firebase/app')

@Injectable()
export class AthletResolve implements Resolve<Athlet> {
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return firebase.firestore().collection('athlets').doc(route.params.phone).get().then((doc: firestore.DocumentSnapshot) => {
            return doc.data() as Athlet
        })
    }
}
