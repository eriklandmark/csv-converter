
interface CSVParserSettings {
    delimiter: string
    delete_quotes?: boolean
    to_columns?: boolean
    do_checks?: boolean
    trim?: boolean
}

interface CSVStringifySettings {
    delimiter: string
    add_quotes?: boolean
    is_columns?: boolean
}

interface CSVData {
    columns: string[]
    rows: {[propName: string]: string}[] | string[][]
}

export default class CSVParser {

    parse(data: string, settings: CSVParserSettings = {delimiter: ";"}): CSVData {
        if(settings.do_checks) {
            if (data.indexOf(settings.delimiter) == -1) {
                throw "Couldn't find specified delimiter."
            }
        }

        const rows = data.trim().split("\n").map((row) => row.trim())
        const columns: string[] = rows[0].replace(/"/g, "").split(settings.delimiter).map((col) => {
            return settings.delete_quotes? col : `"${col}"`
        })

        return {
            columns,
            rows: rows.slice(1).map((row: string, index: number) => {
                let delimiter = settings.delimiter

                if (!settings.delete_quotes && row.indexOf(`"${settings.delimiter}"`) > -1) {
                    delimiter = `"${settings.delimiter}"`
                }

                let objects = row.split(delimiter).map((obj: string) => {
                    obj = settings.trim ? obj.trim() : obj
                    obj = obj.replace(/"/g, "")
                    return settings.delete_quotes? obj : `"${obj}"`
                })

                if (settings.to_columns) {
                    objects = objects.reduce((acc:any, obj:string, index:number) => {
                        acc[columns[index]] = obj
                        return acc
                    }, {})
                }

                if (settings.do_checks) {
                    const obj_count = settings.to_columns? Object.keys(objects).length: objects.length
                    if (obj_count !== columns.length) {
                        throw Error(`Wrong number of attributes at line ${index + 1}, found ${obj_count} instead of ${columns.length}.`)
                    }
                }

                return objects
            })
        } as CSVData
    }

    stringify(data: CSVData, settings: CSVStringifySettings): string {
        const addQuotes = (obj: string) => {
            let out = obj
            if (!obj.startsWith("\"")) {
                out = "\"" + out
            }
            if (!obj.endsWith("\"")) {
                out += "\""
            }
            return out
        }

        const columns_string = settings.add_quotes? data.columns.map(addQuotes).join(settings.delimiter): data.columns.join(settings.delimiter)
        const row_string = (<any[]>data.rows).reduce((acc: string, row: any[] | string[]) => {
            let objects: string[] = row
            if (settings.is_columns) {
                objects = data.columns.map((col:string) => (<any>row)[col])
            }

            if (settings.add_quotes) {
                objects = objects.map(addQuotes)
            }

            acc += objects.join(settings.delimiter) + "\n"
            return acc
        }, "")
        return columns_string + "\n" + row_string
    }
}