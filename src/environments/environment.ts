// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // backend_gateway: 'https://agestart.ru/js_api/mobile',
  SERVER_URL: 'http://local.agestart.ru:8003',
  backend_gateway: 'http://local.agestart.ru:8003/js_api/mobile',
  firebase: {
    apiKey: "AIzaSyAKQN8eQ3HmfKE78qfczd6DLjKyRiS4ewA",
    authDomain: "race-org.firebaseapp.com",
    databaseURL: "https://race-org.firebaseio.com",
    projectId: "race-org",
    storageBucket: "race-org.appspot.com",
    messagingSenderId: "599442157307",
    appId: "1:599442157307:web:86360c312465ceb53bca5e"
  },
  useHash: true,
  hmr: true,
}

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error'  // Included with Angular CLI.
