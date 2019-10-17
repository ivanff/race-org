import {Injectable, OnDestroy} from '@angular/core';
import {Observable, Subject} from 'rxjs';

import * as firebase from 'firebase/app'
import {AngularFireAuth} from "@angular/fire/auth"
import UserCredential = firebase.auth.UserCredential

@Injectable({
    providedIn: 'root',
})
export class AuthService implements OnDestroy{
    public user: firebase.User | null
    readonly unsubscribe: any

    constructor(public afAuth: AngularFireAuth){
        this.unsubscribe = this.currentUserObservable.subscribe((user: firebase.User) => {
            this.user = user
        })
    }

    get currentUserObservable(): any {
        return this.afAuth.authState
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

    private socialSignIn(provider) {
        return this.afAuth.auth.signInWithPopup(provider)
            .then((credential: UserCredential) =>  {
                // this.user = credential.user
                // this.updateUserData()
                return credential
            }).catch(error => console.log(error));
    }
}
