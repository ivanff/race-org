import {Component, OnInit} from '@angular/core';
import * as email from "nativescript-email";
import {compose} from "nativescript-email";

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

    constructor() {
    }

    ngOnInit() {
        email.available().then((avail: boolean) => {
            console.log("Email available? " + avail);
        })
    }

    onMailTo(): void {
        email.compose({
            subject: "[Race Org]Предложение по приложению",
            body: "",
            to: ['agestart@gmail.com'],
        }).then(
            function () {
                console.log("Email composer closed");
            }, function (err) {
                console.log("Error: " + err);
            });
    }

}
