import {Component, OnInit, ViewContainerRef, ViewChild, OnDestroy, AfterViewInit, NgZone} from "@angular/core";
import {ModalDialogOptions, ModalDialogService} from "nativescript-angular/modal-dialog";
import {RouterExtensions} from "nativescript-angular/router";
import {RadSideDrawerComponent} from "nativescript-ui-sidedrawer/angular";
import * as application from "tns-core-modules/application"
import {confirm} from "tns-core-modules/ui/dialogs"
import {exit} from "nativescript-exit"
import {RootComponent} from "./root/root.component"
import {NavigationEnd, Router} from "@angular/router"
import {filter} from "rxjs/operators"

const firebase = require('nativescript-plugin-firebase')


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
    private _activatedUrl: string

    @ViewChild(RadSideDrawerComponent, {static: false}) sideDrawerComponent: RadSideDrawerComponent

    constructor(private routerExtensions: RouterExtensions,
                private modalService: ModalDialogService,
                private vcRef: ViewContainerRef,
                private router: Router,
                private zone: NgZone) {
        this._activatedUrl = "/home"
    }

    ngAfterViewInit(): void {
        this.router.events
            .pipe(filter((event: any) => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => this._activatedUrl = event.urlAfterRedirects)
    }

    ngOnDestroy(): void {
        application.android.off(application.AndroidApplication.activityBackPressedEvent)
    }

    navigateTo(path: string, extras?: any): void {
        this.routerExtensions.navigate([path], extras)
        this.sideDrawerComponent.sideDrawer.closeDrawer()
    }

    openModal(path: string): void {
        const options: ModalDialogOptions = {
            fullscreen: true,
            viewContainerRef: this.vcRef,
            context: {
                path: [path]
            }
        };

        this.modalService.showModal(RootComponent, options).then((result) => {
            this.onBackPressed()
        })
        this.sideDrawerComponent.sideDrawer.closeDrawer()
    }

    async ngOnInit(): Promise<void> {
        this.onBackPressed()
        await firebase.init({
            //local cache
            persist: true,
            onAuthStateChanged: function (data) {
                console.log(
                    'AppComponent onAuthStateChanged',
                    JSON.stringify(data)
                )
            }
        })
    }

    onBackPressed():void {
        console.log(
            'onBackPressed'
        )
        application.android.on(application.AndroidApplication.activityBackPressedEvent, (args: any) => {
                args.cancel = true
                this.zone.run(() => {
                    if (this.routerExtensions.canGoBack()) {
                        this.routerExtensions.back()
                        this.sideDrawerComponent.sideDrawer.closeDrawer()
                    } else {
                        this.onExit()
                    }
                })
            }
        )
    }


    onCloseDrawerTap(): void {
        this.sideDrawerComponent.sideDrawer.closeDrawer()
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

