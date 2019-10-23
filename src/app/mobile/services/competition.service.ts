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
const firebase = require('nativescript-plugin-firebase/app')

@Injectable({
    providedIn: 'root'
})
export class CompetitionService implements OnDestroy {
    selected_competition: Competition
    current_checkpoint: Checkpoint
    selected_competition_id$: any
    finish_time: any
    private destroy = new ReplaySubject<any>(1)

    constructor(private auth: AuthService, private zone: NgZone) {
        console.log('>>> CompetitionService constructor')

        this.selected_competition_id$ = (new Subject).pipe(
            switchMap((id: string | null) => {
                if (id) {
                    return this.firestoreCollectionObservable(id).pipe(
                        takeUntil(this.destroy)
                    )
                } else {
                    return of(null)
                }
            }),
            shareReplay(1),
            takeUntil(this.destroy),
        )
        this.selected_competition_id$.subscribe((competition: Competition) => {
            this.selected_competition = competition
            if (competition) {
                setString('selected_competition_id', competition.id)
                this.setCp()
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

    firestoreCollectionObservable(id) {
        return new Observable(subscriber => {
            const colRef: firestore.DocumentReference = firebase.firestore().collection("competitions").doc(id)
            colRef.onSnapshot((doc: firestore.DocumentSnapshot) => {
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

    private setCp() {
        const checkpoints = this.selected_competition.checkpoints.filter((item: Checkpoint) => item.devices.indexOf(device.uuid) > -1)
        if (checkpoints.length <= 0) {
            alert('This device is\'t READER in current competition!')
        } else if (checkpoints.length == 1) {
            this.current_checkpoint = checkpoints[0]
        } else {
            alert('This device is\'t MULTIPLE READER in current competition!')
        }
        return this.current_checkpoint
    }

    private setStartTime() {
        this.finish_time = moment(this.selected_competition.start_date).add(this.selected_competition.start_time, 's').add(this.selected_competition.duration, 's')
    }

}
