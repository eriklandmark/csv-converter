<template lang="pug">
    v-app
        v-snackbar(v-model="showSnackBar" color="success" top :timeout="4000" width="50" ) Done!
            template(v-slot:action='{ attrs }')
                v-btn(icon v-bind='attrs', @click='showSnackBar = false')
                    v-icon mdi-close

        v-snackbar(v-model="errorSnackBar" color="error" top :timeout="3000" width="50" ) {{errorMsg}}
            template(v-slot:action='{ attrs }')
                v-btn(icon v-bind='attrs', @click='errorSnackBar = false')
                    v-icon mdi-close

        v-dialog(v-model="fileExistsDialog")
            v-card
                v-card-title.red--text File already exists!
                v-card-text It already exists a file at that path. Do you want to continue?
                v-card-actions
                    v-spacer
                    v-btn(@click="fileExistsDialog = false; convert()" text) Continue
                    v-btn(@click="fileExistsDialog = false" text) Cancel
        v-card(flat height="100%" )
            v-card-title CSV Converter
                v-spacer
                v-dialog(v-model="infoDialog" width='300')
                    template(v-slot:activator='{}')
                        v-tooltip(bottom)
                            template(v-slot:activator="{ on, attrs }")
                                v-btn(v-on="on" v-bind="attr" icon @click="infoDialog = true")
                                    v-icon mdi-information
                            span Info
                    v-card
                        v-card-title Information
                        v-card-text Version: 1.2.1
                            br
                            | Author: Erik Landmark
                        v-card-actions
                            v-spacer
                            v-btn(text @click="infoDialog = false") close


            v-divider
            v-card-text.white--text Converts a CSV or TSV file from one delimiter to another.
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

                v-switch(v-model="trimQuotesOnParse" label="- Trim out double quotes on parse? (\")" hide-details )
                v-switch(v-model="addQuotes" label="- Add double quotes to output file? (\")" )

                v-progress-linear.mt-2.mb-6(v-model="progress")
                .center
                    v-btn(@click="check" :disabled="!inputPath") Convert
</template>

<script lang="ts">
import {Vue, Component, Watch} from 'vue-property-decorator'
import * as fs from "fs"
import CSVParser from "./csv_parser"

@Component({
    components: {}
})
export default class App extends Vue {

    fileExistsDialog: boolean = false
    showSnackBar: boolean = false
    errorSnackBar: boolean = false
    infoDialog: boolean = false

    errorMsg: string = ""

    inputFile: any = null
    inputPath: string = ""
    outputName: string = ""
    outputPath: string = ""
    progress: number = 0
    inputDelimiter: string = ";"
    outputDelimiter: string = ","
    trimQuotesOnParse: boolean = true
    addQuotes: boolean = true

    csvParser = new CSVParser()

    delimiters: any[] = [
        {text: "Comma ( , )", value: ","},
        {text: "Semicolon ( ; )", value: ";"},
        {text: "Tab ( \\t )", value: "\t"},
        {text: "Pipe ( | )", value: "|"},
    ]

    @Watch("inputFile")
    onInputChanged(val: File) {
        this.progress = 0
        const sep = val.path.includes("\\") ? "\\" : "/"
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
            this.progress = 30
            const data = this.csvParser.parse(content, {
                do_checks: true,
                delimiter: this.inputDelimiter,
                delete_quotes: this.trimQuotesOnParse,
                to_columns: true,
                trim: true
            })

            this.progress = 50

            let converted_data = this.csvParser.stringify(data, {
                is_columns: true,
                delimiter: this.outputDelimiter,
                add_quotes: this.addQuotes
            })

            this.progress = 70
            fs.writeFileSync(this.outputPath, converted_data, {encoding: "utf-8"})
            this.progress = 100
            this.showSnackBar = true
            setTimeout(() => {
                this.progress = 0
            }, 4000)
        } catch (e) {
            this.errorMsg = e.toString()
            this.errorSnackBar = true
            this.progress = 0
            console.error(e)
        }
    }
}
</script>

<style lang="scss">
html {
    overflow-y: hidden !important;
    height: 100vh;
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
