import {Injectable, NgZone, OnDestroy} from '@angular/core'
import {Observable, of, ReplaySubject, Subject} from "rxjs"
import {Competition} from "@src/app/shared/interfaces/competition"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {shareReplay, switchMap, takeUntil} from "rxjs/operators"
import {firestore} from "nativescript-plugin-firebase"
import {setString, remove} from "tns-core-modules/application-settings"

const firebase = require('nativescript-plugin-firebase/app')

@Injectable({
    providedIn: 'root'
})
export class CompetitionService implements OnDestroy {
    selected_competition: Competition
    selected_competition_id$: any
    private destroy = new ReplaySubject<any>(1)

    constructor(private auth: AuthService, private zone: NgZone) {
        console.log('>>> CompetitionService constructor')

        this.selected_competition_id$ = (new Subject).pipe(
            switchMap((id: string | null) => {
                if (id) {
                    return this.firestoreCollectionObservable(id).pipe(
                        takeUntil(this.destroy)
                    )
                } else {
                    return of(null)
                }
            }),
            shareReplay(1),
            takeUntil(this.destroy),
        )
        this.selected_competition_id$.subscribe((competition: Competition) => {
            this.selected_competition = competition
            if (competition) {
                setString('selected_competition_id', competition.id)
            } else {
                remove('selected_competition_id')
            }
        })
    }

    firestoreCollectionObservable(id) {
        return new Observable(subscriber => {
            const colRef: firestore.DocumentReference = firebase.firestore().collection("competitions").doc(id)
            colRef.onSnapshot((doc: firestore.DocumentSnapshot) => {
                if (doc.exists) {
                    this.zone.run(() => {
                        const id = doc.id
                        this.selected_competition = {id, ...doc.data()} as Competition
                        subscriber.next(this.selected_competition)
                    })
                } else {
                    subscriber.next(null)
                }
            })
        })
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
    }
}
