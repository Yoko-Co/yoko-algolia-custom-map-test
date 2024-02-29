

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
					<h3 class="hit-name">{{#helpers.highlight}}{ "attribute": "name" }{{/helpers.highlight}}</h3>
					<p class="hit-role">{{#helpers.highlight}}{ "attribute": "role" }{{/helpers.highlight}}</p>
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
			position,
			currentRefinement,
			refine,
			sendEvent,
			clearMapRefinement,
			isRefinedWithMap,
			toggleRefineOnMapMove,
			isRefineOnMapMove,
			setMapMoveSinceLastRefine,
			hasMapMoveSinceLastRefine,
			widgetParams
		} = renderOptions;

		const {
			container,
  		googleReference,
  		initialZoom,
  		initialPosition,
  		mapOptions,
  		builtInMarker,
			customHTMLMarker,
  		enableRefine,
  		enableClearMapRefinement,
  		enableRefineControl,
  		enableRefineOnMapMove,
  		templates,
  		cssClasses
		} = widgetParams;

		if (isFirstRendering) {
			const element = document.querySelector('#map');
			
			map = L.map(element);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
			}).addTo(map);

			// refine result set on movement
			map.on('moveend', () => {
				if (isUserInteraction && isRefineOnMapMove()) {
					const ne = map.getBounds().getNorthEast();
					const sw = map.getBounds().getSouthWest();
					
					refine({
						northEast: { lat: ne.lat, lng: ne.lng },
						southWest: { lat: sw.lat, lng: sw.lng },
					});
				}
			});
			
			// toggle for refinement on move
			const refineControl = document.querySelector('#refine-on-move');
			refineControl.checked = isRefineOnMapMove() ? 'checked' : '';
			refineControl.addEventListener('change', function(event) {
				toggleRefineOnMapMove();
			});

			// reset map button
			const resetButton = document.createElement('button');
			resetButton.className = 'map-control map-btn--reset';
			resetButton.textContent = 'Reset Map';
			resetButton.addEventListener('click', () => {
				clearMapRefinement();
			});
			container.appendChild(resetButton);
		}

		document.querySelector('button').hidden = !currentRefinement;

		markers.forEach(marker => marker.remove());
	
		markers = items.map(({ name, role, _geoloc }) => {
			let marker = L.marker([_geoloc.lat, _geoloc.lng]);
			let tooltip = L.tooltip();
			tooltip.setContent(`<p class="map-marker-name">${name}<p><p class="map-marker-role">${role}</p>`);
			marker.bindTooltip(tooltip).openTooltip();
			marker.addTo(map);
			return marker;
		});

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
		customGeoSearch(
			{
				container: document.querySelector('#map'),
				initialPosition: {
					lat: 13.493493107850682,
					lng: -89.38474698770433
				},
				initialZoom: 13,
				transformItems(items) {
					const newItems = [];
					for (let i = 0; i < items.length; i++) {
						const engineer = items[i];
						for(let l = 0; l < engineer._geoloc.length; l++) {
							newItems.push({name: engineer.name, role: engineer.role, objectID: engineer.objectID, _geoloc: {
								lat: engineer._geoloc[l].lat,
								lng: engineer._geoloc[l].lng,
							}});
						}
					}
					return newItems;
				}
			}
		)
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