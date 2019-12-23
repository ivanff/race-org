import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core'
import {ListViewEventData, RadListView} from "nativescript-ui-listview"
import {BaseComponent} from "@src/app/shared/base.component"
import {RouterExtensions} from "nativescript-angular"
import {layout, View} from "@nativescript/core/ui/core/view"

@Component({
    selector: 'app-rad-list-swipe',
    template: '',
    styleUrls: []
})
export class RadListSwipeComponent extends BaseComponent implements AfterViewInit {
    private _isSwipeEnded: boolean
    private _currentItemIndex: number

    leftThresholdPassed = false
    rightThresholdPassed = false

    @ViewChild('radListRef', {static: false}) listViewRef: ElementRef
    listView: RadListView

    constructor(public routerExtensions: RouterExtensions) {
        super(routerExtensions)
    }

    ngAfterViewInit(): void {
        this.listView = this.listViewRef.nativeElement
    }

    onSwipeCellStarted(args: ListViewEventData) {
        this._isSwipeEnded = false
        const swipeLimits = args.data.swipeLimits;
        const swipeView = args['object']
        if (swipeView) {
            const leftItem = swipeView.getViewById<View>('mark-view');
            const rightItem = swipeView.getViewById<View>('delete-view');
            swipeLimits.left = leftItem.getMeasuredWidth();
            swipeLimits.right = rightItem.getMeasuredWidth();
            swipeLimits.threshold = leftItem.getMeasuredWidth() / 2;
            this._currentItemIndex = args.index
        }
    }

    onSwipeCellFinished(args: ListViewEventData) {
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

    onLeftSwipeClick(args: ListViewEventData): void {
        this.listView.notifySwipeToExecuteFinished()
    }

    onRightSwipeClick(args: ListViewEventData): void {
        this.listView.notifySwipeToExecuteFinished()
    }

    onCellSwiping(args: ListViewEventData) {
        const swipeLimits = args.data.swipeLimits;
        const swipeView = args['swipeView'];
        if (swipeView) {
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

}
