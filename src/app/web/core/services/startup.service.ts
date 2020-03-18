import {Injectable, Injector} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, first, switchMap, tap} from 'rxjs/operators';
import {MenuService} from './menu.service';
import {AuthService} from "@src/app/web/core/services/auth.service"
import 'firebase/auth'
import {AngularFireAuth} from "@angular/fire/auth"
import {SettingsService} from "@src/app/web/core"
import {of} from "rxjs"

@Injectable()
export class StartupService {
    constructor(private menuService: MenuService,
                private http: HttpClient,
                private afAuth: AngularFireAuth,
                private auth: AuthService,
                private injector: Injector) {
    }

    load(): Promise<any> {
        return Promise.all([
            this.afAuth.authState.pipe(
                first(),
                tap((user) => {
                    this.auth.user = user
                }),
                switchMap((user) => {
                    if (user) {
                        const settings: SettingsService = this.injector.get<any>(SettingsService)
                        return settings.competitions$.pipe(
                            first()
                        )
                    } else {
                        return of(null)
                    }
                })
            ).toPromise(),
            this.http.get('assets/data/menu.json').pipe(
                catchError(res => {
                    return res;
                })
            ).toPromise().then((res: any) => {
                this.menuService.set(res.menu);
            })
        ]).catch((err) => {
            console.log(err)
        })
    }
}
