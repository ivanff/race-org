import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {AngularFirestore} from "@angular/fire/firestore"
import {AuthService, SettingsService} from "@src/app/web/core"
import {Observable} from "rxjs"
import {filter, map} from "rxjs/operators"

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
    competitions: Array<any> = []
    competitions$: Observable<Array<Competition>>

    constructor(private cdr: ChangeDetectorRef,
                private afs: AngularFirestore,
                private auth: AuthService,
                private settings: SettingsService) {

    }

    ngOnInit() {
        this.competitions$ = this.afs.collection<Competition>('competitions', ref => ref.where('user', '==', this.auth.user.uid).orderBy('created', 'desc'))
            .valueChanges({idField: 'id'})
            .pipe(map((values: Array<any>) => values.filter((item) =>
                ['4O12e8JOUoR96idKit6d'].indexOf(item.id) == -1
            )))
        this.competitions$.subscribe((values: Array<any>) => {
            this.competitions = [...values]
        })
        return
    }

    getFullDate(a: firebase.firestore.Timestamp, b: firebase.firestore.Timestamp | null): Date {
        if (a && b) {
            return new Date(
                a.toMillis() + b.toMillis()
            )
        }
        return a.toDate()
    }
}
