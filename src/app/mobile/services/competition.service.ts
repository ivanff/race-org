import {Injectable, NgZone, OnDestroy} from '@angular/core'
import {Observable, of, ReplaySubject, Subject} from "rxjs"
import {Competition} from "@src/app/shared/interfaces/competition"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {shareReplay, switchMap, takeUntil} from "rxjs/operators"
import {firestore} from "nativescript-plugin-firebase"
import {setString, remove} from "tns-core-modules/application-settings"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {device} from "tns-core-modules/platform"
import * as moment from 'moment-timezone'
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
const firebase = require('nativescript-plugin-firebase/app')

@Injectable({
    providedIn: 'root'
})
export class CompetitionService implements OnDestroy {
    selected_competition: Competition
    current_checkpoint: Checkpoint
    selected_competition_id$: any
    finish_time: any
    isAdmin = false
    private destroy = new ReplaySubject<any>(1)

    constructor(private auth: AuthService, private zone: NgZone) {
        console.log('>>> CompetitionService constructor')

        this.selected_competition_id$ = (new Subject).pipe(
            switchMap((value: string | null | Competition) => {
                if (typeof value === 'string') {
                    return this.firestoreCollectionObservable(value).pipe(
                        takeUntil(this.destroy)
                    )
                } else {
                    return of(value)
                }
            }),
            shareReplay(1),
            takeUntil(this.destroy),
        )
        this.selected_competition_id$.subscribe((competition: Competition) => {
            console.log('selected_competition_id$')
            this.selected_competition = competition
            if (competition) {
                setString('selected_competition_id', competition.id)
                this.setCp()
                this.setIsAdmin()
                this.setStartTime()
            } else {
                remove('selected_competition_id')
                this.current_checkpoint = null
                this.finish_time = null
            }
        })
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
    }

    private firestoreCollectionObservable(id) {
        return new Observable(subscriber => {
            const colRef: firestore.DocumentReference = firebase.firestore().collection("competitions").doc(id)
            return colRef.onSnapshot((doc: firestore.DocumentSnapshot) => {
                if (doc.exists) {
                    this.zone.run(() => {
                        const id = doc.id
                        this.selected_competition = {id, ...doc.data()} as Competition
                        subscriber.next(this.selected_competition)
                    })
                } else {
                    subscriber.next(null)
                }
            })
        })
    }

    async getByCode(code: number) {
        const marshals = await firebase.firestore().collection('competitions').where('secret.marshal', '==', code).get()
        const admins = await firebase.firestore().collection('competitions').where('secret.admin', '==', code).get()
        return {
            admins: admins.docs,
            marshals: marshals.docs
        }
    }

    private setCp(silent=true) {
        if (!this.selected_competition.mobile_devices.filter((item: MobileDevice) => item.uuid == device.uuid).length) {
            const isAdmin = this.selected_competition.user == this.auth.user.uid
            this.selected_competition.mobile_devices.push({
                uuid: device.uuid,
                deviceType: device.deviceType,
                osVersion: device.osVersion,
                model: device.model,
                isAdmin: isAdmin
            } as MobileDevice)
            console.log(
                2, this.selected_competition.mobile_devices
            )
            firebase.firestore().collection('competitions').doc(this.selected_competition.id).set(this.selected_competition)
        }
        const checkpoints = this.selected_competition.checkpoints.filter((item: Checkpoint) => item.devices.indexOf(device.uuid) > -1)
        if (!silent) {
            if (checkpoints.length <= 0) {
                alert('This device is\'t READER in current competition!')
            } else if (checkpoints.length > 1) {
                alert('This device is\'t MULTIPLE READER in current competition!')
            }
        }
        this.current_checkpoint = checkpoints[0]
    }

    private setIsAdmin() {
        if (this.auth.user.uid == this.selected_competition.user) {
            this.isAdmin = true
        }
    }


    private setStartTime() {
        this.finish_time = moment(this.selected_competition.start_date).add(this.selected_competition.start_time, 's').add(this.selected_competition.duration, 's')
    }

}
