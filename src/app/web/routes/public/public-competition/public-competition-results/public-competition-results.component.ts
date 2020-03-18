import {Component, Input, OnDestroy, OnInit} from '@angular/core'
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute} from "@angular/router"
import * as moment from 'moment-timezone'
import {BehaviorSubject, ReplaySubject} from "rxjs"
import {takeUntil} from "rxjs/operators"
import {FormGroup} from "@angular/forms"

export interface PublicTableResultRow {
  place: number,
  number: number,
  fio: string,
  class: string,
}

// http://localhost:4200/public/competition/cwx4XmKJTbL7BTyuCAYK/results
@Component({
  selector: 'app-public-competition-results',
  templateUrl: './public-competition-results.component.html'
})
export class PublicCompetitionComponentResults implements OnInit, OnDestroy {
  public competition: Competition
  protected _onDestroy = new ReplaySubject<any>(1)
  start_time: moment
  $filterValue = new BehaviorSubject(null)
  active_tab: number = 0

  filterForm: FormGroup

  constructor(private route: ActivatedRoute){
    this.competition = route.snapshot.parent.data['competition']
    this.start_time = moment(this.competition.start_date.toMillis()).add(this.competition.start_time, 's')
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._onDestroy.next(null)
    this._onDestroy.complete()
  }
  
  private applyFilter(data: {search: string, class: string} | null): void {
    if (data.class) {
      this.active_tab = this.competition.classes.indexOf(data.class)
    } else {
      if (this.competition.classes.length) {
        this.filterForm.controls['class'].setValue(this.competition.classes[0])
      }
    }
    this.$filterValue.next(data)
  }


  onActivate($event): void {
    this.$filterValue.pipe(
        takeUntil(
            this._onDestroy
        )
    ).subscribe((data) => {
      $event.applyFilter(data)
    })
  }

  setActiveTab($event: number) {
    this.filterForm.controls['class'].setValue(this.competition.classes[$event])
  }
}

