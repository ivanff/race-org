import { Component, OnInit } from '@angular/core';
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute, Router} from "@angular/router"
import {QrAthlet} from "@src/app/shared/interfaces/qr"

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

  onCreated($event) {
    this.route.navigate(['/cabinet', 'edit', this.competition.id])
  }

  getQrData(): string {
    return JSON.stringify({
      id: this.athlet.id,
      number: this.athlet.number,
      competition_id: this.competition.parent_id || this.competition.id
    } as QrAthlet)
  }

}
