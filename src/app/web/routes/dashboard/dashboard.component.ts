import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {AngularFirestore} from "@angular/fire/firestore"
import {AuthService} from "@src/app/web/core"
import {combineLatest, Observable} from "rxjs"
import * as moment from 'moment-timezone'
import {first, map, switchMap} from "rxjs/operators"

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
    competitions: Array<any> = []
    competitions$: Observable<Array<Competition>>
    current_timezone: string = moment.tz.guess()

    constructor(private cdr: ChangeDetectorRef,
                private afs: AngularFirestore,
                private auth: AuthService) {

    }

    ngOnInit() {
        this.competitions$ = this.afs.collection<Competition>('competitions', ref => ref.where('user', '==', this.auth.user.uid).orderBy('created', 'desc'))
            .valueChanges({idField: 'id'})
            .pipe(map((values: Array<any>) => values.filter((item) =>
                ['4O12e8JOUoR96idKit6d'].indexOf(item.id) == -1
            )))
            .pipe(
                switchMap((values: Array<any>) => {
                    const sub_query = values.map((doc) => {
                        return this.afs.collection('competitions').doc(doc.id).collection('stages').valueChanges(first()).pipe(map((stages) => {
                            return Object.assign(doc, {stages})
                        }))
                    })
                    return combineLatest(...sub_query)
                })
            )
        this.competitions$.subscribe((values: Array<Competition>) => {
            this.competitions = [...values]
        })
        return
    }

    getFullDate(a: firebase.firestore.Timestamp, b: number | null): Date {
        if (a && b) {
            return new Date(
                a.toMillis() + b * 1000
            )
        }
        return a.toDate()
    }

    getTzOffset(timezone: string) {
          return moment.tz(timezone).format('z')
    }
}
