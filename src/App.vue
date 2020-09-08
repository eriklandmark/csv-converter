<template lang="pug">
    v-app
        v-snackbar(v-model="showSnackBar" color="success" top :timeout="2000" width="50" ) Done!
            template(v-slot:action='{ attrs }')
                v-btn(icon v-bind='attrs', @click='showSnackBar = false')
                    v-icon mdi-close

        v-snackbar(v-model="errorSnackBar" color="error" top :timeout="3000" width="50" ) Error converting! Try with different settings.
            template(v-slot:action='{ attrs }')
                v-btn(icon v-bind='attrs', @click='errorSnackBar = false')
                    v-icon mdi-close

        v-dialog(v-model="infoDialog" width='300')
            v-card
                v-card-title Information
                v-card-text Version: 1.1.0
                    br
                    | Author: Erik Landmark
                v-card-actions
                    v-spacer
                    v-btn(text @click="infoDialog = false") close

        v-dialog(v-model="fileExistsDialog")
            v-card
                v-card-title.red--text File already exists!
                v-card-text It already exists a file at that path. Do you want to continue?
                v-card-actions
                    v-spacer
                    v-btn(@click="fileExistsDialog = false; convert()" text) Continue
                    v-btn(@click="fileExistsDialog = false" text) Cancel
        v-card(flat)
            v-card-title CSV Converter
                v-spacer
                v-btn(icon @click="infoDialog = true")
                    v-icon mdi-information

            v-divider
            v-card-text.black--text Converts a CSV or TSV file from one delimiter to another.
            v-card-text.mt-0
                .grid
                    .section
                        v-file-input(v-model="inputFile" label="Choose input file:" prepend-icon="mdi-import" show-size)
                    .section
                        v-select(v-model="inputDelimiter" :items="delimiters" label="Input delimiter")
                    .section
                        v-text-field(v-model="outputName" label="Output file name:" prepend-icon="mdi-export" )
                    .section
                        v-select(v-model="outputDelimiter" :items="delimiters" label="Output delimiter")

                v-switch(v-model="trimQuotes" label="- Trim out double quotes? (\")" )

                v-progress-linear.mt-2.mb-6(v-model="progress")
                .center
                    v-btn(@click="check" :disabled="!inputPath") Convert
</template>

<script lang="ts">
import {Vue, Component, Watch} from 'vue-property-decorator'
import * as fs from "fs"
const parse = require('csv-parse/lib/sync')
const stringify = require('csv-stringify/lib/sync')

@Component({
    components: {}
})
export default class App extends Vue {

    fileExistsDialog: boolean = false
    showSnackBar: boolean = false
    errorSnackBar: boolean = false
    infoDialog: boolean = false

    inputFile: any = null
    inputPath: string = ""
    outputName: string = ""
    outputPath: string = ""
    progress: number = 0
    inputDelimiter: string = ";"
    outputDelimiter: string = ","
    trimQuotes: boolean = false

    delimiters: any[] = [
        {text: "Comma ( , )", value: ","},
        {text: "Semicolon ( ; )", value: ";"},
        {text: "Tab ( \\t )", value: "\t"},
        {text: "Pipe ( | )", value: "|"},
    ]

    @Watch("inputFile")
    onInputChanged(val: File) {
        this.progress = 0
        const sep = val.path.includes("\\")? "\\": "/"
        let paths = val.path.split(sep)
        const filename = paths[paths.length - 1]
        this.outputName = filename.substr(0, filename.indexOf(".")) + "_converted" + filename.substr(filename.indexOf("."))
        paths.pop()
        this.inputPath = paths.join(sep) + sep
    }

    check() {
        this.outputPath = this.inputPath + this.outputName
        if (fs.existsSync(this.outputPath)) {
            this.fileExistsDialog = true
        } else {
            this.convert()
        }
    }

    convert() {
        try {
            this.progress = 10
            let content = fs.readFileSync(this.inputFile.path, {encoding: "utf-8"})
            this.progress = 20
            if (this.trimQuotes) content = content.replace(/"/g, "")
            this.progress = 30
            const data = parse(content, {
                columns: true,
                trim: true,
                skip_empty_lines: true,
                delimiter: this.inputDelimiter
            })
            this.progress = 60
            const columns = Object.keys(data[0])
            this.progress = 70
            const converted_data = stringify(data, {
                header: true,
                columns: columns,
                delimiter: this.outputDelimiter
            })
            this.progress = 90
            fs.writeFileSync(this.outputPath, converted_data, {encoding: "utf-8"})
            this.progress = 100
            this.showSnackBar = true
            setTimeout(() => {this.progress = 0}, 2000)
        } catch (e) {
            this.errorSnackBar = true
            this.progress = 0
        }
    }
}
</script>

<style lang="scss">
html {
    overflow-y: hidden !important;
}

.center {
    display: grid;
    place-items: center;
}

.grid {
    display: grid;
    grid-template-columns: auto  150px;
    grid-gap: 0 20px;
}
</style>
