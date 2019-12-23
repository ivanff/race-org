import {Observable} from "@nativescript/core/data/observable"

export class VerificationObservableModel extends Observable {
    private _verificationCode: number;
    private _verificationResponse: any;
    private _verificationError: any;

    get verificationCode(): number {
        return this._verificationCode;
    }

    set verificationCode(value: number) {
        this._verificationCode = value;
    }

    get verificationResponse(): any {
        return this._verificationResponse;
    }

    set verificationResponse(value: any) {
        this._verificationResponse = value;
    }

    get verificationError(): any {
        return this._verificationError;
    }

    set verificationError(value: any) {
        this._verificationError = value;
    }
}
