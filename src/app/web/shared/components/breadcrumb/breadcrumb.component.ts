import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import {MenuService} from "@src/app/web/core"

@Component({
  selector: 'breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BreadcrumbComponent implements OnInit {
  routeNames = [];

  constructor(private router: Router, private menuService: MenuService) {}

  ngOnInit() {
    this.genBreadcrumb();
  }

  genBreadcrumb() {
    const states = this.router.url.slice(1).split('/');
    this.routeNames = this.menuService.getMenuLevel(states);
    this.routeNames.unshift('Домой');
  }
}
