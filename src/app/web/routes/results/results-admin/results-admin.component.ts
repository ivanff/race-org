import { Component, OnInit } from '@angular/core'
import {ActivatedRoute} from "@angular/router"
import {Competition} from "@src/app/shared/interfaces/competition"

@Component({
  selector: 'app-results-admin',
  templateUrl: './results-admin.component.html',
  styleUrls: ['./results-admin.component.scss']
})
export class ResultsAdminComponent implements OnInit {
  hasChildren: boolean
  competition: Competition

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(() => {
      this.competition = this.route.snapshot.data['competition'] as Competition
    })
    this.hasChildren = Boolean(route.children.length)
  }

  ngOnInit() {
  }
}
