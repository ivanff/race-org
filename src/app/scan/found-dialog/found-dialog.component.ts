import {Component, OnInit} from '@angular/core';
import {ModalDialogParams} from "nativescript-angular"
import {Athlet} from "@src/app/home/athlet"

@Component({
    selector: 'app-found-dialog',
    templateUrl: './found-dialog.component.html',
    styleUrls: ['./found-dialog.component.scss']
})
export class FoundDialogComponent implements OnInit {
    athlet: Athlet
  
    constructor(private params: ModalDialogParams) {
        this.athlet = params.context.athlet
    }


    ngOnInit() {
    }

    public close() {
        this.params.closeCallback(null)
    }

    public onOpen(): void {
        this.params.closeCallback(['/athlets', this.athlet.phone])
    }
}
