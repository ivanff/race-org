import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core'
import {AngularFirestore} from '@angular/fire/firestore'
import {BehaviorSubject, from, Observable, of, zip} from 'rxjs'
import {groupBy, map, mergeMap, toArray} from 'rxjs/operators'
import {MatSort, MatTableDataSource} from '@angular/material'
import * as moment from 'moment'
import {NgxTimepickerFieldComponent} from 'ngx-material-timepicker'
import {Athlet} from "@src/app/home/athlet"
import {Mark} from "@src/app/home/mark"
import {CheckPoint} from "@src/app/home/checkpoint"
import {ActivatedRoute} from "@angular/router"
import {LocalStorageService} from "angular-2-local-storage"


export interface TableRow {
    place: number,
    number: number,
    athlet: Athlet,
    marks: Array<Mark>,
    last_created: Date,
    last_cp: number
}

export interface Filter {
    str: string
    class: string
}

const today = moment().startOf('day')

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, AfterViewInit {
    dataSource = new MatTableDataSource<TableRow>([])
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
    competition_minutes = 60 * 2 + 30

    hide_start_time = false
    hide_place = false
    hide_class_filter = false
    checkpoints: Array<CheckPoint> = []
    start_time = today.clone()
    end_time = today.clone()
    athlets: Array<Athlet> = []

    @Input('circles') circles: number = 5
    @Input('classes') classes: Array<string> = ['open', 'hobby']

    @ViewChild('picker', {static: true}) picker: NgxTimepickerFieldComponent
    @ViewChild(MatSort, {static: true}) sort: MatSort

    constructor(private firestore: AngularFirestore,
                private _localStorageService: LocalStorageService,
                private route: ActivatedRoute) {
        this.hide_start_time = route.snapshot.data['hide_start_time']
        this.hide_class_filter = route.snapshot.data['hide_class_filter']
        this.hide_place = route.snapshot.data['hide_place']
        if (this.hide_place) {
            this.displayedColumns.shift()
        }

        if (this._localStorageService.get('start_time')) {
            this.start_time = moment(this._localStorageService.get('start_time'))
            this.end_time = this.start_time.clone().add(this.competition_minutes, 'minutes')
        }

    }

    private range = (start, end, delta) => {
        return Array.from(
            {length: (end - start) / delta}, (v, k) => (k * delta) + start
        )
    }


    ngAfterViewInit() {}

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

        this.firestore.collection('checkpoints', ref => ref.orderBy('order')).valueChanges().subscribe((doc: Array<CheckPoint>) => {
            this.checkpoints = []
            this.range(0, this.circles, 1).forEach(() => {
                doc.forEach((checkoint: CheckPoint) => {
                    this.checkpoints.push(checkoint)
                })
            })
            if (this.displayedColumns.indexOf('CP1_0') >= 0) {
                this.displayedColumns = [...this.displayedColumns.slice(0, this.displayedColumns.indexOf('CP1_0'))]
            }

            this.checkpoints.forEach((checkpoint: CheckPoint, y: number) => {
                this.displayedColumns.push(checkpoint.key + '_' + y)
            })
        })
        this.firestore.collection('athlets').valueChanges().subscribe((doc: Array<Athlet>) => {
            this.athlets = doc.filter((athlet: Athlet) => this.classes.indexOf(athlet.class) >= 0)
            this.buildRows()
        })
    }

    buildRows() {
        let rows: Array<TableRow> = []
        this.athlets.forEach((athlet: Athlet) => {
            const marks: Array<Mark | null> = []
            const clean_marks: Array<Mark> = [...athlet.checkpoints.sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0)]
            let last_cp = -1

            for ( const i of this.range(0, 16, 1)) {
                if ([0,4,8,12].indexOf(i) >= 0) {
                    if(!clean_marks[i]) {
                        clean_marks[i] = {
                            missing: true,
                            created: (clean_marks[i-1] || {created: null}).created,
                            key: 'CP1',
                            order: 0
                        }
                    }

                    if (clean_marks[i].order !== 0) {
                        clean_marks.splice(i, 0, {
                            missing: true,
                            created: clean_marks[i].created,
                            key: 'CP1',
                            order: 0
                        })
                    }
                }
                else if ([1,5,9,13].indexOf(i) >= 0) {

                    if(!clean_marks[i]) {
                        clean_marks[i] = {
                            missing: true,
                            created: clean_marks[i-1].created,
                            key: 'CP2',
                            order: 1
                        }
                    }

                    if (clean_marks[i].order !== 1) {
                        clean_marks.splice(i, 0, {
                            missing: true,
                            created: clean_marks[i].created,
                            key: 'CP2',
                            order: 1
                        })
                    }
                }
                else if ([2,6,10,14].indexOf(i) >= 0) {

                    if(!clean_marks[i]) {
                        clean_marks[i] = {
                            missing: true,
                            created: clean_marks[i-1].created,
                            key: 'CP3',
                            order: 2
                        }
                    }

                    if (clean_marks[i].order !== 2) {
                        clean_marks.splice(i, 0, {
                            missing: true,
                            created: clean_marks[i].created,
                            key: 'CP3',
                            order: 2
                        })
                    }
                }
                else if ([3,7,11,15].indexOf(i) >= 0) {

                    if(!clean_marks[i]) {
                        clean_marks[i] = {
                            missing: true,
                            created: clean_marks[i-1].created,
                            key: 'CP4',
                            order: 3
                        }
                    }

                    if (clean_marks[i].order !== 3) {
                        clean_marks.splice(i, 0, {
                            missing: true,
                            created: clean_marks[i].created,
                            key: 'CP4',
                            order: 3
                        })
                    }
                }
            }


            from(clean_marks).pipe(
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
                        // console.log(
                        //     [...group_marks]
                        // )
                        const m: any = group_marks.shift() || null
                        if (m) {
                            if (m.hasOwnProperty('missing')) {
                                marks[i] = null
                            } else {
                                marks[i] = m
                            }
                        }

                    }

                    if (marks[i]) {
                        if (moment(marks[i].created.toDate()) <= this.end_time) {
                            if (i == 0) {
                                last_cp = i
                            } else {
                                if (marks[i - 1]) {
                                    if (marks[i - 1].created === marks[last_cp].created) {
                                        last_cp = i
                                    }
                                }
                            }
                        }
                    }


                    // if (last_created) {
                    //     if (moment(last_created.toDate()) > this.start_time.add(this.competition_minutes, 'minutes')) {
                    //         last_created = null
                    //     }
                    // }
                })
            })
            rows.push({
                number: athlet.number,
                athlet: athlet,
                marks: marks,
                last_created: last_cp >= 0 ? marks[last_cp].created : null,
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
    }

    getElapsed(date: any): boolean {
        // return false
        return moment(date.toDate()) > this.end_time
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

    onSetStartTime($event) {
        const time_parts = this.picker.timepickerTime.split(':')
        this.start_time = today.clone()
        this.start_time.add(time_parts[0], 'hours').add(time_parts[1], 'minutes')
        this.end_time = this.start_time.clone().add(this.competition_minutes, 'minutes')

        this._localStorageService.set('start_time', this.start_time.format())

        this.buildRows()
    }

    getCsvData(data: Array<any>) {
        // let row = {}
        // for (let header of this.displayedColumns) {
        //     row[header] = header
        // }

        let rows: Array<any> = []

        data.map((item) => {
            let row = {}
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
                        if (/^CP\d+_\d+$/.test(key)) {
                            const result = /^CP\d+_(?<index>\d+)$/.exec(key)
                            const mark: Mark | undefined = item.marks[parseInt(result.groups.index)]

                            if (mark) {
                                row[key] = moment(mark.created.toDate()).format('HH:mm:ss')
                            } else {
                                row[key] = ''
                            }
                        }
                    }
                }
            }

            rows.push(row)
        })

        return rows
    }
}
