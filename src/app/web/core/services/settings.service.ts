import {Injectable, OnDestroy} from '@angular/core'
import {BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subject} from 'rxjs'
import {AppSettings, defaults} from '../settings'
import timezones from 'google-timezones-json'
import {Competition} from "@src/app/shared/interfaces/competition"
import {map, shareReplay, switchMap, takeUntil} from "rxjs/operators"
import {AngularFirestore} from "@angular/fire/firestore"
import {AuthService} from "@src/app/web/core/services/auth.service"

@Injectable({
    providedIn: 'root',
})
export class SettingsService implements OnDestroy {
    competitions$ = new BehaviorSubject<Array<Competition>>([])

    protected _onDestroy = new ReplaySubject<any>(1)
    private notice$ = new Subject<any>()
    private options = defaults;

    readonly timezones: { [key: string]: string } = timezones
    readonly timezones_array: Array<{ key: string, value: string }> = Object.keys(timezones).map((key) => {
        return {key: key, value: timezones[key]}
    })

    constructor(private afs: AngularFirestore,
                private auth: AuthService) {
    }

    updateCompetitions() {
        if (this.auth.user) {
            this.afs.collection<Competition>('competitions', ref => ref.where('user', '==', this.auth.user.uid)
                .orderBy('created', 'desc'))
                .valueChanges({idField: 'id'})
                .pipe(
                    switchMap((values: Array<any>) => {
                        if (values.length) {
                            return combineLatest(
                                values.map((doc) => {
                                    return this.afs.collection('competitions').doc(doc.id)
                                        .collection('stages')
                                        .valueChanges({idField: 'id'})
                                        .pipe(
                                            map((stages) => {
                                                return Object.assign(doc, {stages})
                                            })
                                        )
                                })
                            )
                        } else {
                            return of(null)
                        }
                    }),
                    shareReplay(1),
                    takeUntil(this._onDestroy)
                ).subscribe((competitions: Array<Competition>) => {
                    this.competitions$.next(competitions)
            })
        } else {
            this.competitions$.next([])
        }

    }

    ngOnDestroy(): void {
        this._onDestroy.next(null)
        this._onDestroy.complete()
    }

    get notice(): Observable<any> {
        return this.notice$.asObservable();
    }

    setLayout(options?: AppSettings): AppSettings {
        this.options = Object.assign(defaults, options);
        return this.options;
    }

    setNavState(type: string, value: boolean) {
        this.notice$.next({type, value} as any);
    }

    getOptions(): AppSettings {
        return this.options;
    }
}
