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
import {takeUntil} from "rxjs/operators"
import {ReplaySubject} from "rxjs"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"


export interface ResultMark extends Mark {
    missing?: boolean
    manual?: boolean
    elapsed?: boolean
}


export interface TableRow {
    place: number,
    number: number,
    athlet: Athlet,
    marks: Array<ResultMark>,
    last_created: Date,
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
    competition: Competition
    dataSource = new MatTableDataSource<TableRow>([])
    protected _onDestroy = new ReplaySubject<any>(1)
    displayedColumns: string[] = ['place', 'number', 'class', 'athlet']
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
    is_admin: boolean = false
    circles: number

    @Input('classes') classes: Array<string> = []

    @ViewChild('picker', {static: true}) picker: NgxTimepickerFieldComponent
    @ViewChild(MatSort, {static: true}) sort: MatSort

    constructor(private firestore: AngularFirestore,
                private route: ActivatedRoute) {
        this.competition = this.route.snapshot.data['competition']
        this.hide_start_time = this.route.snapshot.data['hide_start_time']
        this.hide_class_filter = this.route.snapshot.data['hide_class_filter']
        this.hide_place = this.route.snapshot.data['hide_place']
        this.is_admin = this.route.snapshot.data['is_admin']

        if (this.hide_place) {
            this.displayedColumns.shift()
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

        this.firestore.collection<Athlet>(`athlets_${this.competition.id}`).valueChanges({idField: 'id'})
            .pipe(
                takeUntil(this._onDestroy)
            )
            .subscribe((doc: Array<any>) => {
                this.athlets = doc.filter((athlet: Athlet) => this.classes.indexOf(athlet.class) >= 0)

                this.circles = Math.ceil(
                    _.max(this.athlets.map((athlet: Athlet) => athlet.checkpoints.length)) / this.competition.checkpoints.length
                )
                this.buildHeader()
                this.buildRows()
            })
    }

    private buildHeader() {
        this.checkpoints = []
        const checkpoints: Array<Checkpoint> = this.competition.checkpoints.filter((checkpoint: Checkpoint) => _.intersection(
            this.classes, checkpoint.classes
        ).length)

        _.range(0, this.circles, 1).forEach(() => {
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
    }

    private buildRows() {
        let rows: Array<TableRow> = []
        const cp_in_circle = (this.checkpoints.length / this.circles)

        this.athlets.forEach((athlet: Athlet, y: number) => {
            // if (athlet.number != 888) {
            //     return
            // }
            const clean_marks: Array<ResultMark | null> = [...athlet.checkpoints.sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0)]

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
                    if (mark.created.toDate() > this.end_time) {
                        mark.elapsed = true
                    } else {
                        if (i == 0) {
                            last_cp = 0
                        } else {
                            if (clean_marks[i - 1]) {
                                if (clean_marks[i - 1].created == clean_marks[last_cp].created) {
                                    last_cp = i
                                }
                            }
                        }
                    }
                }
            }

            rows.push({
                number: athlet.number,
                athlet: athlet,
                marks: clean_marks,
                last_created: last_cp >= 0 ? clean_marks[last_cp].created : null,
                last_cp: last_cp,
            } as TableRow)


        })

        if (this.competition.result_by_full_circle) {
            for (let row of rows) {
                const [last_circle, last_first_cp] = this.getLastCircle(row.marks)
                if (last_circle) {
                    row.last_created = last_circle.pop().created
                    row.last_cp = last_first_cp
                }
            }
        }

        rows = rows.sort((a: TableRow, b: TableRow) => {
            if (a.last_cp < b.last_cp) {
                return 1
            } else if (a.last_cp > b.last_cp) {
                return -1
            } else {
                if (a.last_created < b.last_created) {
                    return -1
                } else if (a.last_created > b.last_created) {
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

    diffTime(_created: any) {
        const created = moment(_created.toDate())

        if (created > this.start_time) {
            created.diff(this.start_time, 'ms')
        }


        const zero_time = new Date(Date.UTC(this.start_time.year(), this.start_time.month(), this.start_time.day(), 0, 0, 0, 0))

        if (created > this.start_time) {
            zero_time.setMilliseconds(created.diff(this.start_time, 'ms') + zero_time.getTimezoneOffset() * 60000)
            // return created$.diff(this.start_time, 'seconds')
            // console.log(
            //     moment({h:0, m:0, s:0, ms:0})
            // )
            return [zero_time.getHours(), zero_time.getMinutes(), zero_time.getSeconds()].join(':')


            // const duration = moment.duration(created$.diff(this.start_time))
            //
            // return [duration.hours(), duration.minutes(), duration.seconds()].join(":")

            // return created$.diff(this.start_time, 'milliseconds')
            // return moment({seconds: created$.diff(this.start_time, 'seconds')}).format('HH:mm:ss')

            // return moment(
            // ).utc(true).format('HH:mm:ss')
            // return moment.duration(
            //
            // ).as('asMinutes')

            // return moment.utc(
            //
            // ).format('HH:mm:ss')
        }
    }

    getCsvData(data: Array<any>) {
        // let row = {}
        // for (let header of this.displayedColumns) {
        //     row[header] = header
        // }

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

    isLastCp(index: number): boolean {
        const cp_in_circle = this.checkpoints.length / this.circles
        return (index % cp_in_circle) == (cp_in_circle - 1)
    }

    getLastCircle(marks: Array<ResultMark>): [Array<ResultMark>, number] {
        const cp_in_circle = this.checkpoints.length / this.circles
        let circles_marks: Array<Array<ResultMark>> = _.chunk(marks, cp_in_circle)
        circles_marks = circles_marks.filter((circle: Array<ResultMark | null>) => circle.filter((mark) => {
            if (mark) {
                if (!mark.elapsed) {
                    return true
                }
            }
            return false
        }).length == cp_in_circle)
        return [circles_marks.pop(), circles_marks.length * cp_in_circle]
    }

    getTzOffset(timezone: string) {
        return moment.tz(timezone).format('z')
    }

    trackByIndex(index, item) {
        return index
    }
}
