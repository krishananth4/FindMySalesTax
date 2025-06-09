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

// track unique element states
let currentFloatingWindow = null;
let countyClickHandler = null;

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
    // hide existing floating windows
    hideFloatingTaxWindow();
    
    let stateMap = document.getElementById("statesMap");
    document.getElementById("countiesMap").style.display = 'block';

    console.log("Showing only state " + stateToShow);
    stateMap.style.display = 'none';   
    // if the selected state exists, show it otherwise hide
    allStateIds.forEach(stateId => {
        const element = document.getElementById(stateId);
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
    
    const bordersElement = document.getElementById("borders");
    if (bordersElement) {
        bordersElement.style.display = 'none';
    } else {
        console.warn(`Element with ID "borders" not found.`);
    }
    // reset onclick handlers
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
    // reset onclicks/floating windows
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
        //set unique listeners
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
 * Shows us map with all counties
 */
function showCountyMap() {
    console.log("showing county map");
    //reset onclicks/floating windows
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
const bordersElement = document.getElementById("borders");
if (bordersElement) {
    bordersElement.style.display = 'block';
} else {
    console.warn(`Element with ID "borders" not found.`);
}
}

//add esc button to go to full map
document.addEventListener("keydown",(e)=>{
    if(e.key==='Escape') {
        hideFloatingTaxWindow();
        showStateMap();
    }
});

// hide floating window when clicking outside
document.addEventListener('click', (e) => {
    if (currentFloatingWindow && !currentFloatingWindow.contains(e.target) && !e.target.closest('path')) {
        hideFloatingTaxWindow();
    }
});

document.getElementById("stateSelection").addEventListener("change",(e)=>{
   let selectedState = e.target.value;
   console.log(selectedState);
   hideFloatingTaxWindow(); // Hide floating window when changing state selection
   
   if(selectedState==="-- Display All States --"){
    showStateMap();
   }else { 
   showOnlyState(selectedState);
   }
});

showStateMap(); // init