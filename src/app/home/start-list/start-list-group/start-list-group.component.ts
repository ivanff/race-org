import {
    Component,
    OnInit,
} from '@angular/core'
import {
    RouterExtensions
} from "nativescript-angular"
import {BaseComponent} from "@src/app/shared/base.component"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {ActivatedRoute} from "@angular/router"

@Component({
    selector: 'app-start-list-group',
    templateUrl: './start-list-group.component.html',
})
export class StartListGroupComponent extends BaseComponent implements OnInit {
    athlets: Array<Athlet> = []

    constructor(public routerExtensions: RouterExtensions,
                private router: ActivatedRoute) {
        super(routerExtensions)
        this.athlets = this.router.snapshot.data['athlets'].sort((a: Athlet, b: Athlet) => a.number > b.number ? 1 : -1)
    }
    ngOnInit(): void {
    }

    onItemTap($event): void {
        const athlet: Athlet = $event.object.items[$event.index]
        this.routerExtensions.navigate(['athlets', athlet.id])
    }
}
