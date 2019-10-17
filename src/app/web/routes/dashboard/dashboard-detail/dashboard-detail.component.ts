import {Component, OnDestroy, OnInit} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute, Router} from "@angular/router"
import {FormControl, FormGroup} from "@angular/forms"
import * as moment from 'moment-timezone'
import {AngularFirestore} from "@angular/fire/firestore"
import {debounceTime, distinctUntilChanged, map, takeUntil} from "rxjs/operators"
import {Observable, ReplaySubject, Subscription} from "rxjs"
import {Athlet} from "@src/app/shared/interfaces/athlet"

@Component({
    selector: 'app-dashboard-detail',
    templateUrl: './dashboard-detail.component.html',
})
export class DashboardDetailComponent implements OnInit, OnDestroy {
    athlets$: Observable<Array<Athlet>>
    protected _onDestroy = new ReplaySubject<any>(1)
    protected _subscribers: Array<Subscription> = []
    competition: Competition
    edit_competition: Competition
    active_tab = 3
    selectCompetition: FormGroup
    filterAthlets: FormGroup
    search = ''


    constructor(private route: ActivatedRoute,
                private afs: AngularFirestore,
                private router: Router) {

        this.route.params.pipe(
            takeUntil(this._onDestroy)
        ).subscribe(params => {
            this.competition = this.route.snapshot.data.competition
            this.edit_competition = this.route.snapshot.data.competition

            this._subscribers.push(
                this.afs.collection('competitions').doc(this.competition.id).collection('stages')
                    .valueChanges({idField: 'id'}).pipe(map((stages: Array<any>) => {
                    Object.assign(this.competition, {stages})
                    Object.assign(this.edit_competition, {stages})
                })).pipe(
                    takeUntil(this._onDestroy)
                ).subscribe()
            )

            this.athlets$ = this.afs.collection<Athlet>(`athlets_${this.competition.id}`)
                .valueChanges({idField: 'id'})
                .pipe(
                    takeUntil(this._onDestroy)
                )
        })
    }

    ngOnInit() {
        this.selectCompetition = new FormGroup({
            'competition': new FormControl(this.edit_competition, [])
        })
        this.filterAthlets = new FormGroup({
            'search': new FormControl('', []),
            'class': new FormControl('', [])
        })

        this.filterAthlets.controls['search'].valueChanges
            .pipe(debounceTime(500))
            .pipe(distinctUntilChanged())
            .subscribe((value => this.search = value))
    }

    ngOnDestroy(): void {
        this._onDestroy.next(null)
        this._onDestroy.complete()
    }

    setActiveTab($event) {
        this.active_tab = $event
    }

    getTzOffset(timezone: string) {
        return moment.tz(timezone).format('z')
    }

    onDelete(competition: Competition, collection?: string) {
        if (collection == 'stages') {
            this.afs.collection('competitions').doc(this.competition.id).collection(collection).doc(competition.id).delete()
        } else {
            Promise.all(this.competition.stages.map((stage: Competition) => {
                return this.afs.collection('competitions').doc(this.competition.id).collection('stages').doc(stage.id).delete()
            })).then(() => {
                this.afs.collection('competitions').doc(this.competition.id).delete().then(() => {
                    this.router.navigate(['dashboard'])
                })
            })
        }
    }
}
