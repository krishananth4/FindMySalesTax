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

// Array of all state names (matching the IDs of your HTML elements)
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

// Shows a specific state element and hides all other state elements, and assumes each state has an HTML element with an ID matching its full name
function showOnlyState(stateToShow) {
    let stateMap = document.getElementById("statesMap");
    let state = document.getElementById("state");
    document.getElementById("countiesMap").style.display = 'block';
    console.log("Showing only state "+stateToShow);
    stateMap.style.display = 'none';    

    // Iterate through all possible state IDs
    allStateIds.forEach(stateId => {
        const element = document.getElementById(stateId);
        if (element) {
        if (stateId === stateToShow) {
            // If it's the state to show, set its display to 'block'
            element.style.display = 'block';
        } else {
            // Otherwise, hide it
            element.style.display = 'none';
        }
        } else {
        console.warn(`Element with ID "${stateId}" not found.`);
        }
    });
    // Hide the "borders" element when showing only one state
    const bordersElement = document.getElementById("borders");
    if (bordersElement) {
        bordersElement.style.display = 'none';
    } else {
        console.warn(`Element with ID "borders" not found.`);
    }

    Array.from(document.getElementsByTagName('path')).forEach(e => {
        e.addEventListener('click', () => {
            const titleElement = e.querySelector('title');
            if (titleElement) {
                console.log(titleElement.textContent);
                let countyName = titleElement.textContent; // ex. Hennepin, MN
                //invoke call to DB here based on the textcontent
                console.log(findStateName(countyName));

            }
        });
    });

    //udpate switch button
    const fullStatesMapButton = document.getElementById("viewStatesMapButton");
    fullStatesMapButton.addEventListener('click', showStateMap);
}

/**
 * finds the state name from pre-defined map for use in matching json.
 * @param {string} code - County name, state code
 * @returns {Array} - county, state name
 */
function findStateName(code) {
    const [county, stateCode] = code.split(',').map(s => s.trim().toLowerCase());

    const fullStateName = states.get(stateCode).replace(/_/g, ' ').toLowerCase();
    if (!fullStateName) {
        console.warn(`Unrecognized state code: ${stateCode}`);
        return code;
    }

    return [county, fullStateName];
}

function showStateMap(){
    console.log("showing state map");
    document.getElementById("countiesMap").style.display = 'none';    
    let stateMap = document.getElementById("statesMap");
    stateMap.style.display = 'block';

    const fullCountyMapButton = document.getElementById("viewCountiesMapButton");
    fullCountyMapButton.removeEventListener('click', showCountyMap);
    fullCountyMapButton.addEventListener('click', showCountyMap);

    // Add event listeners for each state
    states.forEach((stateName, abbreviation) => {
        // Get all elements that have the state abbreviation as a class name
        const stateElements = document.getElementsByClassName(abbreviation);

        // Iterate through all elements found for this state abbreviation
        for (let i = 0; i < stateElements.length; i++) {
        const stateElement = stateElements[i];
        // Use an anonymous function to capture the current stateName
        stateElement.addEventListener('click', () => {
            showOnlyState(stateName);
        });
        }
    });
}

function showCountyMap(){
    console.log("showing county map");
    showAllStates();
    document.getElementById("statesMap").style.display = "none"
    
    document.getElementById("countiesMap").style.display = 'block';
    const fullStatesMapButton = document.getElementById("viewStatesMapButton");
    fullStatesMapButton.addEventListener('click', showStateMap);
}

// Resets the map by showing all state elements, which is useful for returning from a single-state view to the full map.
function showAllStates() {
allStateIds.forEach(stateId => {
    const element = document.getElementById(stateId);
    if (element) {
    element.style.display = 'block';
    } else {
    console.warn(`Element with ID "${stateId}" not found.`);
    }
});
// Show the "borders" element when displaying all states
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
            showStateMap();
        }
    });
showStateMap(); // Starts the call to display the map

