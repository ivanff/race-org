import {Component, NgZone, OnDestroy, OnInit} from '@angular/core'
import {RouterExtensions} from 'nativescript-angular'
import {firestore} from 'nativescript-plugin-firebase'
import {
  getBoolean,
  setBoolean,
  getNumber,
  setNumber,
  getString,
  setString,
  hasKey,
  remove,
  clear
} from 'tns-core-modules/application-settings'
import {Device, device} from 'tns-core-modules/platform'
import {BaseComponent} from "@src/app/shared/base.component"
import {CheckPoint} from "@src/app/home/checkpoint"
import {SettingsService} from "@src/app/shared/settings.service"
import {confirm} from "tns-core-modules/ui/dialogs"


const firebase = require('nativescript-plugin-firebase/app')


const initial = [
  {
    'device': null,
    'key': 'CP1',
    'kind': 'hobby',
    'marshal': '',
    'name': '',
    'order': 0
  },
  {
    'device': null,
    'key': 'CP2',
    'kind': 'open',
    'marshal': '',
    'name': '',
    'order': 1
  },
  {
    'device': null,
    'key': 'CP3',
    'kind': 'open',
    'marshal': '',
    'name': '',
    'order': 2
  },
  {
    'device': null,
    'key': 'CP4',
    'kind': 'hobby',
    'marshal': '',
    'name': 'Финиш',
    'order': 3
  },
]


@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})
export class OptionsComponent extends BaseComponent implements OnInit, OnDestroy {

  settings = {
    checkpoint: {} as CheckPoint
  }
  checkpoints: Array<CheckPoint> = []
  collection: firestore.CollectionReference = firebase.firestore().collection('checkpoints')

  constructor(public routerExtensions: RouterExtensions,
              private zone: NgZone,
              private app_settings: SettingsService) {
    super(routerExtensions)

    const $zone = this.zone
    const collectionRef: firestore.Query = this.collection.orderBy('order', 'desc')

    collectionRef.onSnapshot({includeMetadataChanges: true}, (snapshot: firestore.QuerySnapshot) => {
      $zone.run(() => {
        this.checkpoints = []
        snapshot.forEach((doc: firestore.DocumentSnapshot) => {
          const id = doc.id
          const checkpoint = <CheckPoint>{id, ...doc.data()}
          this.checkpoints.push(checkpoint)

          if (hasKey('cp')) {
            if (getString('cp') === checkpoint.key && device.uuid === checkpoint.device) {
              this.settings.checkpoint = <CheckPoint>{...checkpoint}
            }
          }
        })
      })
    })
  }

  ngOnInit() {
    // remove
    // WARNING CHECK COLLECTION
    // for (const checkpoint of initial) {
    //   firebase.firestore().collection('checkpoints').add(checkpoint)
    // }
  }

  ngOnDestroy() {
  }

  onItemTap($event) {
    const checkpoint = this.checkpoints[$event.index]

    const options = {
      title: '',
      message: `Назначить это устройство считывателем для контрольной точки ${checkpoint.key}`,
      okButtonText: 'Да',
      cancelButtonText: 'Нет',
    }
    confirm(options).then((result: boolean) => {
      if (result) {
        const back_checkpoint = {...this.settings.checkpoint}
        const checkpoints = this.collection.where('device', '==', device.uuid).get()
        let batch = firebase.firestore().batch()

        const Back = (err) => this.settings.checkpoint = {...back_checkpoint}

        checkpoints.then((snapshot: firestore.QuerySnapshot) => {
          snapshot.forEach((doc: firestore.DocumentSnapshot) => {
            batch = batch.update(this.collection.doc(doc.id), {device: null})
          })
          batch = batch.update(this.collection.doc(checkpoint.id), {device: device.uuid})

          batch.commit().then(() => {
            this.settings.checkpoint = {...checkpoint}
            setString('cp', checkpoint.key)
          }, Back)
        }, Back)
      }
    })
  }

  getDeviceInfo(uuid: string | undefined): string {
    if (uuid) {
      const devices = this.app_settings.competition.devices.filter((device: Device) => { return device.uuid === uuid })
      if (devices.length == 1) {
        const device = devices[0] as Device
        return device.model || `${device.deviceType} ОС: ${device.osVersion}`
      }
    }
    return ""
  }

}
