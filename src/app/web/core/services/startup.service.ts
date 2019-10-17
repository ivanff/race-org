import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, first} from 'rxjs/operators';
import {MenuService} from './menu.service';
import {AuthService} from "@src/app/web/core/services/auth.service"
import 'firebase/auth'
import {AngularFireAuth} from "@angular/fire/auth"

@Injectable()
export class StartupService {
    constructor(private menuService: MenuService,
                private http: HttpClient,
                private afAuth: AngularFireAuth,
                private auth: AuthService) {
    }

    load(): Promise<any> {
        return Promise.all([
            this.afAuth.authState.pipe(first()).toPromise().then((user) => {
                this.auth.user = user
            }),
            new Promise((resolve, reject) => {
                this.http
                    .get('assets/data/menu.json')
                    .pipe(
                        catchError(res => {
                            resolve();
                            return res;
                        })
                    )
                    .subscribe(
                        (res: any) => {
                            this.menuService.set(res.menu);
                        },
                        () => {
                        },
                        () => {
                            resolve();
                        }
                    );
            })
        ])
    }
}
