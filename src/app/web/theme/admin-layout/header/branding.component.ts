import { Component } from '@angular/core';

@Component({
  selector: 'app-branding',
  template: `
    <div class="matero-branding">
      <img src="./assets/images/logo.png" class="matero-branding-logo-expanded" alt="" />
      <span class="matero-branding-name">Race Org</span>
    </div>
  `,
})
export class BrandingComponent {}
