import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {Athlet} from "@src/app/home/athlet"
import {firestore} from "nativescript-plugin-firebase"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
  selector: 'app-stat',
  templateUrl: './stat.component.html',
  styleUrls: ['./stat.component.scss']
})
export class StatComponent implements OnInit, OnDestroy {
  athlets_count: number = 0
  open_count: number = 0
  hobby_count: number = 0
  private unsubscribe: any

  constructor(private zone: NgZone,) { }

  ngOnInit() {
    const $zone = this.zone
    const athletsCollRef: firestore.Query = firebase.firestore().collection('athlets')
    this.unsubscribe = athletsCollRef.onSnapshot({},(snapshot: firestore.QuerySnapshot) => {
      $zone.run(() => {
        this.athlets_count = snapshot.docs.length
        this.hobby_count = snapshot.docs.filter((doc: firestore.QueryDocumentSnapshot) => {return doc.data().class === 'hobby'}).length
        this.open_count = snapshot.docs.filter((doc: firestore.QueryDocumentSnapshot) => {return doc.data().class === 'open'}).length
      })
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe()
  }

}
