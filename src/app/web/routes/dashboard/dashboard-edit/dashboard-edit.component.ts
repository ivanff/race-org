import { Component, OnInit } from '@angular/core';
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute, Router} from "@angular/router"

@Component({
  selector: 'app-dashboard-edit',
  templateUrl: './dashboard-edit.component.html',
  styleUrls: ['./dashboard-edit.component.scss']
})
export class DashboardEditComponent implements OnInit {
  athlet: Athlet
  competition: Competition

  constructor(private router: ActivatedRoute, private route: Router) {
    this.competition = this.router.snapshot.data['competition']
    this.athlet = this.router.snapshot.data['athlet']
  }

  ngOnInit() {
  }

  onCreated(athlet: Athlet) {
    this.route.navigate(['edit', this.competition.id])
  }

}
