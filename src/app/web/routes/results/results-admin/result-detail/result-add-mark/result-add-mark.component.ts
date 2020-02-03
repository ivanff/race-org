import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms"
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material"
import * as firebase from "firebase/app"
import {ResultMark} from "@src/app/web/routes/results/results.component"

@Component({
  selector: 'app-result-add-mark',
  templateUrl: './result-add-mark.component.html',
  styleUrls: ['./result-add-mark.component.scss']
})
export class ResultAddMarkComponent implements OnInit {
  addMarkForm: FormGroup
  mark: {order?: number, time?: string} = {}

  constructor(private _fb: FormBuilder,
              private dialogRef: MatDialogRef<ResultAddMarkComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {

  }

  ngOnInit() {
    this.addMarkForm = this._fb.group({
      order: ['', []],
      time: ['', []]
    })
  }

  onEnter(valid: boolean) {
    if (valid) {
      const result: Array<number> = this.mark.time.split(':').map((item) => parseInt(item))
      this.dialogRef.close(<ResultMark>{
        competition_id: this.data.competition_id,
        order: this.mark.order,
        manual: true,
        created: firebase.firestore.Timestamp.fromMillis(
            this.data.start_time.clone().set('hour', result[0]).set('minutes', result[1]).set('seconds', result[2]).format('x')
        )
      })
    }
  }
}
