import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router"
import {Athlet} from "@src/app/home/athlet"
import {ResultsComponent} from "@src/app/web/results/results.component"
import {AngularFirestore, AngularFirestoreCollection} from "@angular/fire/firestore"
import {CheckPoint} from "@src/app/home/checkpoint"
import {MatDialog, MatTableDataSource} from "@angular/material"
import {Mark} from "@src/app/home/mark"
import {AdminPromptComponent} from "@src/app/web/access/admin-prompt/admin-prompt.component"
import {ResultSetTimeComponent} from "@src/app/web/results/results-admin/result-detail/result-set-time/result-set-time.component"
import * as moment from "moment"
import {LocalStorageService} from "angular-2-local-storage"

@Component({
    selector: 'app-result-detail',
    templateUrl: './result-detail.component.html',
    styleUrls: ['./result-detail.component.scss']
})
export class ResultDetailComponent implements OnInit {

    dataSource = new MatTableDataSource<any>([])
    displayedColumns: string[] = ['cp', 'nfc', 'local', 'actions']
    checkpoints: Array<CheckPoint> = []
    marks: Array<Mark> = []
    athlet: Athlet
    circle: number
    start_time: any

    constructor(private route: ActivatedRoute,
                private dialog: MatDialog,
                private _localStorageService: LocalStorageService) {
        this.athlet = route.snapshot.data['athlet']

        if (this._localStorageService.get('start_time')) {
            this.start_time = moment(this._localStorageService.get('start_time'))
        }
    }

    ngOnInit() {
        console.log(
            this.checkpoints,
            this.circle
        )
        const cp_in_circle = (this.checkpoints.length / this.circle)
        let rows: Array<any> = []
        this.marks = [...this.athlet.checkpoints]

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

    onSetTime(index: number) {
        const dialogRef = this.dialog.open(ResultSetTimeComponent, {
            width: '250px',
            data: {}
            //build validator
        })
        dialogRef.afterClosed().subscribe(result => {
            this.marks[index].manual = true
            this.marks[index].created = this.start_time.clone()
                .set('hour', result[0]).set('minutes', result[1])
                .set('seconds', result[2])
        })
    }

}
