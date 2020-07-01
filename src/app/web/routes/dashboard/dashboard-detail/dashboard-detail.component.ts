import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute, Router} from "@angular/router"
import {FormControl, FormGroup, Validators} from "@angular/forms"
import * as moment from 'moment-timezone'
import {AngularFirestore, AngularFirestoreDocument} from "@angular/fire/firestore"
import {catchError, debounceTime, first, shareReplay, switchMap, takeUntil, tap} from "rxjs/operators"
import {defer, Observable, of, ReplaySubject, throwError} from "rxjs"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {LocalStorageService} from "angular-2-local-storage"
import {environment} from "@src/environments/environment"
import {MatButtonToggleChange, MatDialog, MatSlideToggleChange, MatSort, MatTableDataSource} from "@angular/material"
import {ChartOptions} from 'chart.js'
import {Label} from "ng2-charts"
import * as _ from "lodash"
import {Mark} from "@src/app/shared/interfaces/mark"
import {AddAthletDialogComponent} from "@src/app/web/routes/dashboard/dashboard-detail/add-athlet-dialog.component"
import {ResultMark} from "@src/app/web/routes/results/results.component"
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http"
import * as firebase from "firebase"


@Component({
    selector: 'app-dashboard-detail',
    templateUrl: './dashboard-detail.component.html',
})
export class DashboardDetailComponent implements OnInit, OnDestroy {
    protected _onDestroy = new ReplaySubject<any>(1)

    athlets$: Observable<Athlet[]>
    dataSource = new MatTableDataSource<Athlet>([])
    displayedColumns: string[] = ['number', 'fio', 'phone', 'class', 'nfc_id', 'group', 'created', 'actions']

    competition: Competition
    edit_competition: Competition
    active_tab: number = 0
    selectCompetition: FormGroup
    filterAthlets: FormGroup

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

    csv_export_options = {
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalseparator: '.',
        showLabels: true,
        headers: this.displayedColumns,
        showTitle: true,
        title: 'Атлеты',
        useBom: false,
        removeNewLines: true,
        keys: this.displayedColumns,
    }

    @ViewChild(MatSort, {static: true}) sort: MatSort

    constructor(private route: ActivatedRoute,
                private afs: AngularFirestore,
                private http: HttpClient,
                private router: Router,
                private localStorageService: LocalStorageService,
                private dialog: MatDialog) {

        this.active_tab = this.localStorageService.get(`ActiveTab_${this.route.component['name']}`) || 0

        this.route.params.pipe(
            takeUntil(this._onDestroy)
        ).subscribe(params => {
            this.competition = this.route.snapshot.data.competition
            this.edit_competition = {...this.route.snapshot.data.competition}
            this.pieChartLabels = this.competition.classes

            this.athlets$ = this.afs.collection<Athlet>(`athlets_${this.competition.id}`)
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
            const data: { search: string, class: string, missing_nfc: boolean } | null = JSON.parse(filter)
            let result = true

            if (!data) {
                result = true
            } else {
                const search = data.search.trim().toLowerCase()

                if (search.length) {
                    if (parseInt(search).toString() == search) {
                        if (athlet.number.toString().indexOf(search) >= 0) {
                            result = true
                        } else if (athlet.id.toString().indexOf(search) >= 0) { // phone
                            result = true
                        } else {
                            result = false
                        }
                    } else if (athlet.fio.toLowerCase().indexOf(search) >= 0) {
                        result = true
                    } else {
                        result = false
                    }
                }
                if (data.class.length) {
                    if (athlet.class != data.class) {
                        result = false
                    }
                }
                if (data.missing_nfc && athlet.nfc_id) {
                    result = false
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
                for (let item of this.competition.stages) {
                    if (item.id == next) {
                        this.edit_competition = {...item}
                        break
                    }
                }
                // const competitions = this.competition.stages.filter((item: Competition) => item.id == next)
                // if (competitions.length) {
                //     this.edit_competition = {...competitions[0]}
                //     console.log(
                //         this.edit_competition
                //     )
                // }
            }
        })

        this.filterAthlets = new FormGroup({
            'search': new FormControl('', [Validators.minLength(3)]),
            'class': new FormControl('', []),
            'missing_nfc': new FormControl(false, []),
        })

        this.filterAthlets.statusChanges.subscribe((next) => {
            if (next == 'VALID') {
                this.applyFilter(this.filterAthlets.value)
            } else {
                this.applyFilter(null)
            }
        })
    }

    ngOnDestroy(): void {
        this._onDestroy.next(null)
        this._onDestroy.complete()
    }

    private applyFilter(data: { search: string, class: string, missing_nfc: boolean } | null): void {
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

    setActiveTab($event: number) {
        this.active_tab = $event
        this.localStorageService.set(`ActiveTab_${this.route.component['name']}`, $event)
    }

    onDelete(competition: Competition, collection?: string) {
        if (collection == 'stages') {
            this.afs.collection('competitions').doc(this.competition.id).collection(collection).doc(competition.id).delete().then(() => {
                this.setActiveTab(1)
                location.reload()
            })
        } else {
            Promise.all(this.competition.stages.map((stage: Competition) => {
                return this.afs.collection('competitions').doc(this.competition.id).collection('stages').doc(stage.id).delete()
            })).then(() => {
                Promise.all([
                    this.afs.collection('competitions').doc(this.competition.id).delete(),
                    this.afs.collection(`athlets_${this.competition.id}`).doc(this.competition.id).delete(),
                ]).then(() => {
                    this.router.navigate(['/cabinet'])
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

    onAddAthlet(): void {
        this.dialog.open(AddAthletDialogComponent, {
            data: {competition: this.competition}
        })
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

    actions($event: MatButtonToggleChange, id): void {
        //TODO confirm dialog
        this.afs.collection<Athlet>(`athlets_${this.competition.id}`).doc(id).delete()
    }

    getCsvData(data: Array<any>) {
        let rows: Array<any> = []

        data.map((item) => {
            let row = {}
            for (let key of this.csv_export_options.keys) {
                switch (key) {
                    case 'created': {
                        row['created'] = moment(item.created.toMillis()).format('YYYY-MM-DD hh:mm:ss z')
                        break
                    }
                    case 'actions': {
                        row['actions'] = ''
                        break
                    }
                    default: {
                        row[key] = item[key]
                    }
                }
            }

            rows.push(row)
        })

        return rows
    }

    downloadStartStickers(): void {
        this.http.post(environment.backend_gateway + '/stickers',
            JSON.stringify({
                competition_id: this.competition.id
            }),
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                }),
                responseType: 'arraybuffer'
            }
        ).subscribe((data) => {

            const blob = new Blob([data], {
                type: 'application/zip'
            });

            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `stickers_${this.competition.title}.zip`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)

        })
    }
}
