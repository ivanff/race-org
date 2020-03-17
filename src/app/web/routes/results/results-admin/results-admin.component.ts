import { Component, OnInit } from '@angular/core'
import {ActivatedRoute, Router} from "@angular/router"
import {Competition} from "@src/app/shared/interfaces/competition"
import {LocalStorageService} from "angular-2-local-storage"
import * as moment from 'moment-timezone'
import {ResultMark} from "@src/app/web/routes/results/results.component"
import {FormControl, FormGroup} from "@angular/forms"

@Component({
  selector: 'app-results-admin',
  templateUrl: './results-admin.component.html',
  styleUrls: ['./results-admin.component.scss']
})
export class ResultsAdminComponent implements OnInit {
  competition: Competition
  active_tab: number = 0
  start_time: moment
  now: Date = new Date()

  private csv_export_options = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalseparator: '.',
    showLabels: true,
    headers: [],
    showTitle: true,
    title: 'Результаты',
    useBom: false,
    removeNewLines: true,
    keys: [],
  }
  filterAthlets: FormGroup
  filteredData: Array<any> = []
  private active_tab_key: string

  constructor(public route: ActivatedRoute,
              public router: Router,
              public localStorageService: LocalStorageService,) {
    this.competition = this.route.snapshot.data['competition'] as Competition
    this.router.routeReuseStrategy.shouldReuseRoute = () => false

    this.active_tab_key = `ActiveTabResults_${this.competition.id}`
    const active_tab: number = this.localStorageService.get(this.active_tab_key) || 0
    if (active_tab < this.competition.classes.length) {
      this.active_tab = active_tab
    }

    this.start_time = moment(this.competition.start_date.toMillis()).add(this.competition.start_time, 's')
    this.filterAthlets = new FormGroup({
      'search': new FormControl('', []),
    })
  }

  ngOnInit() {
  }

  setActiveTab($event: number) {
    this.active_tab = $event
    this.localStorageService.set(this.active_tab_key, $event)
  }


  lockPublishResults(): void {}

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
            row['group'] = item.group ? item.group.id : ""
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

  onActivate($event): void {
    this.csv_export_options.keys = $event.displayedColumns
    this.csv_export_options.headers = $event.displayedColumns

    $event.dataSource.connect().subscribe((rows) => {
      this.filteredData = rows
    })

    this.filteredData = $event.dataSource.filteredData
    this.filterAthlets.statusChanges.subscribe((next) => {
      if (next == 'VALID') {
        $event.applyFilter({
          search: this.filterAthlets.value.search
        })
      } else {
        $event.applyFilter(null)
      }
    })
  }
}
