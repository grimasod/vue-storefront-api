import { apiStatus } from '../../../lib/util';
import { Router } from 'express';
const Magento2Client = require('magento2-rest-client').Magento2Client

module.exports = ({ config, db }) => {

	let salesApi = Router();

	salesApi.get('/sales/time-sale-active-ids', (req, res) => {
	    const client = Magento2Client(config.magento2.api);
	    client.addMethods('salesModule', function (restClient) {
                var module = {};
		module.search = function () {
                    return restClient.get('/sales/time-sale-active-ids');
                }
                return module;
	    })
	    console.log(client)
	    client.salesModule.search().then((result) => {
                apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
	    }).catch(err=> {
	        apiStatus(res, err, 500);
	    })				
	}),
	salesApi.get('/sales/time-sale-all-lists/:timezone', (req, res) => {
	    const client = Magento2Client(config.magento2.api);
	    client.addMethods('salesModule', function (restClient) {
                var module = {};
		module.search = function () {
                    if(req.params.timezone === 'init') {
                    	return restClient.get('/sales/time-sale-active-ids');
                    }
                    else {
                        return restClient.get('/sales/time-sale-all-lists/' + req.params.timezone);
                    }
                }
                return module;
	    })
	    console.log(client)
	    client.salesModule.search().then((result) => {
                apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
	    }).catch(err=> {
	        apiStatus(res, err, 500);
	    })				
	}),
	salesApi.get('/sales/on-sale-now-pickup', (req, res) => {
	    const client = Magento2Client(config.magento2.api);
	    client.addMethods('salesModule', function (restClient) {
                var module = {};
		module.search = function () {
                    return restClient.get('/sales/on-sale-now-pickup');
                }
                return module;
	    })
	    console.log(client)
	    client.salesModule.search().then((result) => {
                apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
	    }).catch(err=> {
	        apiStatus(res, err, 500);
	    })				
	}),
	salesApi.get('/sales/on-sale-now-all-lists', (req, res) => {
	    const client = Magento2Client(config.magento2.api);
	    client.addMethods('salesModule', function (restClient) {
                var module = {};
		module.search = function () {
                    return restClient.get('/sales/on-sale-now-all-lists');
                }
                return module;
	    })
	    console.log(client)
	    client.salesModule.search().then((result) => {
                apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
	    }).catch(err=> {
	        apiStatus(res, err, 500);
	    })				
	}),
	salesApi.get('/sales/limited-quantity-sale-lists', (req, res) => {
	    const client = Magento2Client(config.magento2.api);
	    client.addMethods('salesModule', function (restClient) {
                var module = {};
		module.search = function () {
                    return restClient.get('/sales/limited-quantity-sale-lists');
                }
                return module;
	    })
	    console.log(client)
	    client.salesModule.search().then((result) => {
                apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
	    }).catch(err=> {
	        apiStatus(res, err, 500);
	    })				
	})
	return salesApi
}
