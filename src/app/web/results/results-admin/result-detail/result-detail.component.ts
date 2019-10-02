import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router"
import {Athlet} from "@src/app/home/athlet"
import {ResultsComponent} from "@src/app/web/results/results.component"
import {AngularFirestore, AngularFirestoreDocument} from "@angular/fire/firestore"
import {CheckPoint} from "@src/app/home/checkpoint"
import {MatDialog, MatTableDataSource} from "@angular/material"
import {Mark} from "@src/app/home/mark"
import {ResultSetTimeComponent} from "@src/app/web/results/results-admin/result-detail/result-set-time/result-set-time.component"
import * as moment from "moment"
import {LocalStorageService} from "angular-2-local-storage"
import * as firebase from "firebase/app"
import {ResultAddMarkComponent} from "@src/app/web/results/results-admin/result-detail/result-add-mark/result-add-mark.component"

@Component({
    selector: 'app-result-detail',
    templateUrl: './result-detail.component.html',
    styleUrls: ['./result-detail.component.scss']
})
export class ResultDetailComponent implements OnInit {

    dataSource = new MatTableDataSource<any>([])
    displayedColumns: string[] = ['cp', 'nfc', 'nfc_cp_offset', 'local', 'actions']
    checkpoints: Array<CheckPoint> = []
    marks: Array<Mark> = []
    athlet: Athlet
    circle: number
    start_time: any

    constructor(private route: ActivatedRoute,
                private firestore: AngularFirestore,
                private dialog: MatDialog,
                private _localStorageService: LocalStorageService) {
        this.athlet = route.snapshot.data['athlet']

        if (this._localStorageService.get('start_time')) {
            this.start_time = moment(this._localStorageService.get('start_time'))
        }
    }

    ngOnInit() {
        this.marks = [...this.athlet.checkpoints.sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0)]
        this.buildRows()
    }

    private buildRows() {
        const cp_in_circle = (this.checkpoints.length / this.circle)
        let rows: Array<any> = []

        for (const i of ResultsComponent.range(0, this.checkpoints.length + 1, 1)) {
            const order = i % cp_in_circle
            const mark = this.marks[i]
            if (mark) {
                if (mark.order != order) {
                    this.marks.splice(i, 0, {
                        missing: true,
                        created: null,
                        key: `CP${order + 1}`,
                        order: order,
                    })
                }
            }
        }

        this.checkpoints.forEach((cp: CheckPoint, i: number) => {
            rows.push({
                checkpoint: cp,
                mark: this.marks[i]
            })
        })
        this.dataSource.data = rows
    }

    onSetTime(index: number): void {
        const dialogRef = this.dialog.open(ResultSetTimeComponent, {
            width: '250px',
            data: {}
            //build validator
        })
        dialogRef.afterClosed().subscribe(result => {
            delete this.marks[index].missing
            this.marks[index].manual = true

            this.marks[index].created = firebase.firestore.Timestamp.fromMillis(
                this.start_time.clone().set('hour', result[0]).set('minutes', result[1]).set('seconds', result[2]).format('x')
            )
        })
    }

    onDeleteTime(index: number): void {
        this.marks.splice(index, 1)
        this.marks = this.marks.filter((mark: Mark) => !mark.missing)
        this.buildRows()
    }
    onAddTime(): void {
        const dialogRef = this.dialog.open(ResultAddMarkComponent, {
            width: '250px',
            data: {
                start_time: this.start_time
            }
            //build validator
        })
        dialogRef.afterClosed().subscribe((result: Mark) => {
            this.marks.push(result)
            this.onSave()
        })
    }

    onSave(): void {
        const athletDoc: AngularFirestoreDocument<Athlet> = this.firestore.doc<Athlet>(`athlets/${this.athlet.id}`)

        athletDoc.update({
            checkpoints: this.marks.filter((mark: Mark) => {
                if (mark.missing && !mark.created) {
                    return false
                }
                return true
            })
        }).then((result) => console.log(result)).catch((err) => alert(err))
    }

    diffTime(a: firebase.firestore.Timestamp | null, b: firebase.firestore.Timestamp | null): string {
        if (a && b) {
            const diff: number = moment(b.toMillis()).diff(moment(a.toMillis()))
            return `+${Math.round(moment.duration(diff).asMinutes())}`
        }
        return ''
    }

    isLastCp(index: number): boolean {
        const cp_in_circle = this.checkpoints.length / this.circle
        if ((index % cp_in_circle) == (cp_in_circle - 1)) {
            return true
        }

        return false
    }
}
