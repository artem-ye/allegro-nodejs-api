const { AllegroRestApiClient } = require('./AllegroRestApiClient');

class RequestsAllegroRestApiClient extends AllegroRestApiClient {
    constructor(credentials) {
        RequestsAllegroRestApiClient.validateCredentialsStructure(credentials);
        const {clientId, clientSecret, account, appName} = credentials;
        super(clientId, clientSecret, account, appName);        
    }

    static validateCredentialsStructure(credentials={}) {
        const mandatoryKeys = ['clientId', 'clientSecret', 'account', 'appName'];

        mandatoryKeys.forEach(key => {
            if(!credentials[key]) {
                const msg = `Credentials params validation error. Parameter: '${key}' not provided`;                
                throw new Error(msg);
            }
        });

        return true;
    }

    async getProducts() {
        const OFFERS_URI = '/sale/offers'; 
        const OFFER_DETAILS_PARAM_ID_SKU = '224017';    
        const STEP_LIMIT = 100;    
        const mappedOffers = [];
                
        let totalOffersRequestRes = await this.request(`${OFFERS_URI}?limit=${STEP_LIMIT}`);
        if (totalOffersRequestRes.totalCount === 0) {
            return mappedOffers;
        }
        let offset = 0;
        let step = (totalOffersRequestRes.count < STEP_LIMIT) ? totalOffersRequestRes.count : STEP_LIMIT;    
        
        while (true) {        
            for (let i=0; i<totalOffersRequestRes.count-1; i++) {                
                const {
                    id:offer_id, 
                    sellingMode:offer_sellingMode
                } = totalOffersRequestRes.offers[i];
                
                const offer_price =  (offer_sellingMode && offer_sellingMode.price) ? offer_sellingMode.price.amount : null;
                const offerDetails = await this.request(`${OFFERS_URI}/${offer_id}`);                
                
                const img = (offerDetails.images[0]) ? offerDetails.images[0].url : '';                
                const sku = offerDetails.parameters.reduce(
                    (result, param) => (param.id === OFFER_DETAILS_PARAM_ID_SKU) ? param.values[0] : result
                , '');
    
                mappedOffers.push({
                    id: offer_id,
                    sku,
                    barcode: offerDetails.ean,
                    price: offer_price,
                    img,
                    stock_available: offerDetails.stock.available,
                    publication_status: offerDetails.publication.status,
                    url: `https://allegro.pl/offer/${offer_id}`
                });
            }                
    
            offset += step + 1;                       
            if (offset > totalOffersRequestRes.totalCount-1) {            
                break;
            }
    
            totalOffersRequestRes = await this.request(`${OFFERS_URI}?limit=${step}&offset=${offset}`);
        }
    
        return mappedOffers;   
    }
}

exports.RequestsAllegroRestApiClient = RequestsAllegroRestApiClient;
