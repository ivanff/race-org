import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {AngularFirestore} from "@angular/fire/firestore"
import {Observable} from "rxjs"
import {first, map, switchMap} from "rxjs/operators"
import {Competition} from "@src/app/shared/interfaces/competition"

@Injectable()
export class CompetitionResolve implements Resolve<Competition> {

    constructor(private afs: AngularFirestore) {

    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Competition> {
        return this.afs.doc<Competition>(`competitions/${route.params.id}`)
            .valueChanges().pipe(first()).pipe(map((doc) => {
                doc.id = route.params.id
                return doc
            })).pipe(
                switchMap((doc): Observable<Competition> => {
                    return this.afs.collection('competitions').doc(doc.id)
                        .collection('stages').valueChanges({idField: 'id'}).pipe(first()).pipe(map((stages: Array<any>) => {
                            return Object.assign(doc, {stages})
                        }))
                })
            )
    }
}
