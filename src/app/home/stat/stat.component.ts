import {Component, NgZone, OnDestroy, OnInit} from '@angular/core'
import {firestore} from "nativescript-plugin-firebase"
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute} from "@angular/router"
import {filter, first, switchMap, take, takeUntil, tap} from "rxjs/operators"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {Observable, ReplaySubject} from "rxjs"
import {SqliteService} from "@src/app/mobile/services/sqlite.service"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-stat',
    templateUrl: './stat.component.html',
    styleUrls: ['./stat.component.scss']
})
export class StatComponent implements OnInit, OnDestroy {
    athlets_count: number = 0
    by_class_count: { [key: string]: number } = {}
    competition: Competition | null
    private destroy = new ReplaySubject<any>(1)

    constructor(private zone: NgZone,
                private router: ActivatedRoute,
                private _competition: CompetitionService) {
        console.log('>> StatComponent constructor')

        this._competition.selected_competition_id$.pipe(
            takeUntil(this.destroy),
            tap((competition: Competition | null) => {
                this.competition = competition
            }),
            filter((competition: Competition | null) => !!competition),
            switchMap((competition: Competition) => {
                return this.firestoreCollectionObservable(competition.id).pipe(
                    takeUntil(this.destroy),
                    take(1)
                )
            })
        ).subscribe()
    }

    ngOnInit() {
        console.log('>> StatComponent ngOnInit')
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
        console.log('>> StatComponent ngOnDestroy')
    }

    private firestoreCollectionObservable(id) {
        return new Observable(subscriber => {
            const colRef: firestore.CollectionReference = firebase.firestore().collection(`athlets_${id}`)
            return colRef.onSnapshot((snapshot: firestore.QuerySnapshot) => {
                this.zone.run(() => {
                    this.athlets_count = snapshot.docs.length
                    if (this.competition) {

                        if (this.competition.id == id) {
                            this.competition.classes.forEach((_class) => {
                                this.by_class_count[_class] = snapshot.docs.filter((doc: firestore.QueryDocumentSnapshot) => {
                                    return doc.data().class === _class
                                }).length
                            })
                        }

                    }
                })
            })
        })
    }

}
