import {Injectable, NgZone, OnDestroy} from '@angular/core'
import {Observable, of, ReplaySubject, Subject} from "rxjs"
import {Competition} from "@src/app/shared/interfaces/competition"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {first, map, shareReplay, switchMap, takeUntil} from "rxjs/operators"
import {firestore} from "nativescript-plugin-firebase"
import {setString, remove} from "tns-core-modules/application-settings"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {device} from "tns-core-modules/platform"
import * as moment from 'moment-timezone'
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {HttpClient} from "@angular/common/http"
import {environment} from "@src/environments/environment"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {localize as L} from "nativescript-localize"

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

    constructor(private auth: AuthService,
                private http: HttpClient,
                private zone: NgZone,
                private snackbar: SnackbarService,) {
        console.log('>>> CompetitionService constructor')

        this.selected_competition_id$ = (new Subject).pipe(
            switchMap((value: string | null | Competition | Array<string>) => {
                if (typeof value === 'string') {
                    return this.firestoreCollectionObservable(value).pipe(
                        takeUntil(this.destroy)
                    )
                } else if (Array.isArray(value)) {
                    const parent_id = value[0]
                    const id = value[1]
                    return this.firestoreCollectionObservable(parent_id, id).pipe(
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
                setString('selected_competition_id', `${competition.parent_id ? competition.parent_id + '_' : ''}${competition.id}`)
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

    getByCode(code: number): Observable<{competition: Competition, role: string}> {
        return this.http.post<{competitionId: string, role: string}>(environment.google_gateway + '/set_permissions_new', {
            user: this.auth.user ? this.auth.user.uid: null,
            secret: code
        }).pipe(
            switchMap((resp) => {
                return this.firestoreCollectionObservable(resp.competitionId).pipe(
                    first(),
                    map((competition: Competition) => {
                       return {
                           role: resp.role,
                           competition: competition
                       }
                    })
                )
            })
        )
    }

    getAthletsCollectionPath(): string {
        return `athlets_${this.selected_competition.parent_id || this.selected_competition.id}`
    }

    set(competition: Competition, options?: firestore.SetOptions): Promise<Competition> {
        return this.getCollection(competition).set(competition, options).then(() => {
            return competition
        })
    }

    update(competition, document: any): Promise<Competition> {
        return this.getCollection(competition).update(document).then(() => {
            return competition
        })
    }

    private getCollection(competition: Competition): firestore.DocumentReference {
        let collection: firestore.DocumentReference = firebase.firestore().collection('competitions').doc(competition.parent_id || competition.id)

        if (competition.parent_id) {
            collection = collection.collection('stages').doc(competition.id)
        }
        return collection
    }

    private firestoreCollectionObservable(parent_id, id?) {
        return new Observable(subscriber => {
            let colRef: firestore.DocumentReference = firebase.firestore().collection("competitions").doc(parent_id)

            if (id) {
                colRef = colRef.collection('stages').doc(id)
            }

            return colRef.onSnapshot((doc: firestore.DocumentSnapshot) => {
                console.log(
                    'colRef.onSnapshot', parent_id, id
                )
                if (doc.exists) {
                    this.zone.run(() => {
                        if (!id) {
                            console.log(1)
                            firebase.firestore().collection("competitions").doc(parent_id).collection('stages').get().then((docs: firestore.QuerySnapshot) => {
                                const stages: Array<Competition> = []
                                console.log(2)
                                docs.forEach((doc: firestore.QueryDocumentSnapshot) => {
                                    const id = doc.id
                                    stages.push({id, ...doc.data(), parent_id} as Competition)
                                })
                                this.selected_competition = {...doc.data(), stages} as Competition
                                this.selected_competition.id = parent_id
                                subscriber.next(this.selected_competition)
                            })
                        } else {
                            this.selected_competition = {id, ...doc.data(), parent_id} as Competition
                            subscriber.next(this.selected_competition)
                        }
                    })
                } else {
                    subscriber.next(null)
                }
            })
        })
    }

    private setCp(silent = true) {
        this.selected_competition.mobile_devices = this.selected_competition.mobile_devices || []
        if (!this.selected_competition.mobile_devices.filter((item: MobileDevice) => item.uuid == device.uuid).length) {
            // недоработка связанная с этапами проведения
            const isAdmin = this.selected_competition.user == this.auth.user.uid
            this.selected_competition.mobile_devices.push({
                uuid: device.uuid,
                deviceType: device.deviceType,
                osVersion: device.osVersion,
                model: device.model,
                isAdmin: isAdmin
            } as MobileDevice)

            this.update(this.selected_competition, {'mobile_devices': this.selected_competition.mobile_devices})
        }

        const checkpoints = this.selected_competition.checkpoints.filter((item: Checkpoint) => item.devices.indexOf(device.uuid) > -1)
        if (!silent) {
            if (checkpoints.length <= 0) {
                this.snackbar.alert(L('This device is\'t READER in current competition!'))
            } else if (checkpoints.length > 1) {
                this.snackbar.alert(L('This device is MULTIPLE READER in current competition!'))
            }
        }

        this.current_checkpoint = checkpoints.length == 1 ? checkpoints[0] : null
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
