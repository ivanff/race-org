import {Pipe, PipeTransform} from '@angular/core'

@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], field: string | Array<string>, value: string): any[] {
      if (!items) {
        return []
      }
      if (!value) {
        return items
      }
      return items.filter(it => {
          if (Array.isArray(field)) {
              let result = true

              for (let f of field) {
                  result = it[f].toString().toLowerCase().indexOf(value.toLowerCase()) >= 0
                  if (result) {
                      break
                  }

              }
              return result
          } else {
              return it[field].toLowerCase().indexOf(value.toLowerCase()) >= 0
          }
      })
    }
}
