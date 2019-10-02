import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms"
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material"
import {AdminPromptComponent} from "@src/app/web/access/admin-prompt/admin-prompt.component"


@Component({
  selector: 'app-result-set-time',
  templateUrl: './result-set-time.component.html',
  styleUrls: ['./result-set-time.component.scss']
})
export class ResultSetTimeComponent implements OnInit {
  setTimeForm: FormGroup
  time: string = '00:00:00'

  constructor(private _fb: FormBuilder,
              private dialogRef: MatDialogRef<AdminPromptComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {

  }

  ngOnInit() {
    this.setTimeForm = this._fb.group({
      time: ['', []]
    })
  }

  onEnter(valid: boolean) {
    if (valid) {
      this.dialogRef.close(this.time.split(':').map((item) => parseInt(item)))
    }
  }

}
