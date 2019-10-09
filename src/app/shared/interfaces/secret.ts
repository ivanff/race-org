import * as _ from "lodash"

export class Secret {
    admin = _.random(100000, 999999)
    marshal = _.random(100000, 999999)
    client = _.random(100000, 999999)
}
