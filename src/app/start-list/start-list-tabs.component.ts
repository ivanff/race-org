import {
    AfterViewInit, ChangeDetectorRef,
    Compiler,
    Component, ComponentFactoryResolver, ComponentRef,
    ElementRef, Injector, NgZone,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef
} from '@angular/core'
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute, NavigationEnd} from "@angular/router"
import {
    DetachedLoader,
    ModalDialogParams,
    RouterExtensions
} from "nativescript-angular"
import {BaseComponent} from "@src/app/shared/base.component"
import {TabContentItem} from "@nativescript/core/ui/tab-navigation-base/tab-content-item"
import {TabStripItem} from "@nativescript/core/ui/tab-navigation-base/tab-strip-item"
import {Label} from "@nativescript/core/ui/label"
import {Image} from "@nativescript/core/ui/image"
import {TabStrip} from "@nativescript/core/ui/tab-navigation-base/tab-strip"
import {Tabs} from "@nativescript/core/ui/tabs"
import {StackLayout} from "@nativescript/core/ui/layouts/stack-layout"
import {View} from "@nativescript/core/ui/content-view"
import {ProxyViewContainer} from "@nativescript/core/ui/proxy-view-container"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {once} from "nativescript-angular/common/utils"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {firestore} from "nativescript-plugin-firebase"
import {BehaviorSubject, Observable, ReplaySubject} from "rxjs"
import {filter, first, shareReplay, takeUntil} from "rxjs/operators"
import {getNumber, setNumber} from "@nativescript/core/application-settings"
import {StartListTabItemComponent} from "@src/app/start-list/start-list-tab-item.component"

const firebase = require('nativescript-plugin-firebase/app')

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

@Component({
    selector: 'app-start-list-tabs',
    templateUrl: './start-list-tabs.component.tns.html'
})
export class StartListTabsComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
    private destroy = new ReplaySubject<any>(1)
    private competition: Competition
    private tapStripItems: Array<TabStripItem> = []
    private tapContentItems: Array<TabContentItem> = []
    private tabStrip = new TabStrip()
    // private athlets$: Observable<Array<Athlet>> = this.firestoreCollectionObservable()
    private athletsBehavior$ = new BehaviorSubject<Array<Athlet>>([])
    private tabIndex$ = new BehaviorSubject<number>(getNumber('tabIndex', 0))
    private unsubscribe: () => void

    test = getRandomInt(1000)

    @ViewChild('tabs', {static: false}) tabsRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                private vcRef: ViewContainerRef,
                private compiler: Compiler,
                private activeRoute: ActivatedRoute,
                private zone: NgZone,
                private _changeDetectionRef: ChangeDetectorRef,
                private _competition: CompetitionService) {

        super(routerExtensions)


        this.competition = this.activeRoute.parent.snapshot.data['competition']
        this.competition.classes.forEach((_class: string, index: number) => {
            const label = new Label()
            label.text = _class.toUpperCase()

            const image = new Image()
            image.src = "font://"
            image.className = ""

            const tabStripItem = new TabStripItem()
            tabStripItem.title = _class
            tabStripItem.label = label
            tabStripItem.image = image
            tabStripItem.iconSource = "font://"
            this.tapStripItems.push(
                tabStripItem
            )
            const tabContentItem = new TabContentItem()
            this.createContent(_class, index).then((content) => {
                tabContentItem.content = content
            })
            // tabContentItem.content = this.createContent(_class, index)
            this.tapContentItems.push(
                tabContentItem
            )
            return
        })

        this.tabStrip.items = this.tapStripItems

        console.log('constructor StartListTabsComponent')

        let colRef: firestore.CollectionReference = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
            .orderBy('created', 'desc')

        colRef.get({source: 'cache'}).then((snapshot: firestore.QuerySnapshot) => {
            this.athletsBehavior$.next(this.fillAthlets(snapshot))
        })

        this.unsubscribe = colRef.onSnapshot( (snapshot: firestore.QuerySnapshot) => {
            this.athletsBehavior$.next(this.fillAthlets(snapshot))
        })
    }

    ngOnInit(): void {
        console.log(`ngOnInit StartListTabsComponent ${this.test}`)
    }

    ngAfterViewInit(): void {
        if (this.tabsRef) {
            const tabs = <Tabs>this.tabsRef.nativeElement
            tabs.selectedIndex = this.tabIndex$.getValue()
            tabs.items = this.tapContentItems
            tabs.tabStrip = this.tabStrip

            this.tabIndex$.subscribe((next) => {
                tabs.selectedIndex = next
                setNumber('tabIndex', next)
            })
        }
    }

    ngOnDestroy(): void {
        console.log(`ngOnDestroy StartListTabsComponent ${this.test}`)
        this.unsubscribe()
        this.destroy.next(null)
        this.destroy.complete()
    }

    private fillAthlets(snapshot: firestore.QuerySnapshot): Athlet[] {
        const athlets: Array<Athlet> = []
        snapshot.forEach((doc: firestore.DocumentSnapshot) => {
            const id = doc.id
            athlets.push({
                id, ...doc.data()
            } as Athlet)
        })
        return athlets
    }

    private createContent(_class: string, tabIndex: number): Promise<any> {
        const resolver = this.vcRef.injector.get(ComponentFactoryResolver);
        let componentView: View;

        const closeCallback = once((...args) => {
            console.log(
                'closeCallback'
            )
        })

        const modalParams = new ModalDialogParams({
            '_class': _class,
            'athletsBehavior$': this.athletsBehavior$,
            'tabIndex$': this.tabIndex$,
            'tabIndex': tabIndex
        }, closeCallback);

        const childInjector = Injector.create({
            providers: [{provide: ModalDialogParams, useValue: modalParams}],
            parent: this.vcRef.injector
        })

        let detachedLoaderRef: ComponentRef<DetachedLoader>
        const detachedFactory = resolver.resolveComponentFactory(DetachedLoader)

        detachedLoaderRef = this.vcRef.createComponent(detachedFactory, -1, childInjector, null)
        return detachedLoaderRef.instance.loadComponent(StartListTabItemComponent).then((compRef) => {
            const detachedProxy = <ProxyViewContainer>compRef.location.nativeElement
            componentView = detachedProxy.getChildAt(0)

            if (componentView.parent) {
                (<any>componentView.parent)._ngDialogRoot = componentView;
                (<any>componentView.parent).removeChild(componentView);
            }

            const stack = new StackLayout()
            stack.addChild(componentView)
            return stack
        })
    }

    onSelectedIndexChanged($event): void {
        this.tabIndex$.next($event.newIndex)
    }

}
