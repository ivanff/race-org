import {Injectable, NgZone, OnDestroy} from '@angular/core'
import {AuthStateChangeListener, LoginOptions, User} from "nativescript-plugin-firebase"
import {RouterExtensions} from "nativescript-angular"

const firebase = require("nativescript-plugin-firebase")


@Injectable({
    providedIn: 'root',
})
export class AuthService implements OnDestroy {
    public user: User | null
    private authListener = {
        onAuthStateChanged: (data) => {
            this.zone.run(() => {
                if (data.loggedIn) {
                    this.user = data.user
                    this.routerExtensions.navigate(['/home'], )
                } else {
                    this.user = null
                    this.routerExtensions.navigate(['/enter'], )
                }
            })
        },
        thisArg: this
    } as AuthStateChangeListener

    constructor(private routerExtensions: RouterExtensions, private zone: NgZone) {
        console.log('>> AuthService __init__')
        firebase.getCurrentUser().then((user: User) => {
            this.authListener.onAuthStateChanged({
                loggedIn: true,
                user: user
            })
        })
        firebase.addAuthStateListener(this.authListener)
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
}
