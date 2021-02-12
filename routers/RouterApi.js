const { Router } = require('express');
const { ModelApi } = require('../model/model.api/ModelApi');

module.exports = () => {

    const router = Router();    
    const modelApi = new ModelApi();
    const BASE_URI = 'api';

    router.get(`/${BASE_URI}($|/$)`, function(req, res) {            
        res.send(`Url: ${req.url} API Home page`);        
    });

    router.get(`/${BASE_URI}/:method`, function(req, res) {        
        const requestMethod = req.params.method;
        const requestParams = {...req.query};     

        try {
            modelApi.init(requestParams);
        } catch(err) {
            res.status(406).send(`API request error;<br> URI:${req.url};<br> ERR: ${err.message};`);
            console.log(err);
            return;
        }        

        modelApi.serveRequest(requestMethod, requestParams).then(result => {
            res.send(result);
        }).catch(err => {
            res.status(406).send(`API request error;<br> URI:${req.url};<br> ERR: ${err.message};`);
            console.log('Error:', err.message);
        });                               
        
    });

    return router;
}
