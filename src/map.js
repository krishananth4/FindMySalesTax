// State codes map
const states = new Map([
    ["al", "Alabama"],
    ["ak", "Alaska"],
    ["az", "Arizona"],
    ["ar", "Arkansas"],
    ["ca", "California"],
    ["co", "Colorado"],
    ["ct", "Connecticut"],
    ["de", "Delaware"],
    ["fl", "Florida"],
    ["ga", "Georgia"],
    ["hi", "Hawaii"],
    ["id", "Idaho"],
    ["il", "Illinois"],
    ["in", "Indiana"],
    ["ia", "Iowa"],
    ["ks", "Kansas"],
    ["ky", "Kentucky"],
    ["la", "Louisiana"],
    ["me", "Maine"],
    ["md", "Maryland"],
    ["ma", "Massachusetts"],
    ["mi", "Michigan"],
    ["mn", "Minnesota"],
    ["ms", "Mississippi"],
    ["mo", "Missouri"],
    ["mt", "Montana"],
    ["ne", "Nebraska"],
    ["nv", "Nevada"],
    ["nh", "New_Hampshire"],
    ["nj", "New_Jersey"],
    ["nm", "New_Mexico"],
    ["ny", "New_York"],
    ["nc", "North_Carolina"],
    ["nd", "North_Dakota"],
    ["oh", "Ohio"],
    ["ok", "Oklahoma"],
    ["or", "Oregon"],
    ["pa", "Pennsylvania"],
    ["ri", "Rhode_Island"],
    ["sc", "South_Carolina"],
    ["sd", "South_Dakota"],
    ["tn", "Tennessee"],
    ["tx", "Texas"],
    ["ut", "Utah"],
    ["vt", "Vermont"],
    ["va", "Virginia"],
    ["wa", "Washington"],
    ["wv", "West_Virginia"],
    ["wi", "Wisconsin"],
    ["wy", "Wyoming"],
    ["dc", "DC"]
]);

// Array of all state names
const allStateIds = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New_Hampshire", "New_Jersey",
    "New_Mexico", "New_York", "North_Carolina", "North_Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode_Island", "South_Carolina",
    "South_Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
    "Washington", "West_Virginia", "Wisconsin", "Wyoming", "DC"
];

// Map state values to their county dropdown container IDs
const countyDropdownMap = new Map([
    ["Alabama", "searchAlabamaCounties"],
    ["Alaska", "searchAlaskaCounties"],
    ["Arizona", "searchArizonaCounties"],
    ["Arkansas", "searchArkansasCounties"],
    ["California", "searchCaliforniaCounties"],
    ["Colorado", "searchColoradoCounties"],
    ["Connecticut", "searchConnecticutCounties"],
    ["Delaware", "searchDelawareCounties"],
    ["Florida", "searchFloridaCounties"],
    ["Georgia", "searchGeorgiaCounties"],
    ["Hawaii", "searchHawaiiCounties"],
    ["Idaho", "searchIdahoCounties"],
    ["Illinois", "searchIllinoisCounties"],
    ["Indiana", "searchIndianaCounties"],
    ["Iowa", "searchIowaCounties"],
    ["Kansas", "searchKansasCounties"],
    ["Kentucky", "searchKentuckyCounties"],
    ["Louisiana", "searchLouisianaCounties"],
    ["Maine", "searchMaineCounties"],
    ["Maryland", "searchMarylandCounties"],
    ["Massachusetts", "searchMassachusettsCounties"],
    ["Michigan", "searchMichiganCounties"],
    ["Minnesota", "searchMinnesotaCounties"],
    ["Mississippi", "searchMississippiCounties"],
    ["Missouri", "searchMissouriCounties"],
    ["Montana", "searchMontanaCounties"],
    ["Nebraska", "searchNebraskaCounties"],
    ["Nevada", "searchNevadaCounties"],
    ["New_Hampshire", "searchNewHampshireCounties"],
    ["New_Jersey", "searchNewJerseyCounties"],
    ["New_Mexico", "searchNewMexicoCounties"],
    ["New_York", "searchNewYorkCounties"],
    ["North_Carolina", "searchNorthCarolinaCounties"],
    ["North_Dakota", "searchNorthDakotaCounties"],
    ["Ohio", "searchOhioCounties"],
    ["Oklahoma", "searchOklahomaCounties"],
    ["Oregon", "searchOregonCounties"],
    ["Pennsylvania", "searchPennsylvaniaCounties"],
    ["Rhode_Island", "searchRhodeIslandCounties"],
    ["South_Carolina", "searchSouthCarolinaCounties"],
    ["South_Dakota", "searchSouthDakotaCounties"],
    ["Tennessee", "searchTennesseeCounties"],
    ["Texas", "searchTexasCounties"],
    ["Utah", "searchUtahCounties"],
    ["Vermont", "searchVermontCounties"],
    ["Virginia", "searchVirginiaCounties"],
    ["Washington", "searchWashingtonCounties"],
    ["West_Virginia", "searchWestVirginiaCounties"],
    ["Wisconsin", "searchWisconsinCounties"],
    ["Wyoming", "searchWyomingCounties"]
]);

// Global variable declarations
let currentFloatingWindow = null;
let countyClickHandler = null;
let currentZoom = 1;
let currentPanX = 0;
let currentPanY = 0;
let svgElement = null;
let transformGroup = null; // The group that gets transformed for pan/zoom

/**
 * Initializes the overall map and attaches #transform-group to it
 */
function initializeSVG() {
    svgElement = document.querySelector('#countiesMap svg') || document.querySelector('svg');
    if (svgElement) {
        // Add viewBox if it doesn't exist
        if (!svgElement.getAttribute('viewBox')) {
            const width = svgElement.getAttribute('width') || '989.98';
            const height = svgElement.getAttribute('height') || '627.07';
            svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }

        // Add transform group if it doesn't exist
        transformGroup = svgElement.querySelector('#transform-group'); // Assign to global transformGroup
        if (!transformGroup) {
            transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            transformGroup.id = 'transform-group';

            // Move all existing content into the transform group
            while (svgElement.firstChild) {
                transformGroup.appendChild(svgElement.firstChild);
            }
            svgElement.appendChild(transformGroup);
        }
    }
}

// Get bounding box of a state element for use in zooming
function getStateBounds(stateId) {
    const stateElement = document.getElementById(stateId);
    if (!stateElement) return null;

    try {
        const bbox = stateElement.getBBox();
        return {
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
            centerX: bbox.x + bbox.width / 2,
            centerY: bbox.y + bbox.height / 2
        };
    } catch (error) {
        console.warn(`Could not get bounds for state: ${stateId}`, error);
        return null;
    }
}

/**
 * creates a smooth animation for transforms such as zoom or reset
 * @param {number} zoom
 * @param {number} panX
 * @param {number} panY
 * @param {number} duration
 */
function applyTransform(zoom, panX, panY, duration = 500) {
    const transformGroup = svgElement?.querySelector('#transform-group');
    if (!transformGroup) return;

    currentZoom = zoom;
    currentPanX = panX;
    currentPanY = panY;

    // Add smooth transition
    transformGroup.style.transition = `transform ${duration}ms ease-in-out`;
    transformGroup.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;

    // Remove transition after animation completes
    setTimeout(() => {
        transformGroup.style.transition = '';
    }, duration);
}

/**
 * zooms to a specific state based on given params
 * @param {string} stateId
 * @param {number} zoomPadding
 */
function zoomToState(stateId, zoomPadding = 50) {
    if (!svgElement) {
        console.warn('SVG element not found');
        return;
    }

    const bounds = getStateBounds(stateId);
    if (!bounds) {
        console.warn(`Could not get bounds for state: ${stateId}`);
        return;
    }

    // Get SVG container dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const containerWidth = svgRect.width;
    const containerHeight = svgRect.height;

    // Calculate zoom level to fit state with padding
    const scaleX = (containerWidth - zoomPadding * 2) / bounds.width;
    const scaleY = (containerHeight - zoomPadding * 2) / bounds.height;
    const zoom = Math.min(scaleX, scaleY, 5); // Max zoom of 5x

    // Calculate pan to center the state
    const panX = (containerWidth / 2) - (bounds.centerX * zoom);
    const panY = (containerHeight / 2) - (bounds.centerY * zoom);

    applyTransform(zoom, panX, panY);
}

/**
 * Resets zoom to show full map
 */
function resetZoom() {
    applyTransform(1, 0, 0);
}

/**
 * Highlights a specific SVG county path by adding an 'active' class.
 * Removes 'active' class from previously highlighted counties.
 * @param {SVGPathElement|null} targetPathElement The SVG path element to highlight, or null to clear highlights.
 */
function highlightMapCounty(targetPathElement) {
    // Remove 'active' class from all currently active county paths
    document.querySelectorAll('#countiesMap svg path.active').forEach(path => {
        path.classList.remove('active');
    });

    // Add 'active' class to the target path element if provided
    if (targetPathElement) {
        targetPathElement.classList.add('active');
    }
}

/**
 * handle click event for county
 * @param {Event} event The click event object
 */
async function handleCountyClick(event) {
    hideFloatingTaxWindow();

    const clickedPath = event.target.closest('path'); // Ensure we get the path element itself
    if (!clickedPath) {
        console.warn('Clicked element is not an SVG path or is not within one.');
        return;
    }

    const titleElement = clickedPath.querySelector('title');
    if (titleElement) {
        let fullCountyTitle = titleElement.textContent; // e.g., "Fairfield, CT"
        let [countyNameFromTitle, stateCodeFromTitle] = fullCountyTitle.split(',').map(s => s.trim());

        // Convert state code (e.g., "CT") to full state name (e.g., "Connecticut")
        let stateName = states.get(stateCodeFromTitle.toLowerCase());

        if (stateName) {
            // 1. Update the State Dropdown
            const stateSelection = document.getElementById("stateSelection");
            stateSelection.value = stateName; // Set the dropdown value directly
            // Check if the value was successfully set (i.e., option exists)
            const stateFoundInDropdown = (stateSelection.value === stateName);


            if (stateFoundInDropdown) {
                // Trigger change to ensure the correct county dropdown container is displayed
                const changeEvent = new Event('change');
                stateSelection.dispatchEvent(changeEvent);

                // Add a small delay to ensure the correct county dropdown container is rendered
                // and populated (if dynamic) before attempting to select an option.
                setTimeout(() => {
                    // Get the SELECT element directly using the updated countyDropdownMap
                    const countyDropdownElementId = countyDropdownMap.get(stateName);
                    const countyDropdownContainer = document.getElementById(countyDropdownElementId);

                    if (countyDropdownContainer) {
                        const countyDropdownElement = countyDropdownContainer.querySelector('select'); // Get the actual select element
                        if (countyDropdownElement) {
                            // Convert "Fairfield" from title to "Fairfield_County" for the dropdown value
                            // Ensure the value matches the option's value attribute (e.g., "Autauga_County")
                            const targetCountyValue = capitalizeWords(countyNameFromTitle).replace(/ /g, '_') + "_County";
                            console.log(`Attempting to set county dropdown to value: "${targetCountyValue}"`);

                            countyDropdownElement.value = targetCountyValue;
                            if (countyDropdownElement.value !== targetCountyValue) {
                                console.warn(`County "${targetCountyValue}" (derived from "${countyNameFromTitle}") not found in dropdown options for state "${stateName}".`);
                                // Optionally, reset county dropdown to default if no match is found
                                countyDropdownElement.value = "Default" + stateName.replace(/[^a-zA-Z0-9]/g, '');
                            }
                        } else {
                            console.warn(`County dropdown SELECT element not found inside container "${countyDropdownElementId}".`);
                        }
                    } else {
                        console.warn(`County dropdown container with ID "${countyDropdownElementId}" not found for state "${stateName}".`);
                    }
                }, 50); // Small delay

                // Highlight the clicked county on the map
                highlightMapCounty(clickedPath);

            } else {
                console.warn(`State "${stateName}" not found in the main state dropdown.`);
            }

        } else {
            console.warn(`Could not determine full state name from state code: "${stateCodeFromTitle}"`);
        }

        let loc = findStateName(fullCountyTitle); // Keep this for your tax fetching logic

        const x = event.clientX;
        const y = event.clientY;

        console.log('Fetching tax for:', loc);

        try {
            const taxRate = await getSalesTax(loc);
            showFloatingTaxWindow(x, y, loc[0], loc[1], taxRate);
        } catch (error) {
            console.error('Error fetching tax rate:', error);
            showFloatingTaxWindow(x, y, loc[0], loc[1], null);
        }
    } else {
        console.warn('Clicked SVG path element has no <title> child.');
    }
}

/**
 * Remove county click listeners from all path elements
 */
function removeCountyClickListeners() {
    if (countyClickHandler) {
        Array.from(document.querySelectorAll('#countiesMap svg path')).forEach(pathElement => {
            pathElement.removeEventListener('click', countyClickHandler);
        });
    }
}

/**
 * Adds county click listeners to all path elements
 */
function addCountyClickListeners() {
    removeCountyClickListeners();
    countyClickHandler = handleCountyClick;

    // add click listeners to all elements that are SVG paths
    Array.from(document.querySelectorAll('#countiesMap svg path')).forEach(pathElement => {
        pathElement.addEventListener('click', countyClickHandler);
    });
}

/**
 * create and display window for tax info
 * @param {number} x
 * @param {number} y
 * @param {string} countyName
 * @param {string} stateName
 * @param {number|null} taxRate
 */
function showFloatingTaxWindow(x, y, countyName, stateName, taxRate) {
    // remove old ones
    hideFloatingTaxWindow();

    const floatingWindow = document.createElement('div');
    floatingWindow.id = 'taxFloatingWindow';
    floatingWindow.className = 'tax-floating-window';

    // create window element
    let content;
    if (taxRate !== null && taxRate !== undefined) {
        content = `
            <div class="tax-window-header">
                <strong>${countyName}</strong>
                <div class="tax-window-state">${stateName}</div>
            </div>
            <div class="tax-window-rate">
                <span class="tax-label">Sales Tax:</span>
                <span class="tax-value">${taxRate}%</span>
            </div>
        `;
    } else {
        content = `
            <div class="tax-window-header">
                <strong>${countyName}</strong>
                <div class="tax-window-state">${stateName}</div>
            </div>
            <div class="tax-window-error">
                Tax rate not available
            </div>
        `;
    }

    floatingWindow.innerHTML = content;

    // position the window and attach it to DOM
    floatingWindow.style.left = `${x + 10}px`;
    floatingWindow.style.top = `${y - 10}px`;

    document.body.appendChild(floatingWindow);
    currentFloatingWindow = floatingWindow;

    setTimeout(() => {
        floatingWindow.classList.add('show');
    }, 10);
}

/**
 * Hides and removes the floating tax window
 */
function hideFloatingTaxWindow() {
    if (currentFloatingWindow) {
        currentFloatingWindow.classList.remove('show');
        setTimeout(() => {
            if (currentFloatingWindow && currentFloatingWindow.parentNode) {
                currentFloatingWindow.parentNode.removeChild(currentFloatingWindow);
            }
            currentFloatingWindow = null;
        }, 200);
    }
}

/**
 * hides all other state elements, showing the selected one
 * @param {string} stateToShow
 */
function showOnlyState(stateToShow) {
    // Hide existing floating windows
    hideFloatingTaxWindow();

    const countyDropdownId = countyDropdownMap.get(stateToShow);
    if (countyDropdownId) {
        const countyDropdownElement = document.getElementById(countyDropdownId);
        if (countyDropdownElement) {
            countyDropdownElement.style.display = 'block';
        } else {
            console.warn(`County dropdown element with ID "${countyDropdownId}" not found for state "${stateToShow}".`);
        }
    }

    let stateMap = document.getElementById("statesMap");
    document.getElementById("countiesMap").style.display = 'block';

    console.log("Showing only state " + stateToShow);
    stateMap.style.display = 'none';

    // Update the dropdown selector
    const stateSelection = document.getElementById("stateSelection");
    stateSelection.value = stateToShow; // Directly set the value

    // Add zoom to the selected state
    setTimeout(() => {
        zoomToState(stateToShow);
    }, 100); // Small delay to ensure display changes are applied

    // Reset onclick handlers for counties map
    addCountyClickListeners();

    const fullStatesMapButton = document.getElementById("viewStatesMapButton");
    fullStatesMapButton.removeEventListener('click', showStateMap);
    fullStatesMapButton.addEventListener('click', showStateMap);

    // Clear any active county highlight when switching states
    highlightMapCounty(null);
}

/**
 * finds the state name from pre-defined map for use in matching json.
 * @param {string} code - County name, state code (e.g., "Fairfield, CT")
 * @returns {Array} - [countyName, stateName] (e.g., ["Fairfield County", "Connecticut"])
 */
function findStateName(code) {
    const [county, stateCode] = code.split(',').map(s => s.trim().toLowerCase());

    let fullStateName = states.get(stateCode);
    if (!fullStateName) {
        console.warn(`Unrecognized state code: ${stateCode}`);
        // Fallback to original state code if full name not found for capitalizeWords
        fullStateName = stateCode;
    }

    // Capitalize words for county and state to match expected format "County Name", "State Name"
    const countyCap = capitalizeWords(county);
    // Ensure " County" suffix if not present (this depends on how your get_tax.php expects it)
    const finalCountyName = countyCap.endsWith("County") ? countyCap : countyCap + " County";

    const stateCap = capitalizeWords(fullStateName); // Uses the map's full name, then capitalizes

    console.log("Processed for API call:", finalCountyName + ", " + stateCap);
    return [finalCountyName, stateCap];
}

/**
 * capitalize words helper function to match db entries
 * @param {string} str
 * @returns {string}
 */
function capitalizeWords(str) {
    const strippedStr = str.replace(/[.,\/#!$%\^&\*;:{}=\-`~()]/g, "").replace(/_/g, " ");

    return strippedStr.split(' ')
        .filter(word => word.length > 0)
        .map(word => {
            // Special handling for "DC" or other two-letter uppercase abbreviations
            if (word.toUpperCase() === word && word.length <= 2 && word !== "of") { // Avoid "of" for words like "District of Columbia"
                return word.toUpperCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}


/**
 * fetch sales tax for a given county/state
 * @param {Array<string>} arr - An array containing [countyName, stateName]
 * @returns {Promise<number|null>} - either returns tax rate or null
 */
async function getSalesTax(arr) {
    const county = arr[0];
    const state = arr[1];

    const params = {
        county: county,
        state: state
    };
    if (state === "Alaska" || state === "Delaware" || state === "Montana" || state === "New Hampshire" || state === "Oregon") {
        return 0; // No Sales tax for any of the counties
    }
    try {
        const response = await fetch("get_tax.php", {
            method: "POST",
            body: JSON.stringify(params),
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            }
        });

        // error/response handling
        if (response.ok) {
            const data = await response.json();
            // Data found (status 200)
            if (data.tax !== null) {
                console.log(`Sales tax for ${county}, ${state}: ${data.tax}`);
                return data.tax; // Return the tax rate
            } else {
                // Data not found (status 404, or 200 with tax: null)
                console.warn(`No sales tax found for ${county}, ${state}. Message: ${data.message || 'Data not found.'}`);
                return null;
            }
        } else {
            // Handle HTTP errors (e.g., 400, 404, 500)
            const errorData = await response.json();
            if (response.status === 400) {
                console.error(`Client Error (400 Bad Request): ${errorData.error}`);
            } else if (response.status === 404) {
                console.warn(`Not Found (404): ${errorData.message}`);
            } else if (response.status === 500) {
                console.error(`Server Error (500 Internal Server Error): ${errorData.error}`);
            } else {
                console.error(`HTTP Error ${response.status}: ${errorData.error || 'Unknown error.'}`);
            }
            return null; // error return null
        }
    } catch (error) {
        console.error('Network or parsing error:', error);
        return null;
    }
}

/**
 * show the full state map
 */
function showStateMap() {
    console.log("showing state map");
    // Reset zoom first
    resetZoom();

    // Reset onclicks/floating windows and clear map highlights
    hideFloatingTaxWindow();
    removeCountyClickListeners();
    highlightMapCounty(null); // Clear any county highlights

    document.getElementById("countiesMap").style.display = 'none';
    let stateMap = document.getElementById("statesMap");
    stateMap.style.display = 'block';

    const fullCountyMapButton = document.getElementById("viewCountiesMapButton");
    fullCountyMapButton.removeEventListener('click', showCountyMap);
    fullCountyMapButton.addEventListener('click', showCountyMap);

    // Add event listeners for each state
    states.forEach((stateName, abbreviation) => {
        const stateElements = document.getElementsByClassName(abbreviation);
        for (let i = 0; i < stateElements.length; i++) {
            const stateElement = stateElements[i];
            // Remove previous listener to prevent duplicates
            const oldClickListener = stateElement._stateClickListener; // Store the listener for removal
            if (oldClickListener) {
                stateElement.removeEventListener('click', oldClickListener);
            }
            const newClickListener = () => {
                showOnlyState(stateName);
            };
            stateElement.addEventListener('click', newClickListener);
            stateElement._stateClickListener = newClickListener; // Store the new listener
        }
    });

    // Reset the state dropdown to "-- Display All States --" if currently showing states map
    const stateSelection = document.getElementById("stateSelection");
    const allStatesOption = Array.from(stateSelection.options).find(option => option.value === "-- Display All States --");
    if (allStatesOption) {
        stateSelection.value = "-- Display All States --";
    }
}

/**
 * Shows US map with all counties
 */
function showCountyMap() {
    console.log("showing county map");
    // Reset zoom
    resetZoom();

    // Reset onclicks/floating windows and clear map highlights
    hideFloatingTaxWindow();
    showAllStates(); // This likely means showing all state outlines
    highlightMapCounty(null); // Clear any county highlights
    document.getElementById("statesMap").style.display = "none";

    document.getElementById("countiesMap").style.display = 'block';

    // Add county click listeners for full county map
    addCountyClickListeners();

    const fullStatesMapButton = document.getElementById("viewStatesMapButton");
    fullStatesMapButton.removeEventListener('click', showStateMap);
    fullStatesMapButton.addEventListener('click', showStateMap);

    // Also reset the state dropdown to its default "Select a State"
    const stateSelection = document.getElementById("stateSelection");
    const defaultStateOption = Array.from(stateSelection.options).find(option => option.value === ""); // Assuming empty string is default
    if (defaultStateOption) {
        stateSelection.value = "";
        stateSelection.dispatchEvent(new Event('change')); // Trigger to hide county dropdowns
    }
}

/**
 * show full map and resets elements
 */
function showAllStates() {
    allStateIds.forEach(stateId => {
        const element = document.getElementById(stateId);
        if (element) {
            element.style.display = 'block';
        }
    });
}

/**
 * adds mouse functionality to svgelement for pan/drag
 * @returns {null} -if svgElement not found
 */
function addMousePanDrag() {
    if (!svgElement) return;

    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    svgElement.addEventListener('mousedown', (e) => {
        // Only allow dragging if the target is not a county path (to allow click events on paths)
        if (e.button === 0 && !e.target.closest('path')) { // Left mouse button
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            svgElement.style.cursor = 'grabbing';
            // Prevent text selection during drag
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;

            applyTransform(currentZoom, currentPanX + deltaX, currentPanY + deltaY, 0);

            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            svgElement.style.cursor = 'grab';
        }
    });
}

/**
 * binds mousewheel listener to svgelement for zoom
 * @returns {null} - if svgElement not found
 */
function addMouseWheelZoom() {
    if (!svgElement) return;

    svgElement.addEventListener('wheel', (e) => {
        e.preventDefault();

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.5, Math.min(10, currentZoom * zoomFactor));

        // Get mouse position relative to SVG
        const rect = svgElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate new pan to zoom towards mouse position
        const newPanX = mouseX - (mouseX - currentPanX) * (newZoom / currentZoom);
        const newPanY = mouseY - (mouseY - currentPanY) * (newZoom / currentZoom);

        applyTransform(newZoom, newPanX, newPanY, 100);
    });
}

/**
 * Handles the change event for any county dropdown.
 * Simulates a click on the corresponding SVG county path.
 */
async function handleCountyDropdownChange(event) {
    const selectedCountyValue = event.target.value; // e.g., "Kent_County" or "DefaultDelaware"
    const countyDropdownId = event.target.id; // e.g., "countySelectionDelaware"

    // Extract state name from the dropdown ID by removing "countySelection" prefix
    let stateName = countyDropdownId.replace('countySelection', '');

    // If a "Default" option is selected, clear map highlight and hide floating window
    if (selectedCountyValue.startsWith("Default")) {
        console.log(`Default option selected for ${stateName}. Clearing map highlight and hiding tax window.`);
        highlightMapCounty(null); // Clear any active county highlight
        hideFloatingTaxWindow();
        zoomToState(stateName); // Re-zoom to the full state view
        return; // Exit if default option is selected
    }

    // Convert selected county value (e.g., "Kent_County") to the expected display text format
    // for comparison with SVG title, which is typically "County Name" (no "_")
    let countyNameForTitle = capitalizeWords(selectedCountyValue).replace(/ County$/, '').trim(); // Remove " County" if present for title matching

    console.log(`County dropdown changed: Selected "${countyNameForTitle}" in state "${stateName}"`);

    // Find the corresponding SVG path element
    // To reverse map stateName to stateCode
    const stateCodeMap = new Map();
    states.forEach((full, code) => stateCodeMap.set(full, code));
    const stateCode = stateCodeMap.get(stateName);

    if (!stateCode) {
        console.error(`Could not find state code for state name: ${stateName}`);
        return;
    }

    // Prepare the title text we expect to find in the SVG path
    // Example: "Kent, DE"
    const expectedSvgTitle = `${countyNameForTitle}, ${stateCode.toUpperCase()}`;

    console.log(`Looking for SVG path with title: "${expectedSvgTitle}"`);

    const allCountyPaths = document.querySelectorAll('#countiesMap svg path');
    let targetCountyPath = null;

    for (const path of allCountyPaths) {
        const titleElement = path.querySelector('title');
        if (titleElement && titleElement.textContent.trim() === expectedSvgTitle) {
            targetCountyPath = path;
            break;
        }
    }

    if (targetCountyPath) {
        console.log('Found matching SVG path:', targetCountyPath);
        // Simulate a click on the found SVG path
        // Create a custom event object to mimic a real click event
        // clientX/Y are approximate, but needed for the floating window positioning
        const bbox = targetCountyPath.getBoundingClientRect();
        const clientX = bbox.left + bbox.width / 2;
        const clientY = bbox.top + bbox.height / 2;

        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: clientX,
            clientY: clientY
        });
        targetCountyPath.dispatchEvent(clickEvent);
    } else {
        console.warn(`No SVG path found for county "${countyNameForTitle}" in state "${stateName}" with title "${expectedSvgTitle}".`);
        // If no matching path, clear any highlight and hide the tax window
        highlightMapCounty(null);
        hideFloatingTaxWindow();
    }
}

/**
 * Initialize all starting functions and element binds
 */
function init() {
    // hide floating window when clicking outside
    document.addEventListener('click', (e) => {
        // Hide if click is outside currentFloatingWindow, a path, or a select dropdown
        if (currentFloatingWindow && !currentFloatingWindow.contains(e.target) && !e.target.closest('path') && !e.target.closest('select')) {
            hideFloatingTaxWindow();
        }
    });

    document.getElementById("stateSelection").addEventListener("change", (e) => {
        let selectedState = e.target.value;
        console.log("State dropdown changed to:", selectedState);
        hideFloatingTaxWindow();
        hideAllCountyDropdowns(); // Hide all first
        highlightMapCounty(null); // Clear any county highlights when state changes

        if (selectedState === "-- Display All States --") {
            resetZoom();
            showStateMap();
        } else {
            showOnlyState(selectedState);
            // After showing the specific state (and thus its county dropdown),
            // attach the listener to the *newly visible* county dropdown.
            // Add a small delay to ensure the dropdown is visible before attaching.
            setTimeout(() => {
                const countyDropdownElementId = countyDropdownMap.get(selectedState);
                if (countyDropdownElementId) {
                    const countyDropdownContainer = document.getElementById(countyDropdownElementId);
                    if (countyDropdownContainer) {
                        const countyDropdownElement = countyDropdownContainer.querySelector('select'); // Get the actual select element
                        if (countyDropdownElement) {
                            // Remove previous listener to prevent duplicates if state is re-selected
                            countyDropdownElement.removeEventListener('change', handleCountyDropdownChange);
                            countyDropdownElement.addEventListener('change', handleCountyDropdownChange);
                            console.log(`Attached listener to ${countyDropdownElement.id}`);
                        }
                    }
                }
            }, 150); // Slightly longer delay might be needed for dynamic rendering
        }
    });

    // Hides all county dropdown container divs.
    function hideAllCountyDropdowns() {
        countyDropdownMap.forEach(dropdownId => {
            const element = document.getElementById(dropdownId);
            if (element) {
                element.style.display = 'none';
                // Also, consider resetting the value to default when hidden
                const selectElement = element.querySelector('select');
                if (selectElement) {
                    // This assumes your default option values start with "Default" followed by the state name
                    selectElement.value = "Default" + selectElement.id.replace('countySelection', '');
                }
            }
        });
    }

    //add esc button to go to full map
    document.addEventListener("keydown", (e) => {
        if (e.key === 'Escape') {
            hideFloatingTaxWindow();
            showStateMap();
            resetZoom();
        }
    });

    // Initial calls
    initializeSVG(); // Ensure SVG and transformGroup are initialized first
    addMousePanDrag();
    addMouseWheelZoom();
    showStateMap(); // Start by showing the full state map
}

init();