import {
    Component,
    OnInit,
} from '@angular/core'
import {ModalDialogParams, RouterExtensions} from "nativescript-angular"
import {TextField} from "tns-core-modules/ui/text-field"
import * as application from "tns-core-modules/application"
import {ActivatedRoute} from "@angular/router"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {ListViewEventData} from "nativescript-ui-listview"
import {layout, View} from "tns-core-modules/ui/core/view"
import {BaseComponent} from "@src/app/shared/base.component"


@Component({
    selector: 'app-start-list-add',
    templateUrl: './start-list-add.component.html',
    styleUrls: ['./start-list-add.component.scss']
})
export class StartListAddComponent extends BaseComponent implements OnInit {
    athlets: Array<Athlet> = []
    leftThresholdPassed = false
    rightThresholdPassed = false
    _class: string

    constructor(public routerExtensions: RouterExtensions,
                private router: ActivatedRoute) {
        super(routerExtensions)
        this._class = this.router.snapshot.params['class']
        this.athlets = this.router.snapshot.data['athlets']
    }

    ngOnInit() {
    }

    ngOnDestroy(): void {
    }

    public onSwipeCellStarted(args: ListViewEventData) {
        const swipeLimits = args.data.swipeLimits;
        const swipeView = args['object'];
        const leftItem = swipeView.getViewById<View>('mark-view');
        const rightItem = swipeView.getViewById<View>('delete-view');
        swipeLimits.left = leftItem.getMeasuredWidth();
        swipeLimits.right = rightItem.getMeasuredWidth();
        swipeLimits.threshold = leftItem.getMeasuredWidth() / 2;
    }

    public onSwipeCellFinished(args: ListViewEventData) {
        const swipeView = args['object'];
        const leftItem = swipeView.getViewById('mark-view');
        const rightItem = swipeView.getViewById('delete-view');
        if (this.leftThresholdPassed) {
            console.log("Perform left action");
        } else if (this.rightThresholdPassed) {
            console.log("Perform right action");
        }
        this.leftThresholdPassed = false;
        this.rightThresholdPassed = false;
    }

    onLeftSwipeClick($event): void {}
    onRightSwipeClick($event): void {}

    public onCellSwiping(args: ListViewEventData) {
        const swipeLimits = args.data.swipeLimits;
        const swipeView = args['swipeView'];
        const mainView = args['mainView'];
        const leftItem = swipeView.getViewById('mark-view');
        const rightItem = swipeView.getViewById('delete-view');

        if (args.data.x > swipeView.getMeasuredWidth() / 4 && !this.leftThresholdPassed) {
            console.log("Notify perform left action");
            const markLabel = leftItem.getViewById('mark-text');
            this.leftThresholdPassed = true;
        } else if (args.data.x < -swipeView.getMeasuredWidth() / 4 && !this.rightThresholdPassed) {
            const deleteLabel = rightItem.getViewById('delete-text');
            console.log("Notify perform right action");
            this.rightThresholdPassed = true;
        }
        if (args.data.x > 0) {
            const leftDimensions = View.measureChild(
                leftItem.parent,
                leftItem,
                layout.makeMeasureSpec(Math.abs(args.data.x), layout.EXACTLY),
                layout.makeMeasureSpec(mainView.getMeasuredHeight(), layout.EXACTLY));
            View.layoutChild(leftItem.parent, leftItem, 0, 0, leftDimensions.measuredWidth, leftDimensions.measuredHeight);
        } else {
            const rightDimensions = View.measureChild(
                rightItem.parent,
                rightItem,
                layout.makeMeasureSpec(Math.abs(args.data.x), layout.EXACTLY),
                layout.makeMeasureSpec(mainView.getMeasuredHeight(), layout.EXACTLY));

            View.layoutChild(rightItem.parent, rightItem, mainView.getMeasuredWidth() - rightDimensions.measuredWidth, 0, mainView.getMeasuredWidth(), rightDimensions.measuredHeight);
        }
    }
}
