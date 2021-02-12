const { RequestsAllegroRestApiClient } = require('../../core/RequestsAllegroRestApiClient/RequestsAllegroRestApiClient');

class ModelApi {
    allegroClient = null;    

    init(allegroClientConfig) {
        this.allegroClient = new RequestsAllegroRestApiClient(allegroClientConfig);
    }

    isRequestMethodSupported(requestMethod='') {
        if(!this.allegroClient) {
            const msg = 'ModelApi::serveRequest Error: allegroClient not initialized. Call ModelApi::init() first';
            throw new Error(msg);
        }        

        if (!requestMethod || 
            requestMethod.startsWith('_') || 
            ! this.allegroClient[requestMethod]
        ) {
            return false;            
        } 

        return true;
    }

    async serveRequest(requestMethod, requestOpts={}) {
        if(!this.allegroClient) {
            const msg = 'ModelApi::serveRequest Error: allegroClient not initialized. Call ModelApi::init() first';
            throw new Error(msg);
        }        

        if (this.isRequestMethodSupported(requestMethod)) {
            return this.allegroClient[requestMethod](requestOpts);
        } else {
            throw new Error(`ModelApi::serveRequest Error: unsupported request method ${requestMethod}`);
        }
    }
}

exports.ModelApi = ModelApi;
