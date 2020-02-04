import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {BehaviorSubject} from "rxjs"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Competition} from "@src/app/shared/interfaces/competition"
import {MatSort, MatTableDataSource} from "@angular/material"
import {ActivatedRoute} from "@angular/router"

interface PublicTableResultRow {
  place: number,
  number: number,
  fio: string,
  class: number,
}


@Component({
  selector: 'app-public-competition-results',
  templateUrl: './public-competition-results.component.html'
})
export class PublicCompetitionComponentResults implements OnInit, OnDestroy {
  private athlets$ = new BehaviorSubject<Athlet[]>([])
  private competition: Competition

  displayedColumns: string[] = ['place', 'fio', 'number']
  dataSource = new MatTableDataSource<any>([])

  @ViewChild(MatSort, {static: true}) sort: MatSort

  constructor(private route: ActivatedRoute){
    this.competition = route.snapshot.data['competition']
    this.athlets$.subscribe((athlets: Athlet[]) => {
      this.dataSource.data = athlets.map((item) => {
        return {

        }
      })
    })
  }

  ngOnInit(): void {
    this.sort.sort({id: 'created', start: 'desc', disableClear: false})
    this.dataSource.sort = this.sort
    this.dataSource.sortingDataAccessor = (item, property) => {
      return item[property]
    }

    this.dataSource.filterPredicate = (item: PublicTableResultRow, filter: string) => {
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
  }

  private applyFilter(data: {search: string, class: string} | null): void {
    if (!data) {
      this.dataSource.filter = JSON.stringify(null)
    } else {
      this.dataSource.filter = JSON.stringify(data)
    }
  }

  ngOnDestroy(): void {
    this.athlets$.unsubscribe()
  }
}

