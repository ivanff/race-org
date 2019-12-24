import {Injectable, NgZone, OnDestroy} from '@angular/core'
import {Observable, of, ReplaySubject, Subject} from "rxjs"
import {Competition} from "@src/app/shared/interfaces/competition"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {first, map, shareReplay, switchMap, takeUntil} from "rxjs/operators"
import {firestore, User} from "nativescript-plugin-firebase"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {device} from "@nativescript/core/platform"
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {HttpClient} from "@angular/common/http"
import {environment} from "@src/environments/environment"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {localize as L} from "nativescript-localize"
import {getString, remove, setString} from "@nativescript/core/application-settings"
import {Secret} from "@src/app/shared/interfaces/secret"

const firebase = require('nativescript-plugin-firebase/app')

@Injectable({
    providedIn: 'root'
})
export class CompetitionService implements OnDestroy {
    selected_competition: Competition
    current_checkpoint: Checkpoint
    selected_competition_id$: any
    isAdmin = false
    private test_secret: {role: string, secret: Secret}
    private destroy = new ReplaySubject<any>(1)

    constructor(private auth: AuthService,
                private http: HttpClient,
                private zone: NgZone,
                private snackbar: SnackbarService,) {
        console.log('>>> CompetitionService constructor')

        this.auth.user$.subscribe((user: User | null) => {
            if (!user) {
                remove(`test_secret_${this.selected_competition.parent_id}`)
            }
        })

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
                // this.setFinishTime()
            } else {
                remove('selected_competition_id')
                this.current_checkpoint = null
                this.test_secret = null
                // this.start_time = null
                // this.finish_time = null
            }
        })
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
    }

    getByCode(code: number): Observable<Competition> {
        return this.http.post<{competitionId: string, role: string, secret?: any}>(environment.google_gateway + '/set_permissions_new', {
            user: this.auth.user ? this.auth.user.uid: null,
            secret: code
        }).pipe(
            switchMap((resp) => {
                return this.firestoreCollectionObservable(resp.competitionId).pipe(
                    first(),
                    map((competition: Competition) => {
                        if (!competition.secret) {
                            competition.secret = resp.secret
                        }

                        this.test_secret = {
                            role: resp.role,
                            secret: competition.secret
                        }

                        setString(`test_secret_${competition.id}`, JSON.stringify(this.test_secret))

                        return competition
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
            return Object.assign(competition, document)
        })
    }

    updateMobileDevices(competition, role: string): Promise<Competition> {
        console.log(
            'updateMobileDevices',
            role
        )
        const joined: Array<MobileDevice> = (competition.mobile_devices || []).filter((item: MobileDevice) => item.uuid == device.uuid)
        let mobile_device: MobileDevice

        if (joined.length) {
            mobile_device = joined[0]
        }

        if (mobile_device) {
            if (mobile_device.isAdmin != (role == 'admin')) {
                mobile_device.isAdmin = (role == 'admin')
                return this.update(competition, {
                    mobile_devices: competition.mobile_devices
                })
            }
        } else {
            competition.mobile_devices.push({
                uuid: device.uuid,
                deviceType: device.deviceType,
                osVersion: device.osVersion,
                model: device.model,
                isAdmin: role == 'admin'
            } as MobileDevice)
            return this.update(competition, {
                mobile_devices: competition.mobile_devices
            })
        }
        return new Promise<Competition>((resolve => resolve(competition)))
    }

    private getCollection(competition: Competition): firestore.DocumentReference {
        let collection: firestore.DocumentReference = firebase.firestore().collection('competitions').doc(competition.parent_id || competition.id)

        if (competition.parent_id) {
            collection = collection.collection('stages').doc(competition.id)
        }
        return collection
    }

    firestoreCollectionObservable(parent_id, id?) {
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
                            Promise.all([
                                firebase.firestore().collection("competitions").doc(parent_id).collection('stages').get().then((docs: firestore.QuerySnapshot) => {
                                    const stages: Array<Competition> = []
                                    docs.forEach((doc: firestore.QueryDocumentSnapshot) => {
                                        const id = doc.id
                                        stages.push({id, ...doc.data(), parent_id} as Competition)
                                    })

                                    return stages
                                }),
                                firebase.firestore().collection("competitions").doc(parent_id).collection('test_secret').get().then((docs: firestore.QuerySnapshot) => {
                                    const secret: {[key: string]: number} = {}
                                    docs.forEach((doc: firestore.QueryDocumentSnapshot) => {
                                        secret[doc.id] = doc.data().code
                                    })
                                    return secret as Secret
                                }).catch(() => {
                                    return this.test_secret ? this.test_secret : JSON.parse(getString(`test_secret_${parent_id}`, 'null'))
                                })
                            ]).then((result) => {
                                const stages = result[0]
                                const secret = result[1]
                                const id = doc.id
                                const competition = {id, ...doc.data(), stages, secret} as Competition
                                if (secret) {
                                    this.test_secret = {
                                        role: 'admin',
                                        secret: secret
                                    }
                                }
                                subscriber.next(competition)
                            })

                        } else {
                            subscriber.next({id, ...doc.data(), parent_id} as Competition)
                        }
                    })
                } else {
                    subscriber.next(null)
                }
            })
        })
    }

    private setCp(silent=true): void {

        if (this.test_secret) {
            this.updateMobileDevices(this.selected_competition, this.test_secret.role)
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
        if (this.selected_competition.mobile_devices.filter((item: MobileDevice) => (item.uuid == device.uuid) && item.isAdmin).length) {
            this.isAdmin = true
        }
    }

    // private setStartTime(): moment {
    //     this.start_time = moment.tz(
    //         `${moment(this.selected_competition.start_date).format('YYYY-MM-DD')}T00:00:00`, this.selected_competition.timezone
    //     ).add(this.selected_competition.start_time, 's')
    //
    //     return this.start_time
    // }
    // private setFinishTime(): moment {
    //     this.finish_time = this.setStartTime().clone().add(this.selected_competition.duration, 's')
    //     return this.finish_time
    // }

}
