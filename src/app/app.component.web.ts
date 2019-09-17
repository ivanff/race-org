import {Component, NgZone, OnInit} from '@angular/core'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    constructor(public zone: NgZone) {
    }

    ngOnInit(): void {}
}
