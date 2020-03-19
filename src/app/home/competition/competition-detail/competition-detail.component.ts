import {Component, OnDestroy, OnInit, ViewContainerRef} from '@angular/core'
import {ModalDialogOptions, ModalDialogService, RouterExtensions} from "nativescript-angular"
import {device} from "@nativescript/core/platform"
import {Competition} from "@src/app/shared/interfaces/competition"
import {BaseComponent} from "@src/app/shared/base.component"
import {ActivatedRoute} from "@angular/router"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import * as _ from "lodash"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {localize as L} from "nativescript-localize"
import {CompetitionDetailQrComponent} from "@src/app/home/competition/competition-detail/competition-detail-qr/competition-detail-qr.component"
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {AuthService} from "@src/app/mobile/services/auth.service"


@Component({
    selector: 'app-competition-detail',
    templateUrl: './competition-detail.component.html',
})
export class CompetitionDetailComponent extends BaseComponent implements OnInit, OnDestroy {
    competition: Competition
    isAdmin = false
    uuid = device.uuid

    constructor(public routerExtensions: RouterExtensions,
                private _modalService: ModalDialogService,
                private _vcRef: ViewContainerRef,
                private router: ActivatedRoute,
                private _competition: CompetitionService,
                private snackbar: SnackbarService,
                private auth: AuthService) {
        super(routerExtensions)

        this.competition = this.router.snapshot.data['competition']

        if (this.competition) {
            this.isAdmin = this.competition.mobile_devices.filter((item: MobileDevice) => item.isAdmin && (item.uuid == device.uuid)).length > 0 ||
                this.competition.user == this.auth.user.uid
        } else {
            this.routerExtensions.navigate(['../'], {relativeTo: this.router})
        }
    }

    ngOnInit() {
    }

    ngOnDestroy(): void {
    }

    onItemTap($event) {
        const checkpoint = this.competition.checkpoints[$event.index]
        this.snackbar.confirm(
            checkpoint.devices.indexOf(device.uuid) == -1 ? L('Assign this device as a reader for the checkpoint %s', checkpoint.title) : L('Remove assignment')
        ).then((result: boolean) => {
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

    onTapQr(role: string): void {
        const options: ModalDialogOptions = {
            viewContainerRef: this._vcRef,
            context: {
                code: this.competition.secret[role],
                role: role
            },
            fullscreen: true
        };

        this._modalService.showModal(CompetitionDetailQrComponent, options)
    }

}
