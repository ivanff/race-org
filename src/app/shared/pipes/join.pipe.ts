import {Pipe, PipeTransform} from '@angular/core'

@Pipe({
    name: 'join'
})
export class JoinPipe implements PipeTransform {
    transform(list: Array<any>, sep?: string): string {
        console.log(list)
        return list.join(sep || ', ')
    }
}
