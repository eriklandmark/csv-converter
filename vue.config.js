const {defineConfig} = require('@vue/cli-service')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = defineConfig({
    transpileDependencies: [
        'vuetify'
    ],
    pluginOptions: {
        electronBuilder: {
            outputDir: 'electron',
            nodeIntegration: true,
            externals: [],
            customFileProtocol: './'
        }
    },
    configureWebpack: {
        plugins: [new NodePolyfillPlugin()],
        optimization: {
            splitChunks: {
                chunks: "all",
            },
        },
    },
})
