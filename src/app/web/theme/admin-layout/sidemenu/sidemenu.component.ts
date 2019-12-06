import {Component, Input} from '@angular/core'
import {ChildrenItem, MenuService} from "@src/app/web/core/services/menu.service"
import {SettingsService} from "@src/app/web/core"
import {Competition} from "@src/app/shared/interfaces/competition"
import * as moment from "moment-timezone"
import {BehaviorSubject} from "rxjs"

@Component({
    selector: 'app-sidemenu',
    templateUrl: './sidemenu.component.html',
})
export class SidemenuComponent {
    // NOTE: Ripple effect make page flashing on mobile
    @Input() ripple = true;

    menus$ = new BehaviorSubject(this.menuService.getAll())

    constructor(private menuService: MenuService,
                private settings: SettingsService) {
        settings.competitions$.subscribe((values: Array<Competition>) => {
            let menu_competitions: Array<ChildrenItem> = []
            let menu_results: Array<ChildrenItem> = []
            values.forEach((value) => {
                if (value.start_date.toDate() < moment.utc().startOf('day').toDate() || true) {
                    menu_results.push({
                        "state": '/results/' + value.id,
                        "name": value.title,
                        "type": "state"
                    } as ChildrenItem)
                }
                menu_competitions.push({
                    "state": '/edit/' + value.id,
                    "name": value.title,
                    "type": "state"
                } as ChildrenItem)
            })

            this.menuService.setChildren('edit', menu_competitions)
            this.menuService.setChildren('results', menu_results)

            this.menus$.next(this.menuService.getAll())
        })
    }

    // Delete empty value in array
    filterStates(states: string[]) {
        return states.filter(item => item && item.trim());
    }
}
