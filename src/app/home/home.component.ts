import {Component, NgZone, OnDestroy, OnInit} from '@angular/core'
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"
import * as appversion from "nativescript-appversion"


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends BaseComponent implements OnInit, OnDestroy {
    pending: boolean = false
    version = ''
    private unsubscribe: any

    constructor(public routerExtensions: RouterExtensions,
                private zone: NgZone) {
        super(routerExtensions)
        appversion.getVersionName().then((v: string) => {
            this.version = v
        })
    }

    ngOnInit() {
        const $zone = this.zone
        // this.unsubscribe = firebase.firestore().collection(`athlets_${this.options.competition.id}`)
        //     .onSnapshot({includeMetadataChanges: true}, (snapshot: firestore.QuerySnapshot) => {
        //         $zone.run(() => {
        //             this.pending = snapshot.metadata.hasPendingWrites
        //         })
        //     })
    }

    ngOnDestroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe()
        }
    }

}
