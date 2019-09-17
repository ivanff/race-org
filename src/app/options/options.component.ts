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
import {device} from 'tns-core-modules/platform'
import {BaseComponent} from "@src/app/shared/base.component"
import {CheckPoint} from "@src/app/home/checkpoint"


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

  constructor(public routerExtensions: RouterExtensions, private zone: NgZone) {
    super(routerExtensions)
    const $zone = this.zone
    const collectionRef: firestore.CollectionReference = firebase.firestore().collection('checkpoints').orderBy('order')

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
    // for (const checkpoint of initial) {
    //   firebase.firestore().collection('checkpoints').add(checkpoint)
    // }
  }

  ngOnDestroy() {
  }

  onItemTap($event) {
    const checkpoint = this.checkpoints[$event.index]
    const collection: firestore.CollectionReference = firebase.firestore().collection('checkpoints')
    const back_checkpoint = {...this.settings.checkpoint}
    this.settings.checkpoint = {} as CheckPoint

    const checkpoints = collection.where('device', '==', device.uuid).get()
    let batch = firebase.firestore().batch()

    const back = (err) => this.settings.checkpoint = {...back_checkpoint}

    checkpoints.then((snapshot: firestore.QuerySnapshot) => {
      snapshot.forEach((doc: firestore.DocumentSnapshot) => {
        batch = batch.update(collection.doc(doc.id), {device: null})
      })
      batch = batch.update(collection.doc(checkpoint.id), {device: device.uuid})

      batch.commit().then(() => {
        this.settings.checkpoint = {...checkpoint}
        setString('cp', checkpoint.key)
      }, back)
    }, back)
  }
}
