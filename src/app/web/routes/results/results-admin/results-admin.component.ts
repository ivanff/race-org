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
  classes: Array<string> = []

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(() => {
      this.classes = (this.route.snapshot.data['competition'] as Competition).classes
    })
    this.hasChildren = Boolean(route.children.length)
  }

  ngOnInit() {
  }
}
