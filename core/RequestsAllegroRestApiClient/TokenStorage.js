const fs = require('fs');
const { join } = require('path');

class TokenStorage {
    token = {};

    constructor(account, basePath) {
        this.account = account;
        this.path = join(basePath, account);

        if (!account) {
            this.throwError('constructor', 'Account not provided');
        }

        // Base dir 
        if(! fs.existsSync(basePath)) {
            try {
                fs.mkdirSync(basePath);
            } catch(err) {
                this.throwError('constructor', `Unable to create dir ${basePath}: ${err.message}`);
            }
        } 

        // Token file
        if (! fs.existsSync(this.path)) {            
            this.setToken('');
        } else {
            const token = fs.readFileSync(this.path);

            if (token.toString().trim()) {
                try {
                    this.token = JSON.parse(token);
                } catch(e) {
                    this.throwError('constructor', `Unable to parse token file ${this.path}. Error: ${e.message}`);
                }
            } 
        }
    }

    setToken(data) {
        try {              
            let json =  JSON.stringify(data);            
            fs.writeFileSync(this.path, json);
            this.token = data;
        } catch(err) {
            this.throwError('setToken', `Unable to wite file '${this.path}': ${err.message}`);
        }
    }

    getToken() {
        return this.token;
    }

    throwError(method, msg) {
        throw new Error(`TokenStorage::${method}: ${msg}`)
    }
}

function UseTokenStorage(account, basePath='/var/db/allegro') {
    try {
        return new TokenStorage(account, basePath);
    } catch(err) {
        throw new Error(`TokenStorage initialization Error: ${err.message}`);
    }       
}

exports.UseTokenStorage = UseTokenStorage;