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

// Global variable declarations
let currentFloatingWindow = null;
let countyClickHandler = null;
let currentZoom = 1;
let currentPanX = 0;
let currentPanY = 0;
let svgElement = null;

/**
 *  initializes the overall map and attaches #transform-group to it
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
        let transformGroup = svgElement.querySelector('#transform-group');
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
 * @param {int} zoom 
 * @param {int} panX 
 * @param {int} panY 
 * @param {int} duration 
 * @returns 
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
 * @param {*} zoomPadding 
 * @returns {null} - if svg or bounds not found
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

// Reset zoom to show full map
function resetZoom() {
    applyTransform(1, 0, 0);
}
/**
 * handle click event for county
 */
async function handleCountyClick(event) {
    hideFloatingTaxWindow();

    const titleElement = event.target.querySelector('title');
    if (titleElement) {
        let countyName = titleElement.textContent;
        let loc = findStateName(countyName);

        //get location
        const x = event.clientX;
        const y = event.clientY;

        console.log('Fetching tax for:', loc);

        try {
            const taxRate = await getSalesTax(loc);
            // Update window with actual tax rate
            showFloatingTaxWindow(x, y, loc[0], loc[1], taxRate);
        } catch (error) {
            console.error('Error fetching tax rate:', error);
            showFloatingTaxWindow(x, y, loc[0], loc[1], null);
        }
    }
}

/**
 * remove county click listeners from all path elements
 */
function removeCountyClickListeners() {
    if (countyClickHandler) {
        Array.from(document.getElementsByTagName('path')).forEach(pathElement => {
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

    // add click listeners to all elements
    Array.from(document.getElementsByTagName('path')).forEach(pathElement => {
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

    let stateMap = document.getElementById("statesMap");
    document.getElementById("countiesMap").style.display = 'block';

    console.log("Showing only state " + stateToShow);
    stateMap.style.display = 'none';

    // Show/hide states as before
    allStateIds.forEach(stateId => {
        const element = document.getElementById("stateId");
        if (element) {
            if (stateId === stateToShow) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        } else {
            console.warn(`Element with ID "${stateId}" not found.`);
        }
    });

    // Add zoom to the selected state
    setTimeout(() => {
        zoomToState(stateToShow);
    }, 100); // Small delay to ensure display changes are applied

    // Reset onclick handlers
    addCountyClickListeners();

    const fullStatesMapButton = document.getElementById("viewStatesMapButton");
    fullStatesMapButton.removeEventListener('click', showStateMap);
    fullStatesMapButton.addEventListener('click', showStateMap);
}

/**
 * finds the state name from pre-defined map for use in matching json.
 * @param {string} code - County name, state code
 * @returns {Array} - county, state name
 */
function findStateName(code) {
    const [county, stateCode] = code.split(',').map(s => s.trim().toLowerCase());

    let fullStateName = states.get(stateCode);
    if (!fullStateName) {
        console.warn(`Unrecognized state code: ${stateCode}`);
        return code;
    }

    console.log("Original state name:", fullStateName);

    const countyCap = capitalizeWords(county) + " County";
    const stateCap = capitalizeWords(fullStateName);

    console.log("Processed:", countyCap + ", " + stateCap);
    return [countyCap, stateCap];
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
            const upperWord = word.toUpperCase();
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

/**
 * fetch sales tax for a given county/state
 * @param {string} county 
 * @param {string} state 
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

    // Reset onclicks/floating windows
    hideFloatingTaxWindow();
    removeCountyClickListeners();

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
            stateElement.removeEventListener('click', () => {
                showOnlyState(stateName);
            });
            stateElement.addEventListener('click', () => {
                showOnlyState(stateName);
            });
        }
    });
}

/**
 * Shows US map with all counties
 */
function showCountyMap() {
    console.log("showing county map");
    // Reset zoom
    resetZoom();

    // Reset onclicks/floating windows
    hideFloatingTaxWindow();
    showAllStates();
    document.getElementById("statesMap").style.display = "none";

    document.getElementById("countiesMap").style.display = 'block';

    // Add county click listeners for full county map
    addCountyClickListeners();

    const fullStatesMapButton = document.getElementById("viewStatesMapButton");
    fullStatesMapButton.removeEventListener('click', showStateMap);
    fullStatesMapButton.addEventListener('click', showStateMap);
}

// show full map and resets elements
function showAllStates() {
    allStateIds.forEach(stateId => {
        const element = document.getElementById(stateId);
        if (element) {
            element.style.display = 'block';
        } else {
            console.warn(`Element with ID "${stateId}" not found.`);
        }
    });
}
/**
 * adds mouse functionality to svgelement
 * @returns {null} -if svgElement not found
 */
function addMousePanDrag() {
    if (!svgElement) return;

    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    svgElement.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            svgElement.style.cursor = 'grabbing';
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
 * binds mousewheel listener to svgelement 
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
 * Initialize all starting functions and element binds
 */
function init() {
    // hide floating window when clicking outside
    document.addEventListener('click', (e) => {
        if (currentFloatingWindow && !currentFloatingWindow.contains(e.target) && !e.target.closest('path')) {
            hideFloatingTaxWindow();
        }
    });

    document.getElementById("stateSelection").addEventListener("change", (e) => {
        let selectedState = e.target.value;
        console.log(selectedState);
        hideFloatingTaxWindow();

        if (selectedState === "-- Display All States --") {
            resetZoom();
            showStateMap();
        } else {
            showOnlyState(selectedState);
        }
    });


    //add esc button to go to full map
    document.addEventListener("keydown", (e) => {
        if (e.key === 'Escape') {
            hideFloatingTaxWindow();
            showStateMap();
            resetZoom();
        }
    });
    showStateMap(); // init
    initializeSVG();
    addMousePanDrag();
    addMouseWheelZoom();
}

init();