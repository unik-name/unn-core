const path = require('path');
const fs = require('fs-extra');

console.log(__dirname)

const WORKDIR = `${__dirname}/../..`;
const ARK_NAME = "@arkecosystem/";
const UNS_NAME = "@uns/";
const ARK = " ARK ";
const UNS = " UNS ";
const ARK_COMMAND = "ark";
const UNS_COMMAND = "uns";

// List of dependencies to not update
const DEPENDENCY_TO_EXCLUDE = [
    ARK_NAME+"utils"
]

const NEW_CONTRIBUTORS = [
    "Guillaume Nicolas <guillaume@spacelephant.org>"
]

function renameProperty(object,from,to){
    if( object && object[from] ){
        object[to] = object[from];
        delete object[from];
    }
}

function save(path,object){
    fs.writeFileSync(path, JSON.stringify(object, null, 4));
}

(async () => {

    let packagesPath = path.join(WORKDIR,"packages");
    let packages = await fs.readdir(packagesPath);

    for( package of packages ){

        console.log(` > ${package}`);

        let jsonFilePath = path.join(packagesPath,package,"package.json");
        let json = require(jsonFilePath);

        let { name, description,contributors,dependencies, bin, scripts, oclif } = json;
        
        // NAME
        json.name = name.replace(ARK_NAME,UNS_NAME)
        
        // DESCRIPTION
        json.description = description.replace(ARK,UNS);
        
        // DEPENDENCIES
        if( dependencies ){
            json.dependencies = Object.entries(dependencies).reduce((res,[key,value])=>{
                let newKey = key;
                if( !DEPENDENCY_TO_EXCLUDE.includes(newKey) ){
                    newKey = key.replace(ARK_NAME,UNS_NAME)
                }
                res[newKey] = value;
                return res;
            },{})
        }

        // CONTRIBUTORS
        if( contributors ){
            json.contributors = contributors.concat(
                NEW_CONTRIBUTORS.filter(
                    c=>!contributors.includes(c)
                )
            )
        }
        
        // BIN
        renameProperty(bin,ARK_COMMAND,UNS_COMMAND)

        // SCRIPTS NAMES
        renameProperty(scripts,ARK_COMMAND,UNS_COMMAND)

        // SCRIPTS COMMAND
        if( scripts ){
            json.scripts = Object.entries(scripts).reduce((res,[key,value])=>{
                let newValue = value.replace(` yarn ${ARK_COMMAND} `,` yarn ${UNS_COMMAND} `);
                res[key] = newValue;
                return res;
            },{})
        }
        
        // OCLIF 
        if( oclif ){
            oclif.bin = oclif.bin.replace(ARK_COMMAND,UNS_COMMAND);
        }

        // PERSIST
        save(jsonFilePath,json)

    }
})()