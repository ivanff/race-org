import {Injectable} from '@angular/core'
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router'
import {AngularFirestore} from "@angular/fire/firestore"
import {Observable, of} from "rxjs"
import {catchError, first, map, switchMap} from "rxjs/operators"
import {Competition} from "@src/app/shared/interfaces/competition"

@Injectable()
export class CompetitionResolve implements Resolve<Competition> {

    constructor(private afs: AngularFirestore) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Competition> {
        return this.afs.doc<Competition>(`competitions/${route.params.id}`)
            .valueChanges()
            .pipe(map((doc) => {
                    doc.id = route.params.id
                    return doc
                }),
                first(),
                switchMap((doc): Observable<Competition> => {
                    return this.afs.collection('competitions').doc(doc.id)
                        .collection('stages')
                        .valueChanges({idField: 'id'})
                        .pipe(
                            map((stages: Array<any>) => {
                                return Object.assign(doc, {stages})
                            }),
                            first()
                        )
                }),
                switchMap((doc): Observable<Competition|null> => {
                    return this.afs.collection('competitions').doc(doc.id)
                        .collection('test_secret')
                        .valueChanges({idField: 'id'})
                        .pipe(
                            map((docs: Array<any>) => {
                                const secret = {}
                                docs.forEach((doc) => {
                                    secret[doc.id] = doc.code
                                })
                                return Object.assign(doc, {secret: secret})
                            }),
                            first(),
                            catchError((err) => {
                                return of(doc)
                            })
                        )
                }),
            )
    }
}
