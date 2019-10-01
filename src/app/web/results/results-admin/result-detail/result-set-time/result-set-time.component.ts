import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms"
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material"
import {AdminPromptComponent} from "@src/app/web/access/admin-prompt/admin-prompt.component"
import {LocalStorageService} from "angular-2-local-storage"
import * as moment from "moment"

@Component({
  selector: 'app-result-set-time',
  templateUrl: './result-set-time.component.html',
  styleUrls: ['./result-set-time.component.scss']
})
export class ResultSetTimeComponent implements OnInit {
  setTimeForm: FormGroup
  time: string = '13:19:00'
  start_time: any

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
