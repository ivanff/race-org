import {AfterViewInit, Component, NgZone, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {WindowService} from "@src/app/web/core/services/window.service"
import * as firebase from 'firebase/app';
import 'firebase/auth'
import {AuthService} from "@src/app/web/core"
import UserCredential = firebase.auth.UserCredential

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, AfterViewInit {
    reactiveForm: FormGroup
    phone: string = ''
    code: string
    windowRef: any

    constructor(private fb: FormBuilder,
                private window: WindowService,
                private router: Router,
                private auth: AuthService) {
        this.onResetForm()
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.windowRef = this.window.windowRef
        this.windowRef.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container')
        this.windowRef.recaptchaVerifier.render()
    }

    onResetForm() {
        this.reactiveForm = this.fb.group({
            phone: ['', [Validators.required]],
        })
    }

    onSendLoginCode() {
        if (this.reactiveForm.valid) {
            const appVerifier = this.windowRef.recaptchaVerifier;
            this.auth.phoneLogin(this.phone, appVerifier).then(result => {
                this.windowRef.confirmationResult = result;
                this.reactiveForm.addControl('code', new FormControl('', [Validators.required]))
            }).catch(LoginComponent.googleAuthError);
        }
    }

    onVerifyLoginCode() {
        this.windowRef.confirmationResult
            .confirm(this.code)
            .then((result: UserCredential) => {
                this.successRedirect(result)
            }).catch(LoginComponent.googleAuthError)
    }

    onGoogleLogin() {
        this.auth.googleLogin().then((result: UserCredential) => {
            this.successRedirect(result)
        }).catch(LoginComponent.googleAuthError)
    }

    onFbLogin() {
        this.auth.facebookLogin().then((result: UserCredential) => {
            this.successRedirect(result)
        }).catch(LoginComponent.googleAuthError)
    }

    successRedirect(result: UserCredential) {
        this.auth.user = result.user
        this.router.navigate(['/cabinet'])
    }

    static googleAuthError(error) {
        if (error.code) {
            alert(error.message)
        }
    }
}
