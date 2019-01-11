import { apiStatus } from '../../../lib/util'
import { Router } from 'express'
import elasticsearch from 'elasticsearch';

let client
let listedProducts = []
let updated

async function getCategories (indexName, level, parentId = false) {
  let matches = [
    {match: {is_active: true}},
    {match: {include_in_menu: true}},
    {match: {level: level}}
  ]
  if (parentId) {
    matches.push({match: {parent_id: parentId}})
  }

  return client.search({
    index: indexName,
    type: 'category',
    size: 10000,
    sort: 'id',
    body: {query: {bool: {must: matches}}}
  }).then(result => {
		let categories = []
		const hits = result.hits.hits
		for (const hit of hits) {
			const category = hit._source
			categories.push({
				id: category.id,
				// slug: `${slugify(category.name)}-${category.id}`
				name: category.name
			})
		}
		// console.log(categories)
		return categories
	})
}

async function getProducts (indexName, categoryId) {
	return client.search({
		index: indexName,
		type: 'product',
		size: 10000,
		sort: 'sku',
		body: {query: {bool: {must:[
			{match: {status: 1}},
			{match: {visibility: 4}},
			{term: {category_ids: categoryId}}
		]}}}
	}).then(result => {
		let products = []
		const hits = result.hits.hits
		for (const hit of hits) {
			const product = hit._source
			// products are in multiple categories, so check if already included. Only include once.
			if (!listedProducts.includes(product.id)) {
				listedProducts.push(product.id)
				products.push({
					id: product.id,
					sku: product.sku,
					// slug: `${slugify(product.name)}-${product.id}`,
					name: product.name,
					image: (product.image) ? product.image : ''
				})
			}
		}
		return products
	})
}

async function getSiteMapData(indexName) {
	let categories_l2 = []
	let categoryCalls_l3 = []
	let categories_l3 = []
	let categoryCalls_l4 = []
	let categories_l4 = []
	let productCalls = []
	let products = []
	let pages = [
		'',
		'departments',
		'about-us',
		'cleansui-howtoinstall',
		'corporate-profile',
		'faq',
		'members-benefit',
		'new-to-wonect',
		'newrelease-10',
		'point',
		'privacy-policy-cookie-restriction-mode',
		'purchases150',
		'returns-replacement',
		'rewardpoints-welcome',
		'shipping-delivery',
		'staff-pick',
		'tokutei',
		'user-agreement',
		'view-at-work',
		'member-ranking',
		'brand-top-sp',
		'on-sale-now',
		'time-sale',
		'limited-quantity-sale'
	]

	try {
		// first get level 2 categories (level 1 is store root)
		categories_l2 = await getCategories(indexName, 2)

		// note: Promise.all returns an arry of arrays
		// use this pattern to flatten arry of arrays into one array: [].concat.apply([], my_array)

		// get level 3 categories for each category in level 2
		for (const l2cat of categories_l2) {
			// create an array of async Promises
			categoryCalls_l3.push(getCategories(indexName, 3, l2cat.id))
		}
		// wait for all Promises and flatten into one array
		categories_l3 = [].concat.apply([], await Promise.all(categoryCalls_l3))

		// same technique to get level 4 categories for all level 3s
		for (const l3cat of categories_l3) {
			categoryCalls_l4.push(getCategories(indexName, 4, l3cat.id))
		}
		categories_l4 = [].concat.apply([], await Promise.all(categoryCalls_l4))

		// finally get products in all level 4 categories, flattened into one array
		for (const l4cat of categories_l4) {
			productCalls.push(getProducts(indexName, l4cat.id))
		}
		products = [].concat.apply([], await Promise.all(productCalls))

		return {categories: [...categories_l2, ...categories_l3,  ...categories_l4], products: products, pages: pages}
	} catch(err) {
		return {err: err}
	}
}

function slugify (text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
}

function getSitemapTag (uri, image_uri = false) {
  return `<url><loc>https://wonect.com${uri}</loc>${image_uri ? `<image:image><image:loc>https://api.wonect.com${image_uri}</image:loc></image:image>` : ''}<lastmod>${updated}</lastmod><changefreq>weekly</changefreq></url>`
}

module.exports = ({ config, db }) => {
	let sitemapsApi = Router();

	sitemapsApi.get('/sitemap/:store', (req, res) => {
		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
		const esConfig = {
		  host: {
		    host: config.elasticsearch.host,
		    port: config.elasticsearch.port
		  },
		  log: 'error',
		  apiVersion: '5.5',
		  requestTimeout: 1000 * 60 * 60,
		  keepAlive: false
		}
		if (config.elasticsearch.user) {
		  esConfig.httpAuth = config.elasticsearch.user + ':' + config.elasticsearch.password
		}
		// set global vars (note: globals are kept alive between requests, so must be reset)
		client = new elasticsearch.Client(esConfig)
		listedProducts = []
		updated = new Date().toISOString()
		// get all data
		getSiteMapData(`vue_storefront_catalog${req.params.store === 'sg' ? '' : `_${req.params.store}`}`).then(response => {
			if (response.err) {
				 apiStatus(res, response.err, 500)
			} else {
				try {
					for (const page of response.pages) {
						xml += '\n' + getSitemapTag(`/${req.params.store}/${page}`)
					}
					for (const category of response.categories) {
						xml += '\n' + getSitemapTag(`/${req.params.store}/c/${slugify(category.name)}-${category.id}`)
					}
					for (const product of response.products) {
						xml += '\n' + getSitemapTag(`/${req.params.store}/p/${decodeURIComponent(product.sku)}/${slugify(product.name)}-${product.id}`, (product.image) ? `/img/600/744/resize${product.image}` : false)
					}
					xml += '\n</urlset>'
					apiStatus(res, xml, 200)
				} catch(err) {
					apiStatus(res, err, 500)
				}
			}
		})
	})
	return sitemapsApi
}
