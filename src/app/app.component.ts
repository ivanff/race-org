import {
    Component,
    OnInit,
    ViewContainerRef,
    ViewChild,
    OnDestroy,
    AfterViewInit,
    NgZone,
    ChangeDetectorRef
} from "@angular/core";
import {ModalDialogOptions, ModalDialogService} from "nativescript-angular/modal-dialog";
import {RouterExtensions} from "nativescript-angular/router";
import {RadSideDrawerComponent} from "nativescript-ui-sidedrawer/angular";
import * as application from "tns-core-modules/application"
import {confirm} from "tns-core-modules/ui/dialogs"
import {exit} from "nativescript-exit"
import {RootComponent} from "./root/root.component"
import {NavigationEnd} from "@angular/router"
import {filter} from "rxjs/operators"
import {AuthService} from "./mobile/services/auth.service"
import {CompetitionService} from "./mobile/services/competition.service"
import {openUrl} from "tns-core-modules/utils/utils"

const firebase = require('nativescript-plugin-firebase')

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
    _activatedUrl: string = '/'

    @ViewChild(RadSideDrawerComponent, {static: false}) sideDrawerComponent: RadSideDrawerComponent

    constructor(private routerExtensions: RouterExtensions,
                private modalService: ModalDialogService,
                private _changeDetectionRef: ChangeDetectorRef,
                private vcRef: ViewContainerRef,
                private zone: NgZone,
                public auth: AuthService,
                public _competition: CompetitionService) {
        this.auth.setVcRef(this.vcRef)
    }

    ngOnInit(){
        this.onBackPressed()
        firebase.init({
            //local cache
            persist: true
        }).then(() => {
            firebase.firestore.settings({cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED})
        }).catch((err) => {
            console.log(`>> AppComponent ngOnInit ${err}`)
        })
    }

    ngAfterViewInit(): void {
        this._changeDetectionRef.detectChanges()
        this.routerExtensions.router.events
            .pipe(filter((event: any) => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                this._activatedUrl = event.urlAfterRedirects
            })
    }

    ngOnDestroy(): void {
        application.android.off(application.AndroidApplication.activityBackPressedEvent)
    }

    navigateTo(path: string, extras?: any): void {
        this.routerExtensions.navigate([path], extras)
        this.onCloseDrawerTap()
    }

    openModal(path: string): void {
        const options: ModalDialogOptions = {
            fullscreen: true,
            viewContainerRef: this.vcRef,
            context: {
                path: [path]
            }
        }
        this.modalService.showModal(RootComponent, options).then((result) => {
            this.onBackPressed()
        })
        this.onCloseDrawerTap()
    }

    goTo(url): void {
        openUrl(url)
    }

    onBackPressed():void {
        console.log('>> AppComponent onBackPressed')
        application.android.on(application.AndroidApplication.activityBackPressedEvent, (args: any) => {
                args.cancel = true
                this.zone.run(() => {
                    if (this.routerExtensions.canGoBack()) {
                        this.routerExtensions.back()
                        this.onCloseDrawerTap()
                    } else {
                        this.onExit()
                    }
                })
            }
        )
    }

    onCloseDrawerTap(): void {
        if (this.sideDrawerComponent) {
            this.sideDrawerComponent.sideDrawer.closeDrawer()
        }
    }

    onLogout(): void {
        this._competition.selected_competition_id$.next(null)
        this.auth.logout().then(() => {
            this.onCloseDrawerTap()
        })
    }

    onExit(): void {
        confirm({
            title: 'Are you sure?',
            message: 'This application will be closed',
            okButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result: boolean) => {
            if (result) {
                exit()
            }
        })
    }
}

