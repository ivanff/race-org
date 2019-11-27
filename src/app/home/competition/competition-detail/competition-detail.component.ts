import {Component, OnDestroy, OnInit} from '@angular/core'
import {RouterExtensions} from "nativescript-angular"
import {device} from "tns-core-modules/platform"
import {Competition} from "@src/app/shared/interfaces/competition"
import {BaseComponent} from "@src/app/shared/base.component"
import {ActivatedRoute} from "@angular/router"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import * as _ from "lodash"
import {confirm} from "tns-core-modules/ui/dialogs"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {localize as L} from "nativescript-localize"


@Component({
    selector: 'app-competition-detail',
    templateUrl: './competition-detail.component.html',
})
export class CompetitionDetailComponent extends BaseComponent implements OnInit, OnDestroy {
    competition: Competition

    constructor(public routerExtensions: RouterExtensions,
                private router: ActivatedRoute,
                private _competition: CompetitionService,
                private snackbar: SnackbarService) {
        super(routerExtensions)
        this.competition = this.router.snapshot.data['competition']
    }

    ngOnInit() {
    }

    ngOnDestroy(): void {
    }

    onItemTap($event) {
        const checkpoint = this.competition.checkpoints[$event.index]
        const options = {
            title: '',
            message: checkpoint.devices.indexOf(device.uuid) == -1 ? L('Assign this device as a reader for the checkpoint %s', checkpoint.title) : L('Remove assignment'),
            okButtonText: L('Yes'),
            cancelButtonText: L('No'),
        }
        confirm(options).then((result: boolean) => {
            if (result) {
                this.competition.checkpoints.forEach((item: Checkpoint, index: number) => {
                    if (index == $event.index) {
                        if (item.devices.indexOf(device.uuid) > -1) {
                            item.devices = _.without(item.devices, device.uuid)
                        } else {
                            item.devices.push(device.uuid)
                        }
                    } else {
                        item.devices = _.without(item.devices, device.uuid)
                    }
                })

                this._competition.update(this.competition, {
                    'checkpoints': this.competition.checkpoints
                }).then(() => {
                    this.snackbar.success(
                        this.competition.checkpoints[$event.index].devices.indexOf(device.uuid) > -1 ? L('The device is installed as a reader') : L('The device is removed from the readers checkpoint')
                    )
                }).catch(() => {
                    this.snackbar.alert(
                        L("Error assigning the reader for the checkpoint")
                    )
                })
            }
        })
    }

    isReader(checkpoint: Checkpoint) {
        return checkpoint.devices.indexOf(device.uuid) > -1
    }
}
