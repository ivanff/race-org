import {Injectable, OnDestroy} from '@angular/core'
import {Competition} from "@src/app/competition/competition"
import {BehaviorSubject, empty, fromEventPattern, ReplaySubject} from "rxjs"
import {map, switchMap, takeUntil} from "rxjs/operators"
import {firestore} from "nativescript-plugin-firebase"
import {CheckPoint} from "@src/app/home/checkpoint"
import {getString, hasKey, setString} from "tns-core-modules/application-settings"

const firebase = require('nativescript-plugin-firebase/app')

@Injectable({
    providedIn: 'root'
})
export class SettingsService implements OnDestroy {
    competition: Competition
    competition$: BehaviorSubject<Competition>
    destroy: ReplaySubject<any>

    constructor() {
        console.log('constructor')
        this.competition$ = new BehaviorSubject<Competition>(null)
        this.competition = this.competition$.getValue()

        this.destroy =  new ReplaySubject<any>(1)
        this.competition$.pipe(
            switchMap((doc: Competition, i: number) => {
                if (doc) {
                    const db = firebase.firestore()
                    db.settings({ timestampsInSnapshots: true })
                    return fromEventPattern((handler => {
                        return firebase.firestore().collection("competitions").doc(doc.id).onSnapshot({includeMetadataChanges: true}, handler)
                    }), (handler, unsubscribe) => unsubscribe()).pipe(
                        map((doc: firestore.DocumentSnapshot) => {
                            const id = doc.id
                            return {id,...doc.data()} as Competition
                        }),
                        takeUntil(this.destroy)
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

    setCp(checkpoint: CheckPoint): void {
        setString('cp', JSON.stringify(checkpoint))
    }

    getCp(): CheckPoint | null {
        if (this.hasCp()) {
            try {
                return JSON.parse(getString('cp')) as CheckPoint
            } catch (e) {
                console.error(e)
            }

        }
    }

    hasCp(): boolean {
        if (hasKey('cp')) {
            try {
                JSON.parse(getString('cp'))
                return true
            } catch (e) {
                console.error(e)
                return false
            }
        } else {
            return false
        }
    }
}
