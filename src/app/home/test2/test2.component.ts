import {Component, OnDestroy, OnInit} from '@angular/core';

@Component({
  selector: 'app-test2',
  templateUrl: './test2.component.html',
  styleUrls: ['./test2.component.scss']
})
export class Test2Component implements OnInit, OnDestroy {

  constructor() { }

  ngOnInit() {
  }
  ngOnDestroy(): void {
    console.log('ngOnDestroy Test2Component')
  }
}
