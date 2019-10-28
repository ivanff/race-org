import {Component, OnDestroy, OnInit} from '@angular/core'
import {RouterExtensions} from "nativescript-angular"
import {device} from "tns-core-modules/platform"
import * as dialogs from "tns-core-modules/ui/dialogs"
import {PromptResult} from "tns-core-modules/ui/dialogs"
import {firestore} from "nativescript-plugin-firebase"
import {Competition} from "@src/app/shared/interfaces/competition"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {BaseComponent} from "@src/app/shared/base.component"
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {ReplaySubject} from "rxjs"
import {filter, skip, takeUntil} from "rxjs/operators"
import * as _ from "lodash"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-competition',
    templateUrl: './competition.component.html',
    styleUrls: ['./competition.component.scss']
})
export class CompetitionComponent extends BaseComponent implements OnInit, OnDestroy {
    competitions: Competition[] = []
    selected_competition: Competition
    collection: firestore.CollectionReference = firebase.firestore().collection('competitions')
    mobile_device: MobileDevice = {
        uuid: device.uuid,
        deviceType: device.deviceType,
        osVersion: device.osVersion,
        model: device.model,
        isAdmin: false
    }
    private destroy = new ReplaySubject<any>(1)

    constructor(public routerExtensions: RouterExtensions,
                private auth: AuthService,
                private _competition: CompetitionService) {
        super(routerExtensions)
        this.selected_competition = this._competition.selected_competition

        this._competition.selected_competition_id$.pipe(
            takeUntil(this.destroy)
        ).subscribe((competition: Competition) => {
            console.log('>> CompetitionComponent constructor')
            this.selected_competition = competition
            if (competition) {
                if (!this.competitions.filter((item: Competition) => item.id == competition.id).length) {
                    this.competitions.unshift({...competition})
                }
            }
        })
    }

    ngOnInit() {
        this.collection.where('user', '==', this.auth.user.uid).get().then((docs) => {
            docs.forEach((doc) => {
                const id = doc.id
                this.competitions.push(
                    {id, ...doc.data()} as Competition
                )
            })
            if (this.selected_competition) {
                if (!this.competitions.filter((item: Competition) => item.id == this.selected_competition.id).length) {
                    this.competitions.unshift({...this.selected_competition})
                }
            }

        })
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
        console.log('>> CompetitionComponent ngOnDestroy')
    }

    onItemTap($event): void {
        const competition = {...this.competitions[$event.index]}

        if (this.selected_competition && competition.id == this.selected_competition.id) {
            competition.mobile_devices = competition.mobile_devices.filter((item: MobileDevice) => item.uuid !== this.mobile_device.uuid)
            this._competition.selected_competition_id$.next(null)
            this.collection.doc(competition.id).set(competition, {merge: true})
        } else {
            this._competition.selected_competition_id$.next(competition.id)
        }
    }

    isReader(checkpoints: Checkpoint[]): boolean {
        return checkpoints.filter((item: Checkpoint) => item.devices.indexOf(device.uuid) > -1).length > 0
    }
}
