import {Component, OnInit} from '@angular/core'
import {AngularFirestore} from '@angular/fire/firestore'

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

    constructor(private firebase: AngularFirestore) {
    }

    ngOnInit() {
    }

    onAthletCheckpointsClear() {
        const batch = this.firebase.firestore.batch()
        this.firebase.collection('athlets').ref.get().then((snapshot) => {
            snapshot.docs.forEach((value => batch.update(value.ref, {checkpoints: []})))
            batch.commit().then(() => alert('success'))
        })
    }

}
