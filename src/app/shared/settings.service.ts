import {Injectable, OnDestroy} from '@angular/core'
import {Competition} from "@src/app/competition/competition"
import {BehaviorSubject, empty, fromEventPattern, ReplaySubject} from "rxjs"
import {map, switchMap, takeUntil} from "rxjs/operators"
import {firestore} from "nativescript-plugin-firebase"
import DocumentSnapshot = firestore.DocumentSnapshot

const firebase = require('nativescript-plugin-firebase/app')

@Injectable({
    providedIn: 'root'
})
export class SettingsService implements OnDestroy {
    competition: Competition
    competition$: BehaviorSubject<Competition>
    destroy: ReplaySubject<any> = new ReplaySubject<any>(1)

    constructor() {
        this.competition$ = new BehaviorSubject<Competition>(null)
        this.competition = this.competition$.getValue()

        this.competition$.pipe(
            switchMap((doc: Competition, i: number) => {
                if (doc) {
                    const db = firebase.firestore()
                    db.settings({ timestampsInSnapshots: true })
                    return fromEventPattern((handler => {
                        firebase.firestore().collection("competitions").doc(doc.id).onSnapshot({includeMetadataChanges: true}, handler)
                    }), (handler, unsubscribe) => unsubscribe()).pipe(
                        takeUntil(this.destroy),
                        map((doc: DocumentSnapshot) => {
                            const id = doc.id
                            return {id,...doc.data()} as Competition
                        })
                    )

                } else {
                    return empty()
                }

            })
        ).subscribe((next: Competition | null) => {
            if (next) {
                this.competition = next
            }
        })
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
    }
}
