import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {MatSort, MatTableDataSource} from "@angular/material"
import {BehaviorSubject} from "rxjs"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute} from "@angular/router"
import {filterPredicate} from "@src/app/web/shared/utils/tools"

export interface PublicTableAthletRow {
  number: number,
  fio: string,
  class: string
}


@Component({
  selector: 'app-public-competition-athlets',
  templateUrl: './public-competition-athlets.component.html'
})
export class PublicCompetitionComponentAthlets implements OnInit, AfterViewInit, OnDestroy {
  private athlets$ = new BehaviorSubject<Athlet[]>([])
  private competition: Competition

  displayedColumns: string[] = ["number", 'fio', 'class']
  dataSource = new MatTableDataSource<PublicTableAthletRow>([])

  @ViewChild(MatSort, {static: true}) sort: MatSort

  constructor(private route: ActivatedRoute){
    this.competition = route.snapshot.data['competition']
  }

  ngAfterViewInit(): void {
    this.athlets$.subscribe((athlets: Athlet[]) => {
      this.dataSource.data = athlets.map((item) => {
        return {
          number: item.number,
          fio: item.fio,
          class: item.class,
          created: item.created
        } as PublicTableAthletRow
      })
    })
  }

  ngOnInit(): void {
    this.sort.sort({id: 'created', start: 'desc', disableClear: false})
    this.dataSource.sort = this.sort
    this.dataSource.sortingDataAccessor = (item, property) => {
      return item[property]
    }
    this.dataSource.filterPredicate = filterPredicate
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
