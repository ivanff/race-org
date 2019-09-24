import {Component, NgZone, OnDestroy, OnInit} from '@angular/core'
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"
import {firestore} from "nativescript-plugin-firebase"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends BaseComponent implements OnInit, OnDestroy {
    pending: boolean = false
    private unsubscribe: any

    constructor(public routerExtensions: RouterExtensions, private zone: NgZone,) {
        super(routerExtensions)
    }

    ngOnInit() {
        const $zone = this.zone
        const athletsCollRef: firestore.Query = firebase.firestore().collection('athlets')
        this.unsubscribe = athletsCollRef.onSnapshot({},(snapshot: firestore.QuerySnapshot) => {
            $zone.run(() => {
                this.pending = snapshot.metadata.hasPendingWrites
            })
        })
    }

    ngOnDestroy(): void{
        this.unsubscribe()
    }

}
