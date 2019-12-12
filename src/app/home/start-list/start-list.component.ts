import {
    AfterViewInit,
    Compiler,
    Component, ComponentFactoryResolver,
    ElementRef, Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef
} from '@angular/core'
import {Competition} from "@src/app/shared/interfaces/competition"
import {ActivatedRoute} from "@angular/router"
import {
    ModalDialogOptions,
    ModalDialogParams, ModalDialogService,
    RouterExtensions
} from "nativescript-angular"
import {BaseComponent} from "@src/app/shared/base.component"
import {TabContentItem} from "tns-core-modules/ui/tab-navigation-base/tab-content-item"
import {TabStripItem} from "tns-core-modules/ui/tab-navigation-base/tab-strip-item"
import {Label} from "tns-core-modules/ui/label"
import {Image} from "tns-core-modules/ui/image"
import {TabStrip} from "tns-core-modules/ui/tab-navigation-base/tab-strip"
import {Tabs} from "tns-core-modules/ui/tabs"
import {StackLayout} from "tns-core-modules/ui/layouts/stack-layout"
import {View} from "tns-core-modules/ui/content-view"
import {ProxyViewContainer} from "tns-core-modules/ui/proxy-view-container"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {once} from "nativescript-angular/common/utils"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {firestore} from "nativescript-plugin-firebase"
import * as _ from "lodash"
import {BehaviorSubject, Observable, ReplaySubject} from "rxjs"
import {map, takeUntil} from "rxjs/operators"
import {getNumber, setNumber} from "tns-core-modules/application-settings"
import {StartListAddDialogComponent} from "@src/app/home/start-list/start-list-add-dialog/start-list-add-dialog.component"
import {rejects} from "assert"
import {StartListGroup} from "@src/app/shared/interfaces/start-list"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    templateUrl: './start-list-tab.component.tns.html'
})
export class StartListTabComponent implements OnInit, OnDestroy {
    private destroy = new ReplaySubject<any>(1)
    _class: string
    groupsDict = {}
    athlets: Array<Athlet> = []

    constructor(private _params: ModalDialogParams,
                private _competition: CompetitionService,
                private modalService: ModalDialogService,
                private vcRef: ViewContainerRef,
                private activeRoute: ActivatedRoute,
                private routerExtensions: RouterExtensions) {
        this._class = _params.context._class
        _params.context.athletsBehavior$.pipe(
            map((athlets: Array<Athlet>) => {
                return athlets.filter((athlet) => athlet.class == this._class)
            }),
            takeUntil(this.destroy)
        ).subscribe((athlets: Array<Athlet>) => {
            this.athlets = athlets
            const groupsDict = {}

            athlets.sort((a: Athlet, b: Athlet): number => {
                if (a.group && b.group) {
                    if (a.group[this._competition.selected_competition.id] && b.group[this._competition.selected_competition.id]) {
                        return a.group[this._competition.selected_competition.id].order > b.group[this._competition.selected_competition.id].order ? -1 : 1
                    }
                }
                return 0
            }).map((athlet: Athlet) => {
                const blank_group: StartListGroup = {
                    id: this._class,
                    order: -1,
                    start_time: null
                }
                const group: StartListGroup = athlet.group ? (athlet.group.hasOwnProperty(this._competition.selected_competition.id) ? athlet.group[this._competition.selected_competition.id] : blank_group) : blank_group
                if (!groupsDict.hasOwnProperty(group.id)) {
                    groupsDict[group.id] = [athlet]

                } else {
                    groupsDict[group.id].push(athlet)
                }
            })

            this.groupsDict = groupsDict
        })
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        console.log(
            'ngOnDestroy StartListTabComponent2'
        )
        this.destroy.next(null)
        this.destroy.complete()
    }

    getNumbers(athlets: Array<Athlet>): string {
        return athlets.map((athlet: Athlet) => athlet.number).sort((a, b) => a > b ? 1 : -1).join(';')
    }

    onSplit(): Promise<any> {
        const options: ModalDialogOptions = {
            context: {
                _class: this._class
            },
            viewContainerRef: this.vcRef,
            fullscreen: false
        }

        return this.modalService.showModal(StartListAddDialogComponent, options).then((resp: {action: string, value?: any} | null) => {
            if (resp) {
                switch (resp.action) {
                    case 'size':
                        return this.splitAthlet(_.shuffle(this.athlets), resp.value)
                    case 'stage':
                        alert("#TODO need stage results fixed")
                        return null
                    case 'navigate':
                        setTimeout(() => {
                            this.routerExtensions.navigate(resp.value, {relativeTo: this.activeRoute})
                        }, 100)
                        return null
                    default:
                        return null
                }
            }
        });
    }

    onRemoveGroup(): void {
        let batch = firebase.firestore().batch()
        const collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
        this.athlets.forEach((athlet: Athlet) => {
            batch = batch.update(collection.doc(athlet.id), {group: null})
        })
        batch.commit().then(() => {
            alert(`Remove Group '${this._class}' success`)
        })
    }

    onItemTap($event): void {
        const item = $event.object.items[$event.index]
        this.routerExtensions.navigate([`./${item.key}`], {
            relativeTo: this.activeRoute
        })
    }

    private splitAthlet(athlets: Array<Athlet>, size: number): Promise<any> {
        return new Promise((resolve, reject) => {
            if (athlets.length < size) {
                reject()
            } else {
                let batch = firebase.firestore().batch()
                const collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
                _.chunk(athlets, size).forEach((group: Array<Athlet>, index: number) => {
                    group.forEach((athlet: Athlet) => {
                        const athlet_group = athlet.group || {}

                        athlet_group[this._competition.selected_competition.id] = {
                            id: `${this._class}_${index}`,
                            order: index,
                            start_time: null
                        } as StartListGroup

                        batch = batch.update(collection.doc(athlet.id), {
                            group: athlet_group
                        })
                    })
                })
                return batch.commit().then(() => {
                    resolve()
                }, reject)

            }
        })
    }
}

@Component({
    selector: 'app-start-list',
    templateUrl: './start-list.component.tns.html',
    styleUrls: ['./start-list.component.scss']
})
export class StartListComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
    private destroy = new ReplaySubject<any>(1)
    private competition: Competition
    private tapStripItems: Array<TabStripItem> = []
    private tapContentItems: Array<TabContentItem> = []
    private tabStrip = new TabStrip()
    private athlets$: Observable<Array<Athlet>> = this.firestoreCollectionObservable()
    private athletsBehavior$ = new BehaviorSubject<Array<Athlet>>([])

    tabIndex = getNumber('tabIndex', 0)

    @ViewChild('tabs', {static: false}) tabsRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                private vcRef: ViewContainerRef,
                private compiler: Compiler,
                private router: ActivatedRoute,
                private _competition: CompetitionService) {
        super(routerExtensions)
        this.competition = this.router.snapshot.data['competition']

        this.competition.classes.forEach((_class: string) => {
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
            tabContentItem.content = this.createContent(_class)
            this.tapContentItems.push(
                tabContentItem
            )
            return
        })

        this.tabStrip.items = this.tapStripItems

        this.athlets$.pipe(
            takeUntil(this.destroy)
        ).subscribe((athlets: Array<Athlet>) => {
            this.athletsBehavior$.next(athlets)
        }, (err) => {
            console.error(err)
        })
    }

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        const tabs = <Tabs>this.tabsRef.nativeElement
        tabs.items = this.tapContentItems
        tabs.tabStrip = this.tabStrip
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
    }

    private firestoreCollectionObservable(): Observable<Array<Athlet>> {
        return new Observable((subscriber) => {
            let colRef: firestore.CollectionReference = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
                .orderBy('created', 'desc')

            return colRef.onSnapshot((snapshot: firestore.QuerySnapshot) => {
                const athlets: Array<Athlet> = []
                snapshot.forEach((doc: firestore.DocumentSnapshot ) => {
                    const id = doc.id
                    athlets.push({
                        id,...doc.data()
                    } as Athlet)
                })
                subscriber.next(athlets)
            })
        })
    }

    private createContent(_class: string) {
        const resolver = this.vcRef.injector.get(ComponentFactoryResolver);
        let componentView: View;

        const componentFactory = resolver.resolveComponentFactory(StartListTabComponent);

        const closeCallback = once((...args) => {
            console.log(
                'closeCallback'
            )
        })

        const modalParams = new ModalDialogParams({
            '_class': _class,
            'athletsBehavior$': this.athletsBehavior$
        }, closeCallback);

        const childInjector = Injector.create({
            providers: [{provide: ModalDialogParams, useValue: modalParams}],
            parent: this.vcRef.injector
        })

        const compRef = this.vcRef.createComponent(componentFactory, -1, childInjector, null)
        const detachedProxy = <ProxyViewContainer>compRef.location.nativeElement

        componentView = detachedProxy.getChildAt(0)

        if (componentView.parent) {
            (<any>componentView.parent)._ngDialogRoot = componentView;
            (<any>componentView.parent).removeChild(componentView);
        }

        const stack = new StackLayout()
        stack.addChild(componentView)
        return stack
    }

    onSelectedIndexChanged($event): void {
        setNumber('tabIndex', $event.newIndex)
    }
}
