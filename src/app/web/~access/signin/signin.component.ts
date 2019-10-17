import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms"

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit {
  signinForm: FormGroup
  constructor(private _fb: FormBuilder) { }

  ngOnInit() {
    this.signinForm = this._fb.group({
      phone: ['', [], []]
    })
  }

}
