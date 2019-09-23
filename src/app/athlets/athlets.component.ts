import {Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {NfcTagData} from 'nativescript-nfc'
import {RouterExtensions} from 'nativescript-angular'
import {firestore} from 'nativescript-plugin-firebase'
import {SearchBar} from 'tns-core-modules/ui/search-bar'
import {isAndroid} from 'tns-core-modules/platform'
import {BaseComponent} from "@src/app/shared/base.component"
import {NfcService} from "@src/app/shared/nfc.service"
import {Athlet} from "@src/app/home/athlet"
import {ActivatedRoute} from "@angular/router"

const firebase = require('nativescript-plugin-firebase/app')

const initial = [
    {
        'phone': 9603273301,
        'fio': 'Черняев Данила Дмитриевич',
        'number': 888,
        'bike': 'Beta 300 RR',
        'city': 'Саратов',
        'checkpoints': []
    },
    {
        'phone': 96054654302,
        'fio': 'Ермаченков Дмитрий Владимирович',
        'number': 74,
        'bike': 'KTM 300',
        'city': 'Уфа',
        'checkpoints': []
    },
    {
        'phone': 9634544303,
        'fio': 'Миронов Данила Константинович',
        'number': 313,
        'bike': 'KTM EXC300 tpi',
        'city': 'Москва',
        'checkpoints': []
    },
    {
        'phone': 963454304,
        'fio': 'Степанов Владимир Васильевич',
        'number': 46,
        'bike': 'Beta 250 RR',
        'city': 'Москва',
        'checkpoints': []
    },
]

@Component({
    selector: 'app-athlets',
    templateUrl: './athlets.component.html',
    styleUrls: ['./athlets.component.scss']
})
export class AthletsComponent extends BaseComponent implements OnInit, OnDestroy {
    athlets: Array<Athlet> = []
    searchPhrase = ''
    @ViewChild('activityIndicator', {static: false}) activityIndicatorRef: ElementRef

    constructor(public routerExtensions: RouterExtensions,
                private zone: NgZone,
                private nfc: NfcService,
                private activeRoute: ActivatedRoute) {
        super(routerExtensions)
        const $zone = this.zone

        const collectionRef: firestore.CollectionReference = firebase.firestore().collection('athlets')
        collectionRef.onSnapshot({includeMetadataChanges: true}, (snapshot: firestore.QuerySnapshot) => {
            $zone.run(() => {
                this.athlets = []
                snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                    this.athlets.push(doc.data() as Athlet)
                })
            })
        })

    }

    ngOnInit() {
        // remove
        // WARNING CHECK COLLECTION
        // for (const athlet of initial) {
        //     firebase.firestore().collection('athlets').doc(athlet.phone + '').get().then((doc: firestore.DocumentSnapshot) => {
        //         if (!doc.exists) {
        //             firebase.firestore().collection('athlets').doc(athlet.phone + '').set(athlet, {merge: true})
        //         }
        //     })
        // }
    }

    ngOnDestroy(): void {
        if (this.activityIndicatorRef.nativeElement.busy) {
            this.nfc.doStopTagListener()
        }
    }

    onItemTap(athlet: Athlet): void {
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
        if (searchBar.text.length > 2) {
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
        const athlets = firebase.firestore().collection('athlets')
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
