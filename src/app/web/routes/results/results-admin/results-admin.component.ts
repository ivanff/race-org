import { Component, OnInit } from '@angular/core'
import {ActivatedRoute, Router} from "@angular/router"
import {Competition} from "@src/app/shared/interfaces/competition"
import {LocalStorageService} from "angular-2-local-storage"

@Component({
  selector: 'app-results-admin',
  templateUrl: './results-admin.component.html',
  styleUrls: ['./results-admin.component.scss']
})
export class ResultsAdminComponent implements OnInit {
  hasChildren: boolean
  competition: Competition
  active_tab: number = 0

  private active_tab_key: string

  constructor(private route: ActivatedRoute,
              private router: Router,
              private localStorageService: LocalStorageService,) {
    this.competition = this.route.snapshot.data['competition'] as Competition
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    //TODO зачем это тут?
    this.hasChildren = Boolean(route.children.length)

    this.active_tab_key = `ActiveTabResults_${this.competition.id}`
    const active_tab: number = this.localStorageService.get(this.active_tab_key) || 0
    if (active_tab < this.competition.classes.length) {
      this.active_tab = active_tab
    }
  }

  ngOnInit() {
  }

  setActiveTab($event: number) {
    this.active_tab = $event
    this.localStorageService.set(this.active_tab_key, $event)
  }

}
