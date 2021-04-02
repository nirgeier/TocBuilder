/**
 * This file contain the default configuration
 */
let
    EOL = require('os').EOL,
    config = {

        // The project root directory
        rootDir: process.argv[2] || __dirname,
        // The Labs base folder
        labsFolder: 'Labs',
        // The main TOC template
        tocTemplate: '',
        // The Main Navigation template
        mainTOCTemplate: `${__dirname}/../templates/navigation.ejs`,
        // The in page Navigation template
        inPageTOCTemplate: `${__dirname}/../templates/inPageNavigation.ejs`,
        // TOC start pattern
        TOCStartPattern: `<!-- Labs list start -->`,
        // TOC end pattern
        TOCEndPattern: `<!-- Labs list ends -->`,
        // TOC start pattern
        footerStartPattern: `<!-- navigation start -->`,
        // TOC end pattern
        footerEndPattern: `<!-- navigation end -->`,
        // TOC start pattern
        innerTOCStart: `<!-- inPage TOC start -->`,
        // TOC end pattern
        innerTOCEnd: `<!-- inPage TOC end -->`,
        // The TOC pattern
        innerTOCPattern: /(#{2,4})(.*)([0-9]{1,3}[.].*)/gui,
        // Extract the step indicator
        stepPattern: /(\d{2}[.])+/gui,
        // Store the local data,
        getLabsPath: function () {
            return `${config.rootDir}/${config.labsFolder}`;
        }
    }

module.exports = config;

console.log(process.argv);