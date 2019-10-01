import { Component, OnInit } from '@angular/core'
import {ActivatedRoute} from "@angular/router"

@Component({
  selector: 'app-results-admin',
  templateUrl: './results-admin.component.html',
  styleUrls: ['./results-admin.component.scss']
})
export class ResultsAdminComponent implements OnInit {
  circle = 5
  classes_checkpoints_map = {}
  classes = ['open', 'hobby']

  constructor(public route: ActivatedRoute) {}

  ngOnInit() {
  }

  onActivate(comRef) {
    comRef.circle = this.circle
    comRef.checkpoints = this.classes_checkpoints_map[comRef.athlet.class]
  }

  checkpointsHandler($event: any) {
    $event.classes.forEach((cl: string) => {
      this.classes_checkpoints_map[cl] = $event.checkpoints
    })
  }

  keysLength(obj: any): number {
    return Object.keys(obj).length
  }

}
