import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core'
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

export interface Filter {
    str: string
    class: string
}

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, AfterViewInit {
    protected _onDestroy = new ReplaySubject<any>(1)

    SCORE_MAP = SCORE_MAP
    competition: Competition
    dataSource = new MatTableDataSource<TableRow>([])
    displayedColumns: string[] = ['place', 'score', 'number', 'class', 'athlet']

    filter: Filter = {class: '', str: ''}
    now: Date = new Date()
    csv_export_options = {
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalseparator: '.',
        showLabels: true,
        headers: this.displayedColumns,
        showTitle: true,
        title: 'Результаты',
        useBom: false,
        removeNewLines: true,
        keys: this.displayedColumns,
    }

    hide_start_time = false
    hide_place = false
    hide_class_filter = false
    checkpoints: Array<Checkpoint> = []
    start_time: moment
    end_time: moment
    athlets: Array<Athlet> = []
    circles: number

    @Input('classes') classes: Array<string> = []
    @Input('is_admin') is_admin: boolean = false

    @ViewChild('picker', {static: true}) picker: NgxTimepickerFieldComponent
    @ViewChild(MatSort, {static: true}) sort: MatSort

    constructor(private firestore: AngularFirestore,
                private route: ActivatedRoute) {
        this.competition = this.route.snapshot.data['competition']
        this.hide_start_time = this.route.snapshot.data['hide_start_time']
        this.hide_class_filter = this.route.snapshot.data['hide_class_filter']
        this.hide_place = this.route.snapshot.data['hide_place']

        if (this.hide_place) {
            this.displayedColumns.shift()
        }

        if (this.competition.group_start) {
            this.displayedColumns.splice(this.displayedColumns.indexOf('athlet'), 0, 'group')
        }

        this.start_time = moment(this.competition.start_date.toMillis()).add(this.competition.start_time, 's')
        this.end_time = moment(this.competition.end_date.toMillis()).add(this.competition.start_time + this.competition.duration, 's')
    }

    ngAfterViewInit() {
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

        this.dataSource.filterPredicate = (data: TableRow, filter: string) => {
            const filter_obj = JSON.parse(filter) as Filter
            let result = true

            if (filter_obj.str) {
                if (data.number.toString().indexOf(filter_obj.str) >= 0) {
                    result = true
                } else if (data.athlet.fio.toLocaleLowerCase().indexOf(filter_obj.str) >= 0) {
                    result = true
                } else {
                    result = false
                }
            }
            if (filter_obj.class) {
                result = (data.athlet.class === filter_obj.class) && result
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

        this.csv_export_options.keys = this.displayedColumns
        this.csv_export_options.headers = this.displayedColumns

        return circles
    }

    private buildRows() {
        let rows: Array<TableRow> = []
        const cp_in_circle = (this.checkpoints.length / this.circles)

        this.athlets.forEach((athlet: Athlet, y: number) => {
            const clean_marks: Array<ResultMark | null> = [...athlet.marks.sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0)]
            const group = athlet.group ? athlet.group[this.competition.id] : null
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

    applyFilter($event: any, field: string) {
        if (field === 'str') {
            this.filter.str = $event.target.value.trim().toLowerCase()
        }
        if (field === 'class') {
            this.filter.class = $event
        }
        this.dataSource.filter = JSON.stringify(this.filter)
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

    getCsvData(data: Array<any>) {
        let rows: Array<any> = []

        data.map((item) => {
            let row = {}
            let i = 0
            for (let key of this.csv_export_options.keys) {
                switch (key) {
                    case 'place': {
                        row['place'] = item.place
                        break
                    }
                    case 'number': {
                        row['number'] = item.number
                        break
                    }
                    case 'group': {
                        row['group'] = item.group
                        break
                    }
                    case 'class': {
                        row['class'] = item.athlet.class
                        break
                    }
                    case 'athlet': {
                        row['athlet'] = item.athlet.fio
                        break
                    }
                    default: {
                        const mark: ResultMark | undefined = item.marks[i]

                        if (mark) {
                            row[key] = moment(mark.created.toDate()).format('HH:mm:ss')
                        } else {
                            row[key] = ''
                        }

                        i = i + 1
                    }
                }
            }

            rows.push(row)
        })

        return rows
    }

    lockPublishResults(): void {}

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

    getTzOffset(timezone: string) {
        return moment.tz(timezone).format('z')
    }

    trackByIndex(index, item) {
        return index
    }
}
