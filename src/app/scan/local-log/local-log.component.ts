import {Component, OnInit} from '@angular/core';
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"
import {SqliteService} from "@src/app/mobile/services/sqlite.service"
import {SqlRow} from "@src/app/shared/interfaces/sql-row"
import {confirm, ConfirmOptions} from "tns-core-modules/ui/dialogs"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {Competition} from "@src/app/shared/interfaces/competition"

@Component({
    selector: 'app-local-log',
    templateUrl: './local-log.component.html',
    styleUrls: ['./local-log.component.scss']
})
export class LocalLogComponent extends BaseComponent implements OnInit {
    items: Array<SqlRow> = []
    pending: boolean = false
    competition: Competition

    constructor(public routerExtensions: RouterExtensions,
                private _competition: CompetitionService,
                private options: SqliteService) {
        super(routerExtensions)
        this.competition = this._competition.selected_competition
    }

    ngOnInit() {
        this.pending = this.options.fetch().then((items: Array<SqlRow>) => this.items = [...items]).pending
    }

    onUpload(): void {
        this.options.upload()
    }

    onDropTable(): void {
        confirm({
            title: "Are you shure?",
            message: "All data will be lost",
            okButtonText: 'Yes',
            cancelButtonText: 'No',
        }).then((result) => {
            if (result) {
                this.options.dropTable()
            }
        })
    }

}
