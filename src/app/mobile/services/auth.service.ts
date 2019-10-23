import {Injectable, NgZone, OnDestroy, ViewContainerRef} from '@angular/core'
import {AuthStateChangeListener, LoginOptions, User} from "nativescript-plugin-firebase"
import {ModalDialogOptions, ModalDialogParams, ModalDialogService, RouterExtensions} from "nativescript-angular"
import {RootComponent} from "@src/app/root/root.component"
import {BehaviorSubject, Subject} from "rxjs"

const firebase = require("nativescript-plugin-firebase")


@Injectable({
    providedIn: 'root',
})
export class AuthService implements OnDestroy {
    public user: User | null
    public user$ = new BehaviorSubject(null)
    private vcRef: any
    private authListener = {
        onAuthStateChanged: (data) => {
            console.log('>>> authListener')
            this.zone.run(() => {
                if (data.loggedIn) {
                    this.user$.next(data.user)
                    this.routerExtensions.navigate(['/home'], {clearHistory: true})
                } else {
                    this.user$.next(null)
                    this.openModalLogin()
                }
            })
        },
        thisArg: this
    } as AuthStateChangeListener

    constructor(private routerExtensions: RouterExtensions,
                private zone: NgZone,
                private modalService: ModalDialogService,
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

    setVcRef(vcRef) {
        this.vcRef = vcRef
    }

    ngOnDestroy(): void {
        firebase.removeAuthStateListener(this.authListener)
        console.log('>> AuthService ngOnDestroy')
    }

    logout(): Promise<any> {
        return firebase.logout()
    }

    googleLogin() {
        firebase.login({
            type: firebase.LoginType.GOOGLE
        } as LoginOptions)
    }

    facebookLogin() {
        firebase.login({
            type: firebase.LoginType.FACEBOOK
        } as LoginOptions)
    }

    openModalLogin() {
        const options: ModalDialogOptions = {
            fullscreen: true,
            viewContainerRef: this.vcRef,
            context: {
                path: ['enter']
            }
        }
        this.modalService.showModal(RootComponent, options).then((result) => {
            console.log('>>> openModalLogin', result)
        })
    }
}
