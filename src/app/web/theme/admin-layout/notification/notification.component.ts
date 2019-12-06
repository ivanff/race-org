import {Component, Input} from "@angular/core"

@Component({
    templateUrl: "./notification.component.html",
    selector: 'notification',
})
export class NotificationComponent {
    @Input() status: string = 'success'
}
