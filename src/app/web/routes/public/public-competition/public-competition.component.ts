import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute} from "@angular/router"
import {AngularFirestore} from "@angular/fire/firestore"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Observable, ReplaySubject} from "rxjs"
import {MatSort, MatTableDataSource} from "@angular/material"
import {takeUntil, tap} from "rxjs/operators"
import {FormControl, FormGroup} from "@angular/forms"

interface PublicTableRow {
  number: number,
  fio: string,
  class: string
}

@Component({
  selector: 'app-public-competition',
  templateUrl: './public-competition.component.html'
})
export class PublicCompetitionComponent implements OnInit, OnDestroy {
  protected _onDestroy = new ReplaySubject<any>(1)
  private competition: Competition
  private athlets$: Observable<Athlet[]>

  dataSource = new MatTableDataSource<PublicTableRow>([])
  displayedColumns: string[] = ['number', 'fio', 'class']
  filterAthlets: FormGroup

  @ViewChild(MatSort, {static: true}) sort: MatSort

  constructor(private router: ActivatedRoute, private afs: AngularFirestore) {
    this.competition = this.router.snapshot.data['competition']
    this.afs.collection<Competition>('competitions').doc(this.competition.id).valueChanges().pipe(
        takeUntil(this._onDestroy)
    ).subscribe((next: Competition) => {
      this.competition = next
    })

    this.athlets$ = this.afs.collection<Athlet>(`athlets_${this.competition.id}`, (ref => ref.orderBy('created', 'desc'))).valueChanges().pipe(
        tap((athlets: Array<Athlet>) => {
          this.dataSource.data = athlets.map((item) => {
            return {
              number: item.number,
              fio: item.fio,
              class: item.class,
              created: item.created
            } as PublicTableRow
          })
          console.log( this.dataSource.data )
        }),
        takeUntil(this._onDestroy)
    )
    this.athlets$.subscribe()
  }

  ngOnInit() {
    this.sort.sort({id: 'created', start: 'desc', disableClear: false})
    this.dataSource.sort = this.sort
    this.dataSource.sortingDataAccessor = (item, property) => {
      return item[property]
    }

    this.dataSource.filterPredicate = (item: PublicTableRow, filter: string) => {
      const data: {search: string, class: string} | null = JSON.parse(filter)
      let result = true

      if (!data) {
        result = true
      } else {
        const search = data.search.trim().toLowerCase()
        const _class = data.class.trim().toLowerCase()

        if (data.search.length) {
          if (parseInt(search).toString() == search) {
            if (item.number.toString().indexOf(search) >= 0) {
              result = true
            } else {
              result = false
            }
          } else if (item.fio.toLowerCase().indexOf(search) >= 0) {
            result = true
          } else {
            result = false
          }
        }
        if (_class.length) {
          if (item.class != _class) {
            result = false
          }
        }
      }
      return result
    }

    this.filterAthlets = new FormGroup({
      'search': new FormControl('', []),
      'class': new FormControl('', [])
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

  private applyFilter(data: {search: string, class: string} | null): void {
    if (!data) {
      this.dataSource.filter = JSON.stringify(null)
    } else {
      this.dataSource.filter = JSON.stringify(data)
    }
  }

  getTitle(): string {
    return this.competition.title
  }

  getClasses(): string[] {
    return this.competition.classes
  }

}
