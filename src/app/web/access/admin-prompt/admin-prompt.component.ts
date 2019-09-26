import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material"
import {FormBuilder, FormGroup, Validators} from "@angular/forms"

@Component({
  selector: 'app-admin-prompt',
  templateUrl: './admin-prompt.component.html',
  styleUrls: ['./admin-prompt.component.scss']
})
export class AdminPromptComponent implements OnInit {
  code = ""
  promptForm: FormGroup

  constructor(public dialogRef: MatDialogRef<AdminPromptComponent>,
              public _fb: FormBuilder,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.promptForm = this._fb.group({
      code: ['', [<any>Validators.minLength(4), <any>Validators.required]],
    })
  }

  onEnter(valid: boolean) {
    if (valid) {
      this.dialogRef.close(this.code)
    }
  }

}
