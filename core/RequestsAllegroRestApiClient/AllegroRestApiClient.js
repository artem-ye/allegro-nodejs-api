const { request } = require('axios');
const { setTimeoutAsync } = require('../functions');
const qs = require('qs');
const { UseTokenStorage } = require('./TokenStorage');

class AllegroRestApiClient {
    baseUrl = 'https://allegro.pl';
    apiUrl = 'https://api.allegro.pl';
    isLogEnabled = true;

    constructor (clientId, clientSecret, account, appName) {
        this.credentials = {
            clientId, 
            clientSecret, 
            appName,
            account: account || 'default',
            oauthUser: Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        }

        if (!clientId) {
            const msg = 'AllegroRestApiClient::constructor: clientId not provided';
            throw new Error(msg);
        }

        try {
            this.tokenStorage = UseTokenStorage(clientId);
        } catch(err) {
            const msg = `AllegroRestApiClient::constructor/UseTokenStorage: ${err.message}`;
            throw new Error(msg);
        }       
    }       

    async registerApiCredentials() {                                                           
        const {interval, device_code, verification_uri_complete} = await this._bindDevice();                

        this.log(`You must visit: ${verification_uri_complete} to confirm api registration`);

        const tokens = await this._authorizeDevice(device_code, interval);                                
        this._setTokens(tokens);
        return tokens;
    }

    async request(endpoint, opts={}) {
        if (this._isTokensExpired()) {  
            // console.log('Updating tokens...');
            await this._refreshToken().catch(err => {
                const msg = `AllegroRestApiClient::request/_refreshToken: ${err.message || err}`;                                 
                throw new Error(msg);
            });           
        }                   

        const tokens = this._getTokens();      
        const requestOptions = {
            url: `${this.apiUrl}${endpoint}`,
            method: 'GET',
            ...opts,
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              Accept: 'application/vnd.allegro.public.v1+json',
              ...opts.headers,
            },
        };

        const res = await request(requestOptions).catch(err => {
            const msg = `AllegroRestApiClient::request: ${err.response.statusText} ${err.response.status} ${err.response.data}`;            
            throw new Error(err);
        });
        
        return Promise.resolve(res.data);                                
    }    
   
    async _bindDevice() {
        const authorizeOptions = {
            method: 'POST',
            url: this.baseUrl + "/auth/oauth/device",
            headers: {                                
                'Authorization': `Basic ${this.credentials.oauthUser}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },           
            params: {
                client_id: this.credentials.clientId
            },
        };

        return new Promise(async (resolve, reject) => {                          
            this.log('Binding device...')
            const response = await request(authorizeOptions);

            if (response.status !== 200 || !response.data.device_code) {
                msg  = `Device binding failed. STATUS CODE: ${response.status} 
                RESPONSE TEXT: ${response.statusText} DATA: ${response.data}`;
                reject(new Error(msg));
            } else {                    
                resolve(response.data);
            }                                            
        });       
    }

    async _authorizeDevice(device_code, delay) { 
        const LOGON_TIMEOUT_SEC = 60;
        const RETRY_COUNT = Math.ceil(LOGON_TIMEOUT_SEC / delay) || 1;
        const authorizeOptions = {
            method: 'POST',
            url:
              `${this.baseUrl}/auth/oauth/token?` +
              `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code&` +
              `device_code=${device_code}`,
            headers: {
              'Authorization': `Basic ${this.credentials.oauthUser}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
        }        
        this.log(`Authorizing device ${device_code} ...`);         
        let response = null;

        for (let i=0; i<RETRY_COUNT; i++) {                        

            try {                
                response = await request(authorizeOptions);
            } catch(err) {
                response = err.response;
                const msg = `STATUS: ${response.status}; CODE: ${response.statusText} DATA: ${JSON.stringify(response.data)}`;   
                console.log(msg);

                if (response.data.error === 'invalid_request') {                    
                    break;
                }
            }

            if (response.status == 200) {
                this.log('Device authorized');
                return Promise.resolve(response.data);
            } else {
                await setTimeoutAsync(delay*1000);
            }            
        }                

        return Promise.reject(new Error(`Device authorization error: STATUS: ${response.status};` +
            ` CODE: ${response.statusText || ''}`+
            ` DATA: ${JSON.stringify(response.data || {})}`)
        );        
    }

    async _refreshToken() {
        const token = this._getTokens();
        const authorizeOptions = {
            method: 'POST',
            url:
                `${this.baseUrl}/auth/oauth/token?` +
                `grant_type=refresh_token&` +
                `refresh_token=${token.refresh_token}&` +
                `redirect_uri=`,
            headers: {
              'Authorization': `Basic ${this.credentials.oauthUser}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
        };                

        let result;
        try {
            result = await request(authorizeOptions);                    
        } catch(err) {            
            const msg = `Refresh token error: ${err.message} ${JSON.stringify(err.response.data)}`;              
            return Promise.reject(new Error(msg));
        }          
        
        try {
            await this._setTokens(result.data);
        } catch(err) {
            return Promise.reject(err);
        }            
        
        return Promise.resolve();
    }

    _setTokens(tokens) {       
        if (tokens.expires_in) {
            tokens.expires_in_date = Date.now() + tokens.expires_in * 1000;
        }

        return this.tokenStorage.setToken(tokens);       
    }

    _isTokensExpired() {
        const tokens = this._getTokens();        

        if (!tokens.expires_in_date) {            
            return true;
        }         

        return (Date.now() >= (tokens.expires_in_date));
    }

    _getTokens() {
        return this.tokenStorage.getToken();
    }

    log(msg) {
        if (this.isLogEnabled) {
            console.log('AllegroRestApiClient', msg);
        }
    }
}

exports.AllegroRestApiClient = AllegroRestApiClient; 