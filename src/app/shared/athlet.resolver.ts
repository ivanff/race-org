import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {Athlet} from "@src/app/home/athlet"
import {AngularFirestore} from "@angular/fire/firestore"
import {Observable} from "rxjs"
import {first, map} from "rxjs/operators"

@Injectable()
export class AthletResolve implements Resolve<Athlet> {

    constructor(private firestore: AngularFirestore) {

    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Athlet> {
        // console.log(
        //     this.firestore.doc<Athlet>(`athlets/${route.params.id}`).valueChanges()
        // )
        return this.firestore.doc<Athlet>(`athlets/${route.params.id}`).valueChanges().pipe(first()).pipe(map((doc: Athlet) => {
            doc.id = route.params.id
            return doc
        }))
        // return true
    }
}
