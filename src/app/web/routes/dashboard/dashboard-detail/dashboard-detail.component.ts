import {Component, OnInit} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute, Router} from "@angular/router"
import {FormControl, FormGroup} from "@angular/forms"
import * as moment from 'moment-timezone'
import {AngularFirestore} from "@angular/fire/firestore"
import {debounceTime, distinctUntilChanged, map, tap} from "rxjs/operators"
import {Observable} from "rxjs"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import * as firebase from "firebase/app"

@Component({
    selector: 'app-dashboard-detail',
    templateUrl: './dashboard-detail.component.html',
})
export class DashboardDetailComponent implements OnInit {
    athlets$: Observable<Array<Athlet>>
    competition: Competition
    edit_competition: Competition
    active_tab = 3
    selectCompetition: FormGroup
    filterAthlets: FormGroup
    search = ''

    constructor(private route: ActivatedRoute,
                private afs: AngularFirestore,
                private router: Router) {
        this.competition = this.route.snapshot.data.competition
        this.edit_competition = this.route.snapshot.data.competition


        this.afs.collection('competitions').doc(this.competition.id).collection('stages')
            .valueChanges({idField: 'id'}).pipe(map((stages: Array<any>) => {
            Object.assign(this.competition, {stages})
            Object.assign(this.edit_competition, {stages})
        })).subscribe()

        this.athlets$ = this.afs.collection<Athlet>(`athlets_${this.competition.id}`)
            .valueChanges({idField: 'id'})

        // this.afs.collection<Athlet>(`athlets`).get().subscribe((docs: firebase.firestore.QuerySnapshot) => {
        //     return docs.forEach((doc) => {
        //       const data = {...doc.data()}
        //       data.created = firebase.firestore.Timestamp.fromDate(new Date())
        //       this.afs.collection<Athlet>(`athlets_${this.competition.id}`).doc(doc.id).set(doc.data() as Athlet)
        //       return data as Athlet
        //     })
        // })
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
