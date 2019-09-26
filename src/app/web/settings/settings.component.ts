import {Component, OnInit} from '@angular/core'
import {AngularFirestore, DocumentSnapshot} from '@angular/fire/firestore'
import {FormBuilder, FormGroup, FormGroupDirective, Validators} from "@angular/forms"
import {RegisterComponent} from "@src/app/web/access/register/register.component"
import {Athlet} from "@src/app/home/athlet"

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
    athlet: Athlet
    phoneForm: FormGroup

    constructor(public _fb: FormBuilder,
                public firestore: AngularFirestore) {
    }

    ngOnInit() {
        this.phoneForm = this._fb.group({
            phone: ['', [<any>Validators.minLength(10), <any>Validators.maxLength(10), Validators.pattern("^[0-9]*$")], [RegisterComponent.usedValue(this.firestore, 'phone', true)]]
        })
    }

    onAthletCheckpointsClear() {
        const batch = this.firestore.firestore.batch()
        this.firestore.collection('athlets').ref.get().then((snapshot) => {
            snapshot.docs.forEach((value => batch.update(value.ref, {checkpoints: []})))
            batch.commit().then(() => alert('success'))
        })
    }

    onSave(model, valid: boolean, formDirective?: FormGroupDirective): void {
        if (valid) {
            this.firestore.collection('athlets').doc(model.phone).get().subscribe((doc: DocumentSnapshot<any>) => {
                if (doc.exists) {
                    const id = doc.id
                    this.athlet = {id, ...doc.data()}
                }
            })
        }
    }

}
