//
// This script will generate the content and the navigation 
//
const
    os = require('os'),
    ejs = require('ejs'),
    glob = require('glob'),
    path = require('path'),
    fs = require('fs-extra');

let
    // load the default configuration
    config = require('./config'),
    // Load the navigation template(s)
    mainTOCTemplate = fs.readFileSync(config.mainTOCTemplate, "UTF-8"),
    inPageTOCTemplate = fs.readFileSync(config.inPageTOCTemplate, "UTF-8"),
    // Store the local data 
    data = {
        TOC: [],
        Labs: [],
        files: {}
    };

// Search for all the folders with README.md inside
function listLabs() {
    console.log(`listLabs in: ${config.getLabsPath()}`);

    return new Promise((resolve, reject) => {
        // List the content of the labs folder with README.md inside
        glob(`*`,
            {
                cwd: config.getLabsPath(),
                ignore: ['**/node_modules/**']
                //realpath: true
            },
            (err, labs) => {
                console.log(`Labs found: `, labs);
                data.labs = labs;
                resolve(labs);
            });
    });
}

/**
 * Add the TOC to the main README under labs section
 */
function addTOC() {
    console.log(`Adding TOC`);
    return new Promise((resolve, reject) => {

        let
            // store the TOC content
            content = [],

            // Read the main README file
            readMe = fs.readFileSync(`${config.rootDir}/README.md`, "UTF-8"),

            // Get the start index of the main TOC
            startTOC = readMe.indexOf(config.TOCStartPattern) + config.TOCStartPattern.length,
            // Get the end index of the main TOC
            endTOC = readMe.indexOf(config.TOCEndPattern, startTOC);

        // Replace the current TOC
        content.push(readMe.substring(0, startTOC));
        content.push(data.Labs.join(`  ${os.EOL}`));
        content.push(`${os.EOL}---`);
        content.push(data.TOC.join(os.EOL));
        content.push(readMe.substring(endTOC));

        console.log(`Updating main README file`);

        // Write the new content to the file
        fs.writeFileSync(`${config.rootDir}/README.md`, content.join(os.EOL));

        resolve();
    });
}


/**
 * Add the navigation to the Labs
 */
function buildNavigation() {
    console.log(`Building labs navigation from template [${config.mainTOCTemplate}]`);

    return new Promise((resolve, reject) => {

        // Find all the README files
        // List the content of the labs folder
        glob(`**/*.md`,
            {
                cwd: config.getLabsPath(),
                ignore: ['**/node_modules/**']
            },
            (err, files) => {
                for (let index = 0; index < files.length; index++) {
                    // Loop over the files
                    let file = files[index];

                    // Build the content
                    addMainTOC(file)
                        .then(addInnerTOC(file));

                    // Check for completion
                    (index == files.length - 1) ? resolve() : '';
                }

            });
    });
}

/**
 * Replace the tokens placeholder with the TOC content
 */
function replaceTokens(data) {

    return new Promise((resolve, reject) => {

        let
            // Read the main README file
            content = fs.readFileSync(`${config.getLabsPath()}/${data.file}`, "UTF-8"),
            // Build the navigation placeholders
            replacement = new RegExp(`${data.patternStart}[^]*${data.patternEnd}`, 'i');

        if (content.match(data.patternStart)) {
            // Replace old footer 
            content = content.replace(replacement, `${data.template}`).trim();
        }

        // Write the new content to the file
        fs.writeFileSync(`${config.getLabsPath()}/${data.file}`, content);

        resolve();
    });
}

/**
 * Generate the in page navigation for the sections
 */
function addMainTOC(file) {

    // Get the index of the navigation 
    console.log(`------------------------ ${file} ----------------------------------`);
    console.log(`addMainTOC`);

    return new Promise((resolve, reject) => {

        let
            // Extract the folder name
            folderName = path.dirname(file),
            // Get current lab index
            labIndex = data.labs.indexOf(file),
            // Get previous labs
            prev = labIndex > 0 ? data.labs[labIndex - 1] : undefined,
            // Get the previous depth
            prevDepth = prev ? prev.split(path.sep).length - 1 : 0,
            // Get Next labs
            next = labIndex < data.labs.length ? data.labs[labIndex + 1] : undefined,
            // The level of the folder under the main root
            nextDepth = next ? next.split(path.sep).length - 1 : 0,
            // Generate the navigation text
            template = ejs.render(mainTOCTemplate, {
                prev, next
            });

        //Add Main TOC
        replaceTokens({
            file,
            template,
            patternStart: config.footerStartPattern,
            patternEnd: config.footerEndPattern
        }).then(resolve);
    })

}

/**
 * Generate the in page navigation for the sections
 */
function addInnerTOC(file) {
    console.log('addInnerTOC');

    return new Promise((resolve, reject) => {

        console.log('----------', `${config.getLabsPath()}/${file}`)
        let
            // The toc content
            TOC = '',
            // Read the markdown file
            markdown = fs.readFileSync(`${config.getLabsPath()}/${file}`, "UTF-8"),
            // Search for the TOC pattern
            matches = [...markdown.matchAll(config.innerTOCPattern)];

        // Set up the main Lab link
        data.Labs.push(`:green_book: [${path.dirname(file)}](${config.labsFolder}/${file})`);
        data.TOC.push(`${os.EOL}:green_book: [${path.dirname(file)}](${config.labsFolder}/${file})`);

        for (let i = 0; i < matches.length; i++) {
            let
                title = matches[i][0].replaceAll('#', '').trim(),
                sectionLink = matches[i][0].trim(),
                // The indentation level for the sub sections
                indentationLevel = sectionLink.match(config.stepPattern)[0].split('.').length - 2,
                // Build the array of required indentation level
                spacer = [...new Array(indentationLevel)].map(() => `  `).join('');

            console.log(`Adding: ${spacer} - ${title}`);

            // We need to do the following:
            //  1.  Remove markdown headers
            sectionLink = sectionLink.replaceAll('#', '')
                //  2.  Trim the string
                .replaceAll('#', '').trim()
                //  3.  Replace spaces with '-'-
                .replaceAll(' ', '-')
                //  4.  Check to see how may indentation we need
                //  5.  Remove all non-characters symbols
                .replaceAll(/([^a-zA-Z|0-9|-])/g, '');
            //TOC += `[${match}](#${match.replaceAll(/[.]/g, '')})  ${os.EOL}`;
            TOC += `${spacer} - [${title}](#${sectionLink})${os.EOL}`;
            data.TOC.push(`${spacer}- [${title}](${config.labsFolder}/${file}#${sectionLink})`);
        }

        // Add inner TOC to page
        replaceTokens({
            file,
            template: ejs.render(inPageTOCTemplate, { TOC }),
            patternStart: config.innerTOCStart,
            patternEnd: config.innerTOCEnd
        })

    })

}

/**
 * Build the labs list
 */
function buildLabsList(labs) {

    return new Promise((resolve, reject) => {
        // Split the labs into object
        for (let index in labs) {
            let
                currentPath = data.files,

                // Get the current item
                item = labs[index],

                // Break the item to paths
                paths = item.split(path.sep);

            while (paths.length > 0) {
                // Get the current item
                let path = paths.shift();

                // Verify that we have the desired entry
                if (!currentPath[path]) {
                    currentPath[path] = {};
                }
                currentPath = currentPath[path];

            }
            // Loop over the path and build the structure

        }
        resolve(labs);
    })
}

/**
 * Build the TOC and inner page navigation
 */
function buildTOC(config) {

    listLabs()
        //.then(buildLabsList)
        .then(buildNavigation)
    // .then(addTOC)
    // .then(() => {
    //     console.log(data.TOC)
    // });

}

buildTOC({})