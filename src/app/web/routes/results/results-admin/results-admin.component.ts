import {Component, OnDestroy, OnInit} from '@angular/core'
import {ActivatedRoute, Router} from "@angular/router"
import {Competition} from "@src/app/shared/interfaces/competition"
import {LocalStorageService} from "angular-2-local-storage"
import * as moment from 'moment-timezone'
import {ResultMark} from "@src/app/web/routes/results/results.component"
import {FormControl, FormGroup} from "@angular/forms"
import {Observable, ReplaySubject} from "rxjs"
import {AngularFirestore, AngularFirestoreDocument} from "@angular/fire/firestore"
import {takeUntil} from "rxjs/operators"

@Component({
  selector: 'app-results-admin',
  templateUrl: './results-admin.component.html',
  styleUrls: ['./results-admin.component.scss']
})
export class ResultsAdminComponent implements OnInit, OnDestroy {
  competition: Competition
  active_tab: number = 0
  start_time: moment
  now: Date = new Date()
  protected _onDestroy = new ReplaySubject<any>(1)
  private $competition: AngularFirestoreDocument
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
  private filteredData: Array<any> = []
  private lockResultsData: any = {}
  private active_tab_key: string

  constructor(public route: ActivatedRoute,
              public router: Router,
              public localStorageService: LocalStorageService,
              private afs: AngularFirestore) {
    this.competition = this.route.snapshot.data['competition'] as Competition

    if (this.competition.parent_id) {
      this.$competition = this.afs.doc<Competition>(`competitions/${this.competition.parent_id}/stages/${this.competition.id}`)
    } else {
      this.$competition = this.afs.doc<Competition>(`competitions/${this.competition.id}`)
    }

    this.$competition.valueChanges().pipe(
        takeUntil(this._onDestroy)
    ).subscribe((doc) => {
      Object.assign(this.competition, doc)
    })

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

  ngOnDestroy(): void {
    this._onDestroy.next(null)
    this._onDestroy.complete()
  }

  setActiveTab($event: number) {
    this.active_tab = $event
    this.localStorageService.set(this.active_tab_key, $event)
  }


  toggleLockResults(): void {
    const lock_results: boolean = !this.competition.lock_results
    if (lock_results) {
      this.$competition.update({
        lock_results: true,
        results: this.lockResultsData
      })
    } else {
      this.$competition.update({
        lock_results: false,
        results: []
      })
    }
  }

  getCsvData() {
    let rows: Array<any> = []

    this.filteredData.map((item) => {
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
      this.lockResultsData[$event.classes] = {
        data: $event.dataSource.data,
        displayedColumns: $event.displayedColumns,
        checkpoints: $event.checkpoints,
        circles: $event.circles,
      }
    })

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

  getPublicResults(): Array<any> {
    if (this.competition.parent_id) {
      return ['/public', 'competition', this.competition.id, this.competition.parent_id, 'results']
    } else {
      return ['/public', 'competition', this.competition.id, 'results']
    }
  }

}
