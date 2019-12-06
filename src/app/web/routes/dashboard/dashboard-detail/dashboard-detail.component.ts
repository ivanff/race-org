import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute, Router} from "@angular/router"
import {FormControl, FormGroup} from "@angular/forms"
import * as moment from 'moment-timezone'
import {AngularFirestore, AngularFirestoreDocument} from "@angular/fire/firestore"
import {debounceTime, first, shareReplay, takeUntil, tap} from "rxjs/operators"
import {Observable, ReplaySubject} from "rxjs"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {LocalStorageService} from "angular-2-local-storage"
import {environment} from "@src/environments/environment.prod"
import {MatSlideToggleChange, MatSort, MatTableDataSource} from "@angular/material"
import {ChartOptions} from 'chart.js'
import {Label} from "ng2-charts"
import * as _ from "lodash"
import {Mark} from "@src/app/shared/interfaces/mark"

@Component({
    selector: 'app-dashboard-detail',
    templateUrl: './dashboard-detail.component.html',
})
export class DashboardDetailComponent implements OnInit, OnDestroy {
    protected _onDestroy = new ReplaySubject<any>(1)

    athlets$: Observable<Array<Athlet>>
    dataSource = new MatTableDataSource<Athlet>([])
    displayedColumns: string[] = ['number', 'fio', 'phone', 'class', 'created']

    competition: Competition
    edit_competition: Competition
    active_tab: number = 0
    selectCompetition: FormGroup
    filterAthlets: FormGroup
    search = ''

    pieChartOptions: ChartOptions = {
        responsive: true,
        legend: {
            position: 'top',
        },
        plugins: {
            datalabels: {
                formatter: (value, ctx) => {
                    return ctx.chart.data.labels[ctx.dataIndex]
                },
            },
        }
    }
    pieChartLabels: Label[] = []
    pieChartData: number[] = []
    pieChartColors = [
        {
            backgroundColor: _.shuffle(['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
                '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
                '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
                '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
                '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
                '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
                '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
                '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
                '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
                '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF']),
        },
    ]

    @ViewChild(MatSort, {static: true}) sort: MatSort

    constructor(private route: ActivatedRoute,
                private afs: AngularFirestore,
                private router: Router,
                private localStorageService: LocalStorageService) {
        this.active_tab = this.localStorageService.get(`ActiveTab_${this.route.component['name']}`) || 0

        this.route.params.pipe(
            takeUntil(this._onDestroy)
        ).subscribe(params => {
            console.log(
                this.route.snapshot.data
            )
            this.competition = this.route.snapshot.data.competition
            this.edit_competition = {...this.route.snapshot.data.competition}

            this.pieChartLabels = this.competition.classes

            // this.afs.collection('competitions').doc(this.competition.id).collection('stages')
            //     .valueChanges({idField: 'id'})
            //     .pipe(
            //         map((stages: Array<any>) => {
            //             Object.assign(this.competition, {stages})
            //             Object.assign(this.edit_competition, {stages})
            //         })
            //     ).subscribe()

            this.athlets$ = this.afs.collection<Athlet>(`athlets_${this.competition.id}`, (ref => ref.orderBy('created', 'desc')))
                .valueChanges({idField: 'id'})
                .pipe(
                    debounceTime(1000),
                    shareReplay(1),
                    tap((athlets: Array<Athlet>) => {
                        const pieChartData = []
                        this.competition.classes.forEach((item, index) => {
                            pieChartData[index] = athlets.filter((athlet) => athlet.class == item).length || 0
                        })
                        this.pieChartData = pieChartData
                        return athlets
                    }),
                    tap((athlets: Array<Athlet>) => {
                        this.dataSource.data = [...athlets]
                    }),
                    takeUntil(this._onDestroy)
                )
        })
    }

    ngOnInit() {
        this.sort.sort({id: 'created', start: 'desc', disableClear: false})
        this.dataSource.sort = this.sort
        this.dataSource.sortingDataAccessor = (item, property) => {
            return item[property]
        }

        this.dataSource.filterPredicate = (athlet: Athlet, filter: string) => {
            const data: {search: string, class: string} | null = JSON.parse(filter)
            let result = true

            if (!data) {
                result = true
            } else {
                const search = data.search.trim().toLowerCase()
                const _class = data.class.trim().toLowerCase()

                if (data.search.length) {
                    if (parseInt(search).toString() == search) {
                        if (athlet.number.toString().indexOf(search) >= 0) {
                            result = true
                        } else if (athlet.id.toString().indexOf(search) >= 0) {
                            result = true
                        } else {
                            result = false
                        }
                    } else if ((athlet.fio.toLowerCase().indexOf(search) >= 0) && (search.length >= 3)) {
                        result = true
                    } else {
                        result = false
                    }
                }
                if (_class.length) {
                    if (athlet.class != _class) {
                        result = false
                    }
                }
            }
            return result
        }


        this.selectCompetition = new FormGroup({
            'competition_id': new FormControl(this.edit_competition.id, [])
        })
        this.selectCompetition.controls['competition_id'].valueChanges.subscribe((next) => {
            if (this.competition.id == next) {
                this.edit_competition = {...this.competition}
            } else {
                const competitions = this.competition.stages.filter((item: Competition) => item.id == next)
                if (competitions.length) {
                    this.edit_competition = {...competitions[0]}
                }
            }
        })

        this.filterAthlets = new FormGroup({
            'search': new FormControl('', []),
            'class': new FormControl('', [])
        })

        this.filterAthlets.statusChanges.subscribe((next) => {
            if (next == 'VALID') {
                this.applyFilter(this.filterAthlets.value)
            } else {
                this.applyFilter(null)
            }
        })

        // this.filterAthlets.controls['search'].valueChanges
        //     .pipe(debounceTime(500))
        //     .pipe(distinctUntilChanged())
        //     .subscribe((next => this.search = next))
    }

    ngOnDestroy(): void {
        this._onDestroy.next(null)
        this._onDestroy.complete()
    }

    private applyFilter(data: {search: string, class: string} | null): void {
        if (!data) {
            this.dataSource.filter = JSON.stringify(null)
        } else {
            this.dataSource.filter = JSON.stringify(data)
        }

    }

    private getCollection(competition): AngularFirestoreDocument {
        if (competition.parent_id) {
            return this.afs.collection('competitions').doc(competition.parent_id).collection('stages').doc(competition.id)
        } else {
            return this.afs.collection('competitions').doc(competition.id)
        }

    }

    setActiveTab($event) {
        this.active_tab = $event
        this.localStorageService.set(`ActiveTab_${this.route.component['name']}`, $event)
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
                Promise.all([
                    this.afs.collection('competitions').doc(this.competition.id).delete(),
                    this.afs.collection(`athlets_${this.competition.id}`).doc(this.competition.id).delete(),
                ]).then(() => {
                    this.router.navigate(['dashboard'])
                })
            })
        }
    }

    onStopRegChange($event: MatSlideToggleChange) {
        if (!$event.checked != this.competition.stop_registration) {
            this.getCollection(this.competition).update({
                'stop_registration': !$event.checked
            }).then(() => {
                this.competition.stop_registration = !$event.checked
                if (this.competition.id == this.edit_competition.id) {
                    this.edit_competition.stop_registration = !$event.checked
                }
            })
        }
    }

    getFullRegisterUrl() {
        return `${environment.SERVER_URL}/public/athlet/register/${this.competition.id}`
    }

    onAdmin(action: string) {
        if (action == 'add_athlets') {
            this.afs.collection('athlets').valueChanges().pipe(first()).subscribe((athlets: Array<any>) => {
                athlets.map((athlet: any) => {
                    athlet.marks = athlet.checkpoints.map((item: any) => {
                        delete item.key
                        item.competition_id = this.competition.id
                        return item as Mark
                    })
                    delete athlet.checkpoints
                    athlet.created = new Date()
                    this.afs.collection(`athlets_${this.competition.id}`).doc(athlet.phone + '').set(athlet as Athlet)
                })

            })
        } else if (action == 'remove_athlets') {
            const batch = this.afs.firestore.batch()
            this.afs.collection(`athlets_${this.competition.id}`).valueChanges({idField: 'id'}).pipe(first()).subscribe((athlets: Array<any>) => {
                athlets.forEach((athlet) => {
                    batch.delete(
                        this.afs.collection(`athlets_${this.competition.id}`).doc(athlet.id).ref
                    )
                })
                batch.commit()
            })
        }
    }

    getQr(athlet: Athlet): string {
        return JSON.stringify({
            number: athlet.number,
            competition_id: this.competition.parent_id || this.competition.id
        })
    }
}
