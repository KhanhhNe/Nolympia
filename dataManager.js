const { writeFile } = require('fs');

const option = process.argv[2]; 

function copyDataFromFile (sourceFile) {
    console.log(`Assigning data from ${sourceFile}`)
    
    writeFile('./data/data.json', JSON.stringify(require(sourceFile)), function (err) {
        if (err) throw err

        console.log('Done!')
    })
}


switch (option) {
    case 'default':
        copyDataFromFile('./data/raw_data.json')
        break

    case 'debug':
        copyDataFromFile('./data/debug_data.json')
        break

    case undefined:
        console.log('Required parameter: `fileName` (relative path).')

    default:
        copyDataFromFile(option)
}