import {Injectable, Injector, OnDestroy} from '@angular/core';
import * as firebase from 'firebase/app'
import {AngularFireAuth} from "@angular/fire/auth"
import UserCredential = firebase.auth.UserCredential
import {SettingsService} from "@src/app/web/core"

@Injectable({
    providedIn: 'root',
})
export class AuthService implements OnDestroy {
    public user: firebase.User | null
    readonly unsubscribe: any

    constructor(private afAuth: AngularFireAuth,
                private injector: Injector){
        this.unsubscribe = this.afAuth.authState.subscribe((user: firebase.User | null) => {
            this.user = user
            const settings: SettingsService = this.injector.get<any>(SettingsService)
            settings.updateCompetitions()
        })
    }

    ngOnDestroy(): void {
        this.unsubscribe()
    }

    logout(): Promise<void>{
        return this.afAuth.auth.signOut()
    }

    phoneLogin(phone: string, verifier: any) {
        return this.afAuth.auth.signInWithPhoneNumber(`+7${phone}`, verifier)
    }

    googleLogin() {
        const provider = new firebase.auth.GoogleAuthProvider()
        return this.socialSignIn(provider);
    }

    facebookLogin() {
        const provider = new firebase.auth.FacebookAuthProvider()
        return this.socialSignIn(provider);
    }

    displayName(): string {
        if (this.user) {
            return this.user.displayName || this.user.email || this.user.phoneNumber
        }
        return ''
    }

    private socialSignIn(provider) {
        return this.afAuth.auth.signInWithPopup(provider)
            .then((credential: UserCredential) =>  {
                // this.user = credential.user
                // this.updateUserData()
                return credential
            }).catch(error => console.log(error));
    }
}
