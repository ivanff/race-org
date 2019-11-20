import {Injectable, NgZone, OnDestroy} from '@angular/core'
import {
    AuthStateChangeListener,
    FirebasePhoneLoginOptions,
    LoginOptions,
    Provider,
    User
} from "nativescript-plugin-firebase"
import {RouterExtensions} from "nativescript-angular"
import {BehaviorSubject} from "rxjs"
import {EventData} from "tns-core-modules/data/observable"
import {VerificationObservableModel} from "@src/app/mobile/observable/verification-custom-observable"
import * as _ from "lodash"
const firebase = require("nativescript-plugin-firebase")
export const verificationObservable: VerificationObservableModel = new VerificationObservableModel()

interface Params {
    displayName: string,
    provider: Provider | null,
    canCreate: boolean,
}

@Injectable({
    providedIn: 'root',
})
export class AuthService implements OnDestroy {
    verificationObservable: VerificationObservableModel = verificationObservable
    user: User | null
    params: Params = {
        displayName: '',
        provider: null,
        canCreate: false
    }
    user$ = new BehaviorSubject(null)
    private authListener = {
        onAuthStateChanged: (data) => {
            console.dir('>>> authListener loggedIn', data.loggedIn)
            this.zone.run(() => {
                const extras = {clearHistory: true}
                if (data.loggedIn) {
                    this.user$.next(data.user)
                    this.routerExtensions.navigate(['/home'], extras)
                } else {
                    this.user$.next(null)
                    this.routerExtensions.navigate([''], extras)
                }
            })
            return data
        },
        thisArg: this
    } as AuthStateChangeListener

    constructor(private routerExtensions: RouterExtensions,
                private zone: NgZone
    ) {
        console.log('>> AuthService __init__')
        firebase.getCurrentUser().then((user: User) => {
            this.authListener.onAuthStateChanged({
                loggedIn: true,
                user: user,
            })
        }).catch(() => {
            this.authListener.onAuthStateChanged({
                loggedIn: false,
                user: null
            })
        })
        firebase.addAuthStateListener(this.authListener)
        this.user$.subscribe((user: User | null) => {
            this.user = user
            if (user) {
                console.dir(this.user.uid)
                this.params.displayName = this.user.isAnonymous ? `Анонимный\nпользователь\n${_.truncate(this.user.uid, {length: 10})}` : (this.user.displayName || this.user.email || this.user.phoneNumber)
                this.params.provider = this.user.providers.filter((provider: Provider) => provider.id != 'firebase')[0] || null
                this.params.canCreate = ['google.com', 'facebook.com', 'phone'].indexOf((this.params.provider || {id: null}).id) > -1
            } else {
                this.params = {
                    displayName: '',
                    provider: null,
                    canCreate: false,
                }
            }
        })
    }

    ngOnDestroy(): void {
        firebase.removeAuthStateListener(this.authListener)
        console.log('>> AuthService ngOnDestroy')
    }

    logout(): Promise<any> {
        return firebase.logout().then(() => {
            this.routerExtensions.navigate(['/home'], {clearHistory: true})
        })
    }

    googleLogin(): Promise<any> {
        return firebase.login({
            type: firebase.LoginType.GOOGLE
        } as LoginOptions)
    }

    facebookLogin(): Promise<any> {
        return firebase.login({
            type: firebase.LoginType.FACEBOOK
        } as LoginOptions)
    }

    phoneLogin(phoneNumber: string) {
        firebase.login({
            type: firebase.LoginType.PHONE,
            phoneOptions: {phoneNumber, verificationPrompt: 'verificationPrompt'} as FirebasePhoneLoginOptions
        } as LoginOptions).then((response) => {
            this.verificationObservable.set("verificationResponse", response);
            let eventData: EventData = {
                eventName: "onverificationsuccess",
                object: this.verificationObservable
            }
            this.verificationObservable.notify(eventData);
        }).catch((err) => {
            this.verificationObservable.set("verificationError", err);
            let eventData: EventData = {
                eventName: "onverificationerror",
                object: this.verificationObservable
            }
            this.verificationObservable.notify(eventData);
        })
    }

    anonymousLogin(): Promise<User> {
        return firebase.login({
            type: firebase.LoginType.ANONYMOUS
        } as LoginOptions)
    }
}
