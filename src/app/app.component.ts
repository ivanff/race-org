import {
    Component,
    OnInit,
    ViewContainerRef,
    ViewChild,
    OnDestroy,
    AfterViewInit,
    NgZone,
    ChangeDetectorRef, ElementRef
} from "@angular/core";
import {ModalDialogOptions, ModalDialogService} from "nativescript-angular/modal-dialog";
import {RouterExtensions} from "nativescript-angular/router";
import * as application from "@nativescript/core/application"
import {confirm} from "@nativescript/core/ui/dialogs"
import {exit} from "nativescript-exit"
import {RootComponent} from "./root/root.component"
import {ActivatedRoute, NavigationEnd, Params} from "@angular/router"
import {filter} from "rxjs/operators"
import {AuthService} from "./mobile/services/auth.service"
import {CompetitionService} from "./mobile/services/competition.service"
import {openUrl} from "@nativescript/core/utils/utils"
import {RadSideDrawer} from "nativescript-ui-sidedrawer"
import {localize as L} from "nativescript-localize"
import {ExtendedNavigationExtras} from "@nativescript/angular/router/router-extensions";

const firebase = require('nativescript-plugin-firebase')

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
// @ts-ignore
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
    _activatedUrl: string = '/'
    _activatedParams: Params
    private drawer: RadSideDrawer
    // @ts-ignore
    @ViewChild("sideDrawerId", {static: false}) drawerComponent: ElementRef

    constructor(
        private routerExtensions: RouterExtensions,
        private activeRoute: ActivatedRoute,
        private modalService: ModalDialogService,
        private _changeDetectionRef: ChangeDetectorRef,
        private vcRef: ViewContainerRef,
        private zone: NgZone,
        public auth: AuthService,
        public _competition: CompetitionService) {
    }

    ngOnInit() {
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
        //check ngDestroy

        this.drawer = this.drawerComponent.nativeElement as RadSideDrawer
        this.routerExtensions.router.events
            .pipe(
                filter((event: any) => event instanceof NavigationEnd),
            )
            .subscribe((event: NavigationEnd) => {
                this._activatedParams = this.activeRoute.snapshot.queryParams
                this._activatedUrl = event.urlAfterRedirects || ''
            })
        this._changeDetectionRef.detectChanges()
    }

    ngOnDestroy(): void {
        application.android.off(application.AndroidApplication.activityBackPressedEvent)
    }

    navigateTo(path: any, extras?: ExtendedNavigationExtras): void {
        this.routerExtensions.navigate([path], extras).then((result) => {
            if (result) {
                this.closeDrawer()
            }
        })
    }

    openModal(path: any): void {
        const options: ModalDialogOptions = {
            fullscreen: true,
            viewContainerRef: this.vcRef,
            context: {
                path: path
            }
        }
        this.modalService.showModal(RootComponent, options)
        this.closeDrawer()
    }

    goTo(url): void {
        openUrl(url)
    }

    onBackPressed(): void {
        console.log('>> AppComponent onBackPressed')
        application.android.on(application.AndroidApplication.activityBackPressedEvent, (args: any) => {
            args.cancel = true
            if (!args.stopEvent) {
                this.zone.run(() => {
                    if (this._activatedUrl.startsWith('/start-list/(startList:list/')) {
                        this.routerExtensions.navigate(['/start-list', {outlets: {startList: ['list']}}], {
                            relativeTo: this.activeRoute,
                            replaceUrl: true
                        })
                    } else if (this._activatedUrl.startsWith('/start-list/(startList:add/')) {
                        this.routerExtensions.navigate(['/start-list', {outlets: {startList: ['list']}}], {
                            relativeTo: this.activeRoute,
                            replaceUrl: true
                        })
                    } else if (this._activatedUrl.startsWith('/start-list/(startList:athlet/') && this._activatedParams.hasOwnProperty('back')) {
                        const list: Array<string> = this._activatedParams['back'].map((item) => {
                            return decodeURI(item)
                        })
                        this.routerExtensions.navigate(['/start-list', {outlets: {startList: list}}], {
                          relativeTo: this.activeRoute,
                          replaceUrl: true
                        })
                    } else if (this.routerExtensions.canGoBack()) {
                        this.routerExtensions.back({
                            relativeTo: this.activeRoute,
                        })
                    } else {
                        console.log(
                            "'Can't go back"
                        )
                        if (this._activatedUrl == '/home') {
                            // this.onExit()
                        } else {
                            this.routerExtensions.navigate(['/home'], {
                                relativeTo: this.activeRoute,
                                clearHistory: true,
                                animated: false
                            })
                        }
                    }
                    this.closeDrawer()
                })
            }
        })
    }

    closeDrawer(): void {
        this.drawer.closeDrawer()
    }

    onLogout(): void {
        this._competition.selected_competition_id$.next(null)
        this.auth.logout().then(() => {
            this.closeDrawer()
        })
    }

    onExit(): void {
        confirm({
            title: L('Are you sure?'),
            message: L('This application will be closed'),
            okButtonText: L('Yes'),
            cancelButtonText: L('No')
        }).then((result: boolean) => {
            if (result) {
                exit()
            }
        })
    }
}

