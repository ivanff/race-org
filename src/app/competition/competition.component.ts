import {Component, OnDestroy, OnInit} from '@angular/core'
import {ModalDialogParams} from "nativescript-angular"
import * as application from "tns-core-modules/application"
import {Competition} from "@src/app/competition/competition"
import {Device, device} from "tns-core-modules/platform"
import * as moment from "moment"
import * as dialogs from "tns-core-modules/ui/dialogs"
import {PromptResult} from "tns-core-modules/ui/dialogs"
import {firestore} from "nativescript-plugin-firebase"
import {SettingsService} from "@src/app/shared/settings.service"

const firebase = require('nativescript-plugin-firebase/app')

// const device_obj = {
//   manufacturer: device.manufacturer,
//   model: device.model,
//   osVersion: device.osVersion,
//   deviceType: device.deviceType,
//   uuid: device.uuid,
//   language: device.language,
//   region: device.region,
// }

const initial: Competition = {
  id: '4O12e8JOUoR96idKit6d',
  name: 'Last Attack 2',
  admin_device: null,
  classes: {
    hobby: {
      round: 3
    },
    open: {
      round: 5
    }
  },
  devices: [],
  finish: moment('2019-09-28 16:00:00.000').toDate(),
  secret: '1987'
}

@Component({
  selector: 'app-competition',
  templateUrl: './competition.component.html',
  styleUrls: ['./competition.component.scss']
})
export class CompetitionComponent  implements OnInit, OnDestroy {
  collection: firestore.CollectionReference = firebase.firestore().collection('competitions')
  device_obj: any
  device_uuid: string

  constructor(private params: ModalDialogParams, public settings: SettingsService) {
    this.device_obj = {
      manufacturer: device.manufacturer,
      model: device.model,
      osVersion: device.osVersion,
      deviceType: device.deviceType,
      uuid: device.uuid,
      language: device.language,
      region: device.region,
    }
    this.device_uuid = device.uuid
  }

  ngOnInit() {
    application.android.off(application.AndroidApplication.activityBackPressedEvent)
    application.android.on(application.AndroidApplication.activityBackPressedEvent, (args: any) => {
          args.cancel = true
          this.params.closeCallback(null)
        }
    )
    // this.collection.doc(initial.id).set({...initial, ...{id: undefined, admin_device: null, devices: []}})
  }
  ngOnDestroy(): void {
    application.android.off(application.AndroidApplication.activityBackPressedEvent)
  }
  onSetAdmin(): void {
    dialogs.prompt("Enter secret key to MANAGE this competition", "").then((r: PromptResult) => {
      if (r.result && initial.secret === r.text){
        this.collection.doc(initial.id).update({
          admin_device: this.device_obj,
        }).then(value => alert('Success'))
      }
    })
  }

  checkExists(devices: Array<Device>): boolean {
    return devices.filter((device: Device) => {
      return device.uuid === this.device_uuid
    }).length == 0
  }

  onJoin(): void {
    dialogs.prompt("Enter secret key to JOIN into competition", "").then((r: PromptResult) => {
      if (r.result && initial.secret === r.text){
        this.collection.doc(initial.id).get().then((doc: firestore.QueryDocumentSnapshot) =>{
          const competition = doc.data() as Competition
          const current_devices = competition.devices.filter((item: Device) => item.uuid == device.uuid)
          if (!current_devices.length) {
            competition.devices.push({...this.device_obj})
            this.collection.doc(doc.id).update({
              devices: competition.devices
            }).then(value => alert('Success'))
          }
        })
      }
    })
  }

  goBack(){
    this.params.closeCallback(null)
  }

}
