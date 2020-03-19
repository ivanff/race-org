import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core'
import {MatSort, MatTableDataSource} from '@angular/material'
import * as moment from 'moment-timezone'
import {Mark} from "@src/app/shared/interfaces/mark"
import {ActivatedRoute} from "@angular/router"
import {Competition} from "@src/app/shared/interfaces/competition"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {StartListGroup} from "@src/app/shared/interfaces/start-list"


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
    selector: 'app-results-lock',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsLockComponent implements OnInit, AfterViewInit, OnDestroy {
    dataSource = new MatTableDataSource<TableRow>([])
    displayedColumns: string[] = ['place', 'score', 'number', 'class', 'athlet']

    hide_place = false
    checkpoints: Array<Checkpoint> = []
    end_time: moment
    circles: number

    @Input('classes') classes: Array<string> = []
    @Input('competition') competition: Competition
    @Input('start_time') start_time: moment
    @Output() onActivate = new EventEmitter<any>()
    @ViewChild(MatSort, {static: true}) sort: MatSort

    constructor(private route: ActivatedRoute) {
        this.hide_place = this.route.snapshot.data['hide_place']

        if (this.hide_place) {
            this.displayedColumns.shift()
        }

    }

    ngAfterViewInit() {
        this.end_time = this.start_time.clone().add(this.competition.duration, 's')
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
        this.checkpoints = this.competition.results[this.classes[0]].checkpoints
        this.displayedColumns = this.competition.results[this.classes[0]].displayedColumns
        this.dataSource.data = this.competition.results[this.classes[0]].data
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
    }

    ngOnDestroy(): void {
    }

    private applyFilter(data: {search: string} | null): void {
        if (!data) {
            this.dataSource.filter = JSON.stringify(null)
        } else {
            this.dataSource.filter = JSON.stringify(data)
        }
    }

    isLastCp(index: number): boolean {
        const cp_in_circle = this.checkpoints.length / this.circles
        return (index % cp_in_circle) == (cp_in_circle - 1)
    }

    getTzOffset(timezone: string) {
        return moment.tz(timezone).format('z')
    }

    trackByIndex(index, item) {
        return index
    }
}
