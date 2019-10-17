import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {AngularFirestore} from "@angular/fire/firestore"
import {AuthService, SettingsService} from "@src/app/web/core"
import {Observable, Subscription} from "rxjs"
import * as moment from 'moment-timezone'

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
    competitions: Array<Competition> = []
    competitions$: Observable<Array<Competition>>
    current_timezone: string = moment.tz.guess()
    protected _subscribers: Array<Subscription> = []

    constructor(private cdr: ChangeDetectorRef,
                private afs: AngularFirestore,
                private auth: AuthService,
                private settings: SettingsService) {

    }

    ngOnInit() {
        this.competitions$ = this.settings.competitions$
        this._subscribers.push(
            this.competitions$.subscribe((values: Array<Competition>) => {
                this.competitions = [...values]
            })
        )
        return
    }

    ngOnDestroy(): void {
        this._subscribers.forEach((func: Subscription) => {
            func.unsubscribe()
        })
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
