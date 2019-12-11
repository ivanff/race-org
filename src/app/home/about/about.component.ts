import {Component, OnInit} from '@angular/core';
import * as email from "nativescript-email";
import {localize as L} from "nativescript-localize"

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html'
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
            subject: L("[Race Org] Suggestion about application"),
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
