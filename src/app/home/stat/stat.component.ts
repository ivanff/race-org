import {Component, NgZone, OnDestroy, OnInit} from '@angular/core'
import {firestore} from "nativescript-plugin-firebase"
import {Competition} from "@src/app/shared/interfaces/competition"
import {filter, startWith, switchMap, take, takeUntil, tap} from "rxjs/operators"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {interval, Observable, ReplaySubject} from "rxjs"
import * as moment from 'moment-timezone'

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-stat',
    templateUrl: './stat.component.html',
    styleUrls: ['./stat.component.scss']
})
export class StatComponent implements OnInit, OnDestroy {
    private destroy = new ReplaySubject<any>(1)

    athlets_count: number = 0
    by_class_count: { [key: string]: number } = {}
    competition: Competition
    current_timezone = moment.tz.guess()
    timeElapsed = false

    constructor(private zone: NgZone,
                public _competition: CompetitionService) {
        console.log('>> StatComponent constructor')

        this._competition.selected_competition_id$.pipe(
            tap((competition: Competition | null) => {
                this.competition = competition
            }),
            filter((competition: Competition | null) => !!competition),
            switchMap((competition: Competition) => {
                return this.firestoreCollectionObservable(competition).pipe(
                    take(1),
                    takeUntil(this.destroy),
                )
            }),
            takeUntil(this.destroy),
        ).subscribe()

        interval(10000).pipe(
            startWith(0),
            takeUntil(this.destroy),
        ).subscribe((next) => {
            if (this.competition) {
                this.timeElapsed = moment(this.competition.end_date).add(this.competition.start_time + this.competition.duration, 's').toDate() < new Date()
            }
        })
    }

    ngOnInit() {
        console.log('>> StatComponent ngOnInit')
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
        console.log('>> StatComponent ngOnDestroy')
    }

    private firestoreCollectionObservable(competition: Competition) {
        return new Observable(subscriber => {
            const colRef: firestore.CollectionReference = firebase.firestore().collection(`athlets_${competition.parent_id || competition.id}`)
            return colRef.onSnapshot((snapshot: firestore.QuerySnapshot) => {
                this.zone.run(() => {
                    this.athlets_count = snapshot.docs.length
                    if (this.competition) {

                        if (this.competition.id == competition.id) {
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
