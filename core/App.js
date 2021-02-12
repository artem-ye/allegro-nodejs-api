const express = require('express');
const useApiRouter = require('../routers/RouterApi');

class App {    
    constructor({port = 8000}) {
        this.expressConfig = {
            port
        }                   
    }

    async start() {       
        const app = express();

        try {
            app.use(useApiRouter());       
        } catch(e) {
            const msg = `Unable to initialize RouterApi: ${e.message}`;
            throw new Error(e);
        }

        return app.listen(this.expressConfig.port, () => {
            console.log('Server started')
        });
    }    
}

exports.App = App;
