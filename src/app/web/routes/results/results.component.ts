import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core'
import {AngularFirestore} from '@angular/fire/firestore'
import {MatSort, MatTableDataSource} from '@angular/material'
import * as moment from 'moment-timezone'
import {NgxTimepickerFieldComponent} from 'ngx-material-timepicker'
import {Mark} from "@src/app/shared/interfaces/mark"
import {ActivatedRoute} from "@angular/router"
import * as _ from "lodash"
import {Competition} from "@src/app/shared/interfaces/competition"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {map, takeUntil} from "rxjs/operators"
import {ReplaySubject} from "rxjs"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {calcCircles} from "@src/app/web/shared/utils/tools"
import {StartListGroup} from "@src/app/shared/interfaces/start-list"
import {SCORE_MAP} from "@src/app/shared/helpers"


export interface ResultMark extends Mark {
    missing?: boolean
    manual?: boolean
    elapsed?: boolean
}


export interface TableRow {
    place: number,
    number: number,
    group?: StartListGroup | null,
    startOffset?: number,
    athlet: Athlet,
    marks: Array<ResultMark>,
    last_created: firebase.firestore.Timestamp | null,
    last_cp: number
}

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, AfterViewInit, OnDestroy {
    protected _onDestroy = new ReplaySubject<any>(1)

    SCORE_MAP = SCORE_MAP
    dataSource = new MatTableDataSource<TableRow>([])
    displayedColumns: string[] = ['place', 'score', 'number', 'class', 'athlet']

    hide_place = false
    checkpoints: Array<Checkpoint> = []
    end_time: moment
    athlets: Array<Athlet> = []
    circles: number

    @Input('classes') classes: Array<string> = []
    @Input('competition') competition: Competition
    @Input('is_admin') is_admin: boolean = false
    @Input('start_time') start_time: moment
    @Output() onActivate = new EventEmitter<any>()

    @ViewChild('picker', {static: true}) picker: NgxTimepickerFieldComponent
    @ViewChild(MatSort, {static: true}) sort: MatSort

    constructor(private firestore: AngularFirestore,
                private route: ActivatedRoute) {
        this.hide_place = this.route.snapshot.data['hide_place']

        if (this.hide_place) {
            this.displayedColumns.shift()
        }

    }

    ngAfterViewInit() {
        if (this.competition.group_start) {
            this.displayedColumns.splice(this.displayedColumns.indexOf('athlet'), 0, 'group')
        }
        this.end_time = moment(this.competition.end_date.toMillis()).add(this.start_time.seconds() + this.competition.duration, 's')
        this.onActivate.emit(this)
    }

    ngOnInit() {
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'athlet':
                    return item.athlet.fio
                default:
                    return item[property]
            }
        }
        this.sort.sort({id: 'place', start: 'asc', disableClear: false})
        this.dataSource.sort = this.sort

        this.dataSource.filterPredicate = (item: TableRow, filter: string) => {
            const data: {search: string} | null = JSON.parse(filter)

            let result = true

            if (!data) {
                result = true
            } else {
                const search = data.search.trim()
                if (search.length) {
                    const clean_search = search.toLowerCase()

                    if (parseInt(clean_search).toString() == clean_search) {
                        result = item.number.toString().indexOf(clean_search) >= 0
                    } else {
                        result = item.athlet.fio.toLowerCase().indexOf(clean_search) >= 0
                    }
                }

                result = result && (this.classes.indexOf(item.athlet.class) >= 0)
            }
            return result
        }

        this.firestore.collection<Athlet>(`athlets_${this.competition.parent_id || this.competition.id}`).valueChanges({idField: 'id'})
            .pipe(
                map((athlets: Array<Athlet>) => {
                    athlets = athlets.filter((athlet) => this.classes.indexOf(athlet.class) >= 0)
                    athlets.map((athlet: Athlet) => {
                        athlet.marks = athlet.marks ? athlet.marks.filter((mark: Mark) => mark.competition_id == this.competition.id) : []
                    })
                    // return athlets.filter((athlet: Athlet) => athlet.number == 444)
                    return athlets
                }),
                takeUntil(this._onDestroy)
            )
            .subscribe((athlets: Array<Athlet>) => {
                this.athlets = athlets

                if (this.competition.group_start) {
                    const start_time: firebase.firestore.Timestamp = _.min(
                        athlets.filter(athlet => athlet.group ? athlet.group.hasOwnProperty(this.competition.id) : false)
                            .map((athlet: Athlet) => athlet.group[this.competition.id].start_time)
                    )
                    if (start_time) {
                        this.start_time = moment(start_time.toMillis())
                    }
                }

                // this.athlets = athlets.filter((athlet) => {
                //     return [888].indexOf(athlet.number) >= 0
                // })
                this.circles = this.buildHeader(this.athlets)
                this.buildRows()
            })
    }

    ngOnDestroy(): void {
        this._onDestroy.next(null)
        this._onDestroy.complete()
    }

    private buildHeader(athlets: Array<Athlet>): number {
        const checkpoints: Array<Checkpoint> = this.competition.checkpoints.filter((checkpoint: Checkpoint) => _.intersection(
            this.classes, checkpoint.classes
        ).length)
        const circles = _.max(
            athlets.map((athlet: Athlet) => calcCircles(athlet.marks, checkpoints))
        )

        this.checkpoints = []
        _.range(0, circles, 1).forEach(() => {
            checkpoints.forEach((checkpoint: Checkpoint) => {
                this.checkpoints.push(checkpoint)
            })
        })

        this.displayedColumns = [...this.displayedColumns.slice(0, this.displayedColumns.indexOf('athlet') + 1)]

        this.checkpoints.forEach((checkpoint: Checkpoint, i: number) => {
            this.displayedColumns.push(`CP_${i}`)
        })

        return circles
    }

    private buildRows() {
        let rows: Array<TableRow> = []
        const cp_in_circle = (this.checkpoints.length / this.circles)

        this.athlets.forEach((athlet: Athlet, y: number) => {
            const clean_marks: Array<ResultMark | null> = [...athlet.marks.sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0)]
            const group = athlet.group ? athlet.group[this.competition.id] : null
            // меньше нуля
            let startOffset: number = 0

            if (group) {
                startOffset = this.start_time.diff((group.start_time || this.start_time).toDate(), 'ms')
            }

            let last_cp = -1

            for (const i of _.range(0, this.checkpoints.length + 1, 1)) {
                const order = i % cp_in_circle
                const mark = clean_marks[i]

                if (mark) {
                    if (mark.order != order) {
                        clean_marks.splice(i, 0, null)
                    }
                }
            }

            for (const i of _.range(0, this.checkpoints.length + 1, 1)) {
                const mark = clean_marks[i]
                if (mark) {
                    if (mark.created.toMillis() + startOffset > this.end_time.valueOf()) {
                        mark.elapsed = true
                    } else {
                        if (i == 0) {
                            last_cp = 0
                        } else {
                            if (clean_marks[i - 1] && clean_marks[last_cp]) {
                                if (clean_marks[i - 1].created == clean_marks[last_cp].created) {
                                    last_cp = i
                                }
                            }
                        }
                    }
                }
            }

            // if (athlet.number == 444) {
            //     console.log(
            //         clean_marks,
            //         clean_marks[last_cp],
            //         clean_marks[last_cp].created.toDate()
            //     )
            // }

            rows.push({
                number: athlet.number,
                group: group,
                startOffset: startOffset,
                athlet: athlet,
                marks: clean_marks,
                last_created: last_cp >= 0 ? clean_marks[last_cp].created : null,
                last_cp: last_cp,
            } as TableRow)


            console.log(
                rows
            )

        })

        if (this.competition.result_by_full_circle) {
            for (let row of rows) {
                const [credit_circle, credit_cp] = this.getCreditCircle(row.marks)

                if (credit_circle.length) {
                    row.last_created = credit_circle.pop().created
                    row.last_cp = credit_cp
                }
            }
        }

        rows = rows.sort((a: TableRow, b: TableRow) => {
            if (a.last_cp < b.last_cp) {
                return 1
            } else if (a.last_cp > b.last_cp) {
                return -1
            } else {
                const a_mills = a.last_created ? a.last_created.toMillis() + a.startOffset : undefined
                const b_mills = b.last_created ? b.last_created.toMillis() + b.startOffset : undefined

                if (a_mills < b_mills) {
                    return -1
                } else if (a_mills > b_mills) {
                    return 1
                }
            }
            return 0
        })
        rows.map((row: TableRow, i: number) => row.place = i + 1)
        this.dataSource.data = rows
    }

    private applyFilter(data: {search: string} | null): void {
        if (!data) {
            this.dataSource.filter = JSON.stringify(null)
        } else {
            this.dataSource.filter = JSON.stringify(data)
        }
    }

    // diffTime(date: firebase.firestore.Timestamp): string {
    //     const created = moment(date.toDate())
    //     const zeroTime = new Date(Date.UTC(this.start_time.year(), this.start_time.month(), this.start_time.day(), 0, 0, 0, 0))
    //
    //     if (created > this.start_time) {
    //         zeroTime.setMilliseconds(created.diff(this.start_time, 'ms') + zeroTime.getTimezoneOffset() * 60000)
    //         return [zeroTime.getHours(), zeroTime.getMinutes(), zeroTime.getSeconds()].join(':')
    //     }
    //     return ''
    // }

    formatDuration(ms: number): string {
        const zeroTime = new Date(Date.UTC(this.start_time.year(), this.start_time.month(), this.start_time.day(), 0, 0, 0, 0))
        zeroTime.setMilliseconds(Math.abs(ms) + zeroTime.getTimezoneOffset() * 60000)
        return [zeroTime.getHours(), zeroTime.getMinutes(), zeroTime.getSeconds()].join(':')
    }

    getOffsetDate(d: firebase.firestore.Timestamp, offset: number): Date {
        return moment(d.toDate()).add(offset,'ms').toDate()
    }

    isLastCp(index: number): boolean {
        const cp_in_circle = this.checkpoints.length / this.circles
        return (index % cp_in_circle) == (cp_in_circle - 1)
    }

    getCreditCircle(marks: Array<ResultMark>): [Array<ResultMark>, number] {
        const cp_in_circle = this.checkpoints.length / this.circles
        let circles_marks: Array<Array<ResultMark>> = _.chunk(marks, cp_in_circle)
        let last_circle = circles_marks[0]
        let circle_index: number = 1

        for (let i = 0; i < circles_marks.length ; i++) {
            const circle = circles_marks[i]

            if (circle.filter((mark) => {
                if (mark) {
                    if (!mark.elapsed) {
                        return true
                    }
                }
                return false
            }).length == cp_in_circle) {
                last_circle = circle
            } else {
                break
            }

            circle_index = i + 1
        }

        const credit_circle = (last_circle || []).filter((item) => !!item)

        return [credit_circle, (credit_circle.length - 1) * circle_index || circle_index]
    }

    trackByIndex(index, item) {
        return index
    }

    getTzOffset(timezone: string) {
        return moment.tz(timezone).format('z')
    }
}
