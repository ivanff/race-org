import { Component, OnInit } from '@angular/core';
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute} from "@angular/router"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {MatSnackBar} from "@angular/material"

@Component({
  selector: 'app-app-athlet-register',
  templateUrl: './app-athlet-register.component.html',
})
export class AppAthletRegisterComponent implements OnInit {

  competition: Competition

  constructor(private router: ActivatedRoute,
              private _snackBar: MatSnackBar) {
    this.competition = this.router.snapshot.data['competition']
  }

  ngOnInit() {
  }

  onCreated(athlet: Athlet) {
    this._snackBar.open("Поздравляем", `Ждем Вас ${this.competition.start_date.toDate()}`, {
      duration: 5000,
      verticalPosition: "top"
    })
  }
}
