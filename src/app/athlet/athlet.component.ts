import {Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {NfcTagData} from 'nativescript-nfc'
import {RouterExtensions} from 'nativescript-angular'
import {firestore} from 'nativescript-plugin-firebase'
import {SearchBar} from 'tns-core-modules/ui/search-bar'
import {isAndroid} from 'tns-core-modules/platform'
import {BaseComponent} from "@src/app/shared/base.component"
import {NfcService} from "@src/app/mobile/services/nfc.service"
import {ActivatedRoute} from "@angular/router"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {CompetitionService} from "@src/app/mobile/services/competition.service"

const firebase = require('nativescript-plugin-firebase/app')


@Component({
    selector: 'app-athlet',
    templateUrl: './athlet.component.html',
    styleUrls: ['./athlet.component.scss']
})
export class AthletComponent extends BaseComponent implements OnInit, OnDestroy {
    athlets: Array<Athlet> = []
    searchPhrase = ''
    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef
    @ViewChild('searchBar', {static: false}) searchBarRef: ElementRef
    private unsubscribe: () => void

    constructor(public routerExtensions: RouterExtensions,
                private zone: NgZone,
                private nfc: NfcService,
                private activeRoute: ActivatedRoute,
                private _competition: CompetitionService) {
        super(routerExtensions)
        console.log('>>> AthletComponent constructor')
    }

    ngOnInit() {
        console.log('>>> AthletComponent ngOnInit')
        const collectionRef: firestore.CollectionReference = firebase.firestore().collection(`athlets_${this._competition.selected_competition.id}`)
        this.unsubscribe = collectionRef.onSnapshot((snapshot: firestore.QuerySnapshot) => {
            this.zone.run(() => {
                this.athlets = []
                snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                    const id = doc.id
                    this.athlets.push({id,...doc.data()} as Athlet)
                })
            })
        })
    }

    ngOnDestroy(): void {
        if (this.activityIndicatorRef.nativeElement.busy) {
            this.nfc.doStopTagListener()
        }
        this.unsubscribe()
        console.log('>>> AthletComponent ngOnDestroy')
    }

    onItemTap(athlet: Athlet): void {
        this.searchBarRef.nativeElement.dismissSoftInput()
        if (isAndroid) {
            this.searchBarRef.nativeElement.android.clearFocus()
        }

        this.activityIndicatorRef.nativeElement.busy = false
        this.routerExtensions.navigate([athlet.phone], {relativeTo: this.activeRoute})
    }

    searchBarLoaded(args) {
        const searchBar = <SearchBar>args.object
        searchBar.dismissSoftInput()

        if (isAndroid) {
            searchBar.android.clearFocus()
        }
        searchBar.text = ''
    }

    onTextChanged(args) {
        const searchBar = <SearchBar>args.object
        if (searchBar.text.length) {
            this.searchPhrase = searchBar.text
        } else {
            this.searchPhrase = ''
        }
    }

    onSubmit(args) {
        const searchBar = <SearchBar>args.object
        if (isAndroid) {
            searchBar.android.clearFocus()
        }
    }

    searchAthlet(data: NfcTagData) {
        const athlets = firebase.firestore().collection(`athlets_${this._competition.selected_competition.id}`)
            .where('nfc_id', '==', data.id).get()

        athlets.then((snapshot: firestore.QuerySnapshot) => {
            if (snapshot.docs.length) {
                snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                    const athlet = doc.data() as Athlet
                    this.routerExtensions.navigate([athlet.phone], {relativeTo: this.activeRoute})
                })
            } else {
                alert('Nfc tag not found in DB')
            }
        })
    }

    onBusyChanged($event) {
        if ($event.object.busy) {
            this.zone.runOutsideAngular(() => this.nfc.doStartTagListener(this.searchAthlet.bind(this)))
        } else {
            this.nfc.doStopTagListener()
        }
    }
}
