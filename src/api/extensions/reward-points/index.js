import { apiStatus } from '../../../lib/util';
import { Router } from 'express';
const Magento2Client = require('magento2-rest-client').Magento2Client
import { multiStoreConfig } from '../../../platform/magento2/util'

module.exports = ({ config, db }) => {

	let rewardsApi = Router();

	rewardsApi.get('/rewards/:userId', (req, res) => {
		const client = Magento2Client(multiStoreConfig(config.magento2.api, req));
		client.addMethods('rewards', function (restClient) {
			let module = {};
			module.getRewards = function () {
				return restClient.get(`/rewards/customer/${req.params.userId}/transactions`);
			}
			return module;
		})
		client.rewards.getRewards().then((result) => {
			apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
		}).catch(err => {
			apiStatus(res, err, 500);
		})
	})

	rewardsApi.post('/rewards/mine/apply', (req, res) => {
		const client = Magento2Client(multiStoreConfig(config.magento2.api, req));
		client.addMethods('rewards', function (restClient) {
			let module = {};
			module.applyRewards = function () {
				return restClient.post(`/rewards/mine/apply`, {pointAmount: req.query.amount}, req.query.token);
			}
			return module;
		})
		client.rewards.applyRewards().then((result) => {
			apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
		}).catch(err => {
			apiStatus(res, err, 500);
		})
	})

	return rewardsApi
}
