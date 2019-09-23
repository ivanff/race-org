import {Component, OnDestroy, OnInit} from '@angular/core';
import {SettingsService} from "@src/app/shared/settings.service"

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit, OnDestroy {

  constructor() { }

  ngOnInit() {
  }
  ngOnDestroy(): void {
    console.log('ngOnDestroy TestComponent')
  }

}
