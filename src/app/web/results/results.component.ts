import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core'
import {AngularFirestore} from '@angular/fire/firestore'

import {from, of, zip} from 'rxjs'
import {groupBy, map, mergeMap, toArray} from 'rxjs/operators'
import {MatSort, MatTableDataSource} from '@angular/material'
import * as moment from 'moment'
import {NgxTimepickerFieldComponent} from 'ngx-material-timepicker'
import {Athlet} from "@src/app/home/athlet"
import {Mark} from "@src/app/home/mark"
import {CheckPoint} from "@src/app/home/checkpoint"

export interface TableRow {
    place: number,
    number: number,
    athlet: Athlet,
    marks: Array<Mark>,
    last_created: Date,
    last_cp: number,
}

const today = moment().startOf('day')

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, AfterViewInit {
    dataSource = new MatTableDataSource<TableRow>([])
    displayedColumns: string[] = ['place', 'number', 'athlet']

    circles = 3
    checkpoints: Array<CheckPoint> = []
    start_time = today.clone()

    @ViewChild('picker', {static: true}) picker: NgxTimepickerFieldComponent
    @ViewChild(MatSort, {static: true}) sort: MatSort

    constructor(private firestore: AngularFirestore) {
    }

    private range = (start, end, delta) => {
        return Array.from(
            {length: (end - start) / delta}, (v, k) => (k * delta) + start
        )
    }

    ngAfterViewInit() {
        this.picker.registerOnChange((timestr) => {
            const time_parts = timestr.split(':')
            this.start_time = today.clone()
            this.start_time.add(time_parts[0], 'hours')
            this.start_time.add(time_parts[1], 'minutes')
            return timestr
        })
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
            if (data.number.toString().indexOf(filter) >= 0) {
                return true
            } else if (data.athlet.fio.toLocaleLowerCase().indexOf(filter) >= 0) {
                return true
            }
            return false
        }

        this.firestore.collection('checkpoints', ref => ref.orderBy('order')).valueChanges().subscribe((doc: Array<CheckPoint>) => {
            this.checkpoints = []
            this.range(0, this.circles, 1).forEach(() => {
                doc.forEach((checkoint: CheckPoint) => {
                    this.checkpoints.push(checkoint)
                })
            })
            this.checkpoints.forEach((checkpoint: CheckPoint, y: number) => {
                this.displayedColumns.push(checkpoint.key + '_' + y)
            })
        })
        this.firestore.collection('athlets').valueChanges().subscribe((doc: Array<Athlet>) => {
            let rows: Array<TableRow> = []
            doc.forEach((athlet: Athlet) => {
                const marks: Array<Mark> = []
                let last_created: Date = null
                let last_cp = -1

                from(athlet.checkpoints.sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0)).pipe(
                    groupBy((mark: Mark) => mark.key),
                    mergeMap((group) => zip(of(group.key), group.pipe(toArray())))
                ).subscribe((groups) => {
                    const key = groups[0]
                    const group_marks: Array<Mark> = groups[1]
                    this.checkpoints.forEach((checkpoint: CheckPoint, i: number) => {
                        if (!marks[i]) {
                            marks[i] = null
                        }
                        if (checkpoint.key === key) {
                            marks[i] = group_marks.shift() || null
                        }

                        if ((i === 0) && marks[i]) {
                            last_created = marks[i].created
                            last_cp = i
                        }
                        if ((i > 0) && marks[i]) {
                            if (marks[i - 1]) {
                                if (marks[i - 1].created === last_created) {
                                    last_created = marks[i].created
                                    last_cp = i
                                }
                            }
                        }
                    })
                })
                rows.push({
                    number: athlet.number,
                    athlet: athlet,
                    marks: marks,
                    last_created: last_created,
                    last_cp: last_cp,
                } as TableRow)
            })
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
        })
    }

    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase()
    }

    diffTime(created: any) {
        const created$ = moment(created.toDate())

        if (created$ > this.start_time) {
            return moment.utc(
                moment.duration(
                    created$.diff(this.start_time)
                ).as('milliseconds')
            ).format('HH:mm:ss')
        }
    }

    onStart($event) {
        this.start_time = moment()
    }
}
