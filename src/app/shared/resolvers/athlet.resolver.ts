import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {AngularFirestore} from "@angular/fire/firestore"
import {Observable} from "rxjs"
import {first, map} from "rxjs/operators"
import {Athlet} from "@src/app/shared/interfaces/athlet"

@Injectable()
export class AthletResolve implements Resolve<Athlet> {

    constructor(private afs: AngularFirestore) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Athlet> {
        let competition_id = route.parent.params.id
        if (!competition_id) {
            competition_id = route.params.parent_id || route.params.id
        }

        console.log(
            `athlets_${competition_id}/${route.params.athlet_id}`
        )

        return this.afs.doc<Athlet>(`athlets_${competition_id}/${route.params.athlet_id}`)
            .valueChanges()
            .pipe(
                first(),
                map((doc: Athlet) => {
                    doc.id = route.params.athlet_id
                    return doc
                }))
    }
}
