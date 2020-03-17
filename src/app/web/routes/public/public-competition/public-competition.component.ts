import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute} from "@angular/router"
import {AngularFirestore} from "@angular/fire/firestore"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Observable, ReplaySubject} from "rxjs"
import {MatSort} from "@angular/material"
import {shareReplay, startWith, takeUntil, tap} from "rxjs/operators"
import {FormControl, FormGroup} from "@angular/forms"

@Component({
  selector: 'app-public-competition',
  templateUrl: './public-competition.component.html'
})
export class PublicCompetitionComponent implements OnInit, OnDestroy {
  protected _onDestroy = new ReplaySubject<any>(1)
  competition: Competition

  athlets$: Observable<Athlet[]>

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
        shareReplay(1)
    )
    this.filterAthlets = new FormGroup({
      'search': new FormControl('', []),
      'class': new FormControl('', [])
    })
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this._onDestroy.next(null)
    this._onDestroy.complete()
  }

  getTitle(): string {
    return this.competition.title
  }

  getClasses(): string[] {
    return this.competition.classes
  }

  onActivate($event: any): void {
    $event.filterForm = this.filterAthlets

    if ($event.hasOwnProperty('athlets$')) {
      this.athlets$.subscribe((athlets: Array<Athlet>) => {
        $event.athlets$.next(athlets)
      })
    }

    this.filterAthlets.statusChanges.pipe(
        startWith(this.filterAthlets.status)
    ).subscribe((next) => {
      if (next == 'VALID') {
        $event.applyFilter(this.filterAthlets.value)
      } else {
        $event.applyFilter(null)
      }
    })
  }

  onDeactivate($event: any): void {
    if ($event.hasOwnProperty('athlets$')) {
      this._onDestroy.next(null)
    }
  }

}
