

function init( appId, apiKey, index) {
	// Get Algolia App ID from env
	const ALGOLIA_APP_ID = appId;

	// Get Aloglia API Key from env
	const ALGOLIA_API_KEY = apiKey;

	// Get Algolia Index from env
	const ALGOLIA_INDEX = index;

	// Initialize InstantSearch
	const search = instantsearch({
		indexName: ALGOLIA_INDEX,
		searchClient: algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY),
	});

	// Add search box
	search.addWidgets([
		instantsearch.widgets.searchBox({
			container: '#searchbox',
			placeholder: 'Search for Engineers',
		}),
	]);

	// Add hits widget
	search.addWidgets([
		instantsearch.widgets.hits({
			container: '#hits',
			templates: {
				item: `
					<div>
						<h3>{{#helpers.highlight}}{ "attribute": "name" }{{/helpers.highlight}}</h3>
					</div>
				`,
			},
		}),
	]);

	search.start();
};
	
// On Document Ready with Vanilla JS
document.addEventListener('DOMContentLoaded', function() {
	try {
		// Get variables from env.
		const appId = ALGOLIA_APP_ID;
		const apiKey = ALGOLIA_API_KEY;
		const index = ALGOLIA_INDEX;

		// Initialize InstantSearch
		init(appId, apiKey, index);
	} catch (error) {
		console.error('Error:', error);
	}
});