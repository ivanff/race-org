import {Injectable, NgZone, OnDestroy} from '@angular/core'
import {AuthStateChangeListener, FirebasePhoneLoginOptions, LoginOptions, User} from "nativescript-plugin-firebase"
import {RouterExtensions} from "nativescript-angular"
import {BehaviorSubject} from "rxjs"
// import {VerificationObservableModel} from "@src/app/mobile/observable/verification-custom-observable"
import {EventData} from "tns-core-modules/data/observable"
import {VerificationObservableModel} from "@src/app/mobile/observable/verification-custom-observable"

const firebase = require("nativescript-plugin-firebase")
export const verificationObservable: VerificationObservableModel = new VerificationObservableModel()

@Injectable({
    providedIn: 'root',
})
export class AuthService implements OnDestroy {
    verificationObservable: VerificationObservableModel = verificationObservable
    user: User | null
    user$ = new BehaviorSubject(null)
    private vcRef: any
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
                user: user
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
        })
    }

    ngOnDestroy(): void {
        firebase.removeAuthStateListener(this.authListener)
        console.log('>> AuthService ngOnDestroy')
    }

    setVcRef(vcRef) {
        this.vcRef = vcRef
    }

    displayName(): string {
        if (this.user) {
            if (!this.user.isAnonymous) {
                return this.user.displayName || this.user.email || this.user.phoneNumber
            } else {
                return 'Анонимный\nпользователь'
            }
        }
        return ''
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
