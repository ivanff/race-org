import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms"
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material"
import * as firebase from "firebase"


@Component({
  selector: 'app-result-set-time',
  templateUrl: './result-set-time.component.html',
  styleUrls: ['./result-set-time.component.scss']
})
export class ResultSetTimeComponent implements OnInit {
  setTimeForm: FormGroup
  time: string = '00:00:00'

  constructor(private _fb: FormBuilder,
              private dialogRef: MatDialogRef<ResultSetTimeComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {

  }

  ngOnInit() {
    this.setTimeForm = this._fb.group({
      date: [this.data.start_time, []],
      time: ['17:00:00', []]
    })
  }

  onEnter(valid: boolean) {
    if (valid) {
      const times: Array<number> = this.setTimeForm.controls['time'].value.split(':').map((item) => parseInt(item))

      this.dialogRef.close(
          firebase.firestore.Timestamp.fromMillis(
              this.setTimeForm.controls['date'].value.clone().set('hour', times[0]).set('minutes', times[1]).set('seconds', times[2]).format('x')
          )
      )
    }
  }

}
