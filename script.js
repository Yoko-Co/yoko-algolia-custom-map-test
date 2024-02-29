

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

	// Add geoSearch connector
	const { connectGeoSearch } = instantsearch.connectors;

	// Create the render function
	let map = null;
	let markers = [];
	let isUserInteraction = true;

	const renderGeoSearch = (renderOptions, isFirstRendering) => {
		const {
			items,
			currentRefinement,
			refine,
			clearMapRefinement,
			widgetParams,
		} = renderOptions;

		const {
			initialZoom,
			initialPosition,
			container,
		} = widgetParams;

		if (isFirstRendering) {
			const element = document.getElementById('map');
			const button = document.createElement('button');
			button.textContent = 'Clear the map refinement';

			map = L.map(element);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
			}).addTo(map);

			map.on('moveend', () => {
				if (isUserInteraction) {
					const ne = map.getBounds().getNorthEast();
					const sw = map.getBounds().getSouthWest();

					refine({
						northEast: { lat: ne.lat, lng: ne.lng },
						southWest: { lat: sw.lat, lng: sw.lng },
					});
				}
			});

			button.addEventListener('click', () => {
				clearMapRefinement();
			});

			container.appendChild(button);
		}

		container.querySelector('button').hidden = !currentRefinement;

		markers.forEach(marker => marker.remove());

		markers = items.map(({ _geoloc }) =>
			L.marker([_geoloc.lat, _geoloc.lng]).addTo(map)
		);

		isUserInteraction = false;
		if (!currentRefinement && markers.length) {
			map.fitBounds(L.featureGroup(markers).getBounds(), {
				animate: false,
			});
		} else if (!currentRefinement) {
			map.setView(initialPosition, initialZoom, {
				animate: false,
			});
		}
		isUserInteraction = true;
	};

	// 2. Create the custom widget
	const customGeoSearch = connectGeoSearch(
		renderGeoSearch
	);

	// 3. Instantiate
	search.addWidgets([
		customGeoSearch({
			// instance params
			items: [],
			initialPosition: {
				lat: 13.493493107850682,
    		lng: -89.38474698770433
			},
			initialZoom: 13,
			container: document.getElementById('map')
		})
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