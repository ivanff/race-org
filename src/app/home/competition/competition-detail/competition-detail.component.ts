import {Component, OnDestroy, OnInit} from '@angular/core'
import {RouterExtensions} from "nativescript-angular"
import {device} from "tns-core-modules/platform"
import {Competition} from "@src/app/shared/interfaces/competition"
import {BaseComponent} from "@src/app/shared/base.component"
import {ActivatedRoute} from "@angular/router"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import * as _ from "lodash"
import {confirm} from "tns-core-modules/ui/dialogs"
import {firestore} from "nativescript-plugin-firebase"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {Msg} from "@src/app/shared/interfaces/msg"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-competition-detail',
    templateUrl: './competition-detail.component.html',
})
export class CompetitionDetailComponent extends BaseComponent implements OnInit, OnDestroy {
    competition: Competition

    constructor(public routerExtensions: RouterExtensions,
                private router: ActivatedRoute,
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
            message: checkpoint.devices.indexOf(device.uuid) == -1 ? `Назначить это устройство считывателем для контрольной точки "${checkpoint.title}"` : 'Убрать назначение' ,
            okButtonText: 'Да',
            cancelButtonText: 'Нет',
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

                let collection: firestore.DocumentReference

                if (this.competition.parent_id) {
                    collection =  firebase.firestore().collection("competitions")
                        .doc(this.competition.parent_id)
                        .collection('stages')
                        .doc(this.competition.id)
                } else {
                    collection =  firebase.firestore().collection("competitions")
                        .doc(this.competition.id)
                }

                collection.set(this.competition).then(() => {
                    this.snackbar.snackbar$.next(
                        {
                            level: "success",
                            msg: this.competition.checkpoints[$event.index].devices.indexOf(device.uuid) > -1 ? 'Устройство установлено как считыватель' : 'Устройство удалено из считывателей точки'
                        } as Msg
                    )
                })
            }
        })
    }

    isReader(checkpoint: Checkpoint) {
        return checkpoint.devices.indexOf(device.uuid) > -1
    }
}
