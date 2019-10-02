import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core'
import {AngularFirestore} from '@angular/fire/firestore'
import {MatSort, MatTableDataSource} from '@angular/material'
import * as moment from 'moment'
import {NgxTimepickerFieldComponent} from 'ngx-material-timepicker'
import {Athlet} from "@src/app/home/athlet"
import {Mark as FbMark} from "@src/app/home/mark"
import {CheckPoint} from "@src/app/home/checkpoint"
import {ActivatedRoute} from "@angular/router"
import {LocalStorageService} from "angular-2-local-storage"
import * as _ from "lodash"


export interface Mark extends FbMark {
    missing?: boolean
    manual?: boolean
    elapsed?: boolean
}


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

const today = moment('2019-09-28').startOf('day')

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
    start_time = today.clone().add(12, 'hours')
    end_time = today.clone().add(14, 'hours').add(30, 'minutes')
    athlets: Array<Athlet> = []
    is_admin: boolean = false

    @Input('circles') circles: number = 5
    @Input('classes') classes: Array<string> = ['open', 'hobby']

    @Output() checkpointsEvent = new EventEmitter<{'classes': Array<string>, 'checkpoints': Array<CheckPoint>}>(true)

    @ViewChild('picker', {static: true}) picker: NgxTimepickerFieldComponent
    @ViewChild(MatSort, {static: true}) sort: MatSort

    constructor(private firestore: AngularFirestore,
                private _localStorageService: LocalStorageService,
                private route: ActivatedRoute) {
        this.hide_start_time = route.snapshot.data['hide_start_time']
        this.hide_class_filter = route.snapshot.data['hide_class_filter']
        this.hide_place = route.snapshot.data['hide_place']
        this.is_admin = route.snapshot.data['is_admin']

        if (this.hide_place) {
            this.displayedColumns.shift()
        }

        if (this._localStorageService.get('start_time')) {
            this.start_time = moment(this._localStorageService.get('start_time'))
            this.end_time = this.start_time.clone().add(this.competition_minutes, 'minutes')
        }
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
            _.range(0, this.circles, 1).forEach(() => {
                doc.forEach((checkpoint: CheckPoint) => {
                    this.checkpoints.push(checkpoint)
                })
            })
            this.checkpointsEvent.emit({
                classes: this.classes,
                checkpoints: this.checkpoints
            })

            this.displayedColumns = [...this.displayedColumns.slice(0, this.displayedColumns.indexOf('athlet') + 1)]

            this.checkpoints.forEach((checkpoint: CheckPoint, y: number) => {
                this.displayedColumns.push(checkpoint.key + '_' + y)
            })
        })
        this.firestore.collection('athlets').valueChanges({idField: 'id'}).subscribe((doc: Array<any>) => {
            this.athlets = doc.filter((athlet: Athlet) => this.classes.indexOf(athlet.class) >= 0)
            this.buildRows()
        })
    }

    private buildRows() {
        let rows: Array<TableRow> = []
        this.athlets.forEach((athlet: Athlet) => {
            const clean_marks: Array<Mark | null> = [...athlet.checkpoints.sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0)]
            const cp_in_circle = (this.checkpoints.length / this.circles)

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
                            if (clean_marks[i-1]) {
                                if(clean_marks[i-1].created == clean_marks[last_cp].created) {
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

        // Если подсчет по полным кругам
        for (let row of rows) {
            const [last_circle, last_first_cp] = this.getLastCircle(row.marks)
            if (last_circle){
                row.last_created = last_circle.pop().created
                row.last_cp = last_first_cp
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


    isLastCp(index: number): boolean {
        const cp_in_circle = this.checkpoints.length / this.circles
        if ((index % cp_in_circle) == (cp_in_circle - 1)) {
            return true
        }
        return false
    }

    getLastCircle(marks: Array<Mark>): [Array<Mark>, number] {
        const cp_in_circle = this.checkpoints.length / this.circles
        let circles_marks: Array<Array<Mark>> = _.chunk(marks, cp_in_circle)
        circles_marks = circles_marks.filter((circle: Array<Mark|null>) => circle.filter((mark) => {
            if (mark) {
                if (!mark.elapsed) {
                    return true
                }
            }
            return false
        }).length == cp_in_circle)
        return [circles_marks.pop(), circles_marks.length * cp_in_circle]
    }
}
