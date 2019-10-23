import {Component, NgZone, OnDestroy, OnInit} from '@angular/core'
import {firestore} from "nativescript-plugin-firebase"
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute} from "@angular/router"
import {takeUntil} from "rxjs/operators"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {ReplaySubject} from "rxjs"
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
    private unsubscribe: () => void

    constructor(private zone: NgZone,
                private router: ActivatedRoute,
                private _competition: CompetitionService) {
        console.log('>> StatComponent constructor')

        this._competition.selected_competition_id$.pipe(
            takeUntil(this.destroy)
        ).subscribe((competition) => {
            this.competition = competition
            if (this.competition) {
                this.competition.classes.forEach((_class) => {
                    this.by_class_count[_class] = 0
                })
                if (this.unsubscribe) {
                    this.unsubscribe()
                }

                this.unsubscribe = firebase.firestore().collection(`athlets_${this.competition.id}`)
                    .onSnapshot({includeMetadataChanges: true}, (snapshot: firestore.QuerySnapshot) => {
                        this.zone.run(() => {
                            this.athlets_count = snapshot.docs.length

                            this.competition.classes.forEach((_class) => {
                                this.by_class_count[_class] = snapshot.docs.filter((doc: firestore.QueryDocumentSnapshot) => {
                                    return doc.data().class === _class
                                }).length
                            })
                        })
                    })

            }
        })
    }

    ngOnInit() {
        console.log('>> StatComponent ngOnInit')
    }

    ngOnDestroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe()
        }
        this.destroy.next(null)
        this.destroy.complete()
        console.log('>> StatComponent ngOnDestroy')
    }

}
