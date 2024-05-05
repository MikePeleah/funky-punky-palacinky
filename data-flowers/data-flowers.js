let data = []; // Global variable to store the dataset
let canvas; // Global variables to store canvas and its context
let legendContainer; // Legend container
let ctx;
let pullType = 'Similar'; 

// Define global variable interactionsType and its possible states
let interactionsType = 'None';
const interactionStates = ['None', 'Similarity', 'Complementarity'];

// Add event listener to track mouse movement
let mouseX;
let mouseY;

const avoidanceSpeed = 0.25; // Speed to avoid mouse pointer  
const slowDown = 0.05;       // Slowdown constant 
const pullConst = 0.01;      // Constant for long-distance pull 
const bounceAccel = 1.25;       // Impulse multiplier in case of bouncing 

const petalWidth= 2/3;        // Petal width as a proportion of a sector 
const petalStart= (1 - petalWidth)/2 * (Math.PI / 2) ; // Start drawing petal wioth a shift

const skills = ['data', 'dataviz', 'drawing', 'handicraft'];

let   maxfloweR = 25;         // Max radius of flower 
// Define the minimum and maximum values for maxfloweR
const minMaxfloweR = 10;
const maxMaxfloweR = 30;

const skillColors = {
    'data'      : '#4f83ce',    // Data -- Medium Sapphire, rest is tetradic https://www.colorhexa.com/4f83ce
    'dataviz'   : '#4fce9a',    // DataViz 
    'drawing'   : '#ce4f83',    // Drawing
    'handicraft': '#ce9a4f'     // Handicraft

/* Older version of colors
    'data'      : '#2D5DA1',    // Data -- Medium Sapphire, rest is tetradic https://www.colorhexa.com/2d5da1
    'dataviz'   : '#2DA171',    // DataViz 
    'drawing'   : '#A12D5D',    // Drawing
    'handicraft': '#A1712D'     // Handicraft
*/
};

// Function to load flower data /////////////////////////////////////////////////////////////////////////////////////////////////
function loadFlowerData() {
    // Try to get from Google Sheets 
    const API_KEY = 'AIzaSyDmWCL6_snpGx0aPg8nJlXLzxmj3TDfG6A';
    const SHEET_ID = '19alxXKV6tPv1SbNzVLgv7_KaCcngUwigmh5LJDMmPxY';
    const RANGE = 'Данные!A:E'; // Specify the range you want to read
    // Fetch data from Google Sheets
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`)
      .then(response => response.json())
      .then(jsonData => {
            // console.log("Look what I got from GS! ", jsonData)
            sheetData = jsonData.values;
            // Mapping of column names from Google Sheets to dictionary keys
            const columnMapping = {
                'Как вас зовут?': 'name',
                'Рисование': 'drawing',
                'Рукоделие': 'handicraft',
                'Данные': 'data',
                'Датавиз': 'dataviz'
            };          
            // Initialize an empty list to store the dictionaries
            const dataList = [];
            // Iterate over the remaining rows (excluding the first row)
            for (let i = 1; i < sheetData.length; i++) {
                const row = sheetData[i];
                const somedata = {};
                // Iterate over the columns
                for (let j = 0; j < row.length; j++) {
                    const columnName = sheetData[0][j]; // Get the column name from the first row
                    const key = columnMapping[columnName]; // Get the corresponding dictionary key
                    // console.log(columnName, key, row[j])
                    somedata[key] = key !== 'name' ? parseInt(row[j]) : row[j];
                }
                // Add the constructed dictionary to the list
            dataList.push(somedata);
          }
          console.log(dataList);
          // Assuming data is a global variable
          data = dataList;
          // Assign random positions and speeds
          assignRandomProperties();
          animate();
          // console.log("Look what I loaded! ", data)
          return jsonData; // Return the loaded data
      })
      .catch(error => {console.error('Error fetching data:', error)});
    
    // Now try to load from a file       
    fetch('data-flowers.json')
        .then(response => response.json())
        .then(jsonData => {
            // Assuming data is a global variable
            data = jsonData;
            // Assign random positions and speeds
            assignRandomProperties();
            animate();
            // console.log("Look what I loaded! ", data)
            return jsonData; // Return the loaded data
        })
        .catch(error => {
            console.error('Error loading dataset:', error);
            data = [{"name":"Наталья","drawing":3,"handicraft":2,"data":3,"dataviz":3}]
            throw error; // Re-throw the error to propagate it to the caller
        });
}

// Function to assign random positions and speeds to flowers ///////////////////////////////////////////////////////////////////
function assignRandomProperties() {
    // console.log("Let's position'em all! ", data)
    data.forEach(flower => {
        // add summary stat on tech and art 
        flower.tech = flower.data + flower.dataviz;
        flower.art = flower.drawing + flower.handicraft;
        // add random position and speed 
        flower.x = Math.random() * (canvas.width - 2 * maxfloweR) + maxfloweR;
        flower.y = Math.random() * (canvas.height- 2 * maxfloweR) + maxfloweR;
        flower.speedX = Math.random() * 2 - 1; // Random number between -1 and 1 for horizontal speed
        flower.speedY = Math.random() * 2 - 1; // Random number between -1 and 1 for vertical speed
        // console.log(flower)
    });
    // Redraw the flowers with updated highlights
    drawFlowers();
}

// Function to draw flowers ////////////////////////////////////////////////////////////////////////////////////////////////////
function drawFlowers() {
    // console.log("Let's draw'em all! ", data)
   
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each flower
    data.forEach(flower => {
        // console.log("Handling : ", flower)
        // Draw circles for three levels of skills
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(flower.x, flower.y, maxfloweR / 3 * i, 0, Math.PI * 2);
            ctx.strokeStyle = 'lightgray'; // Change to desired color
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();
        }

        // Check if flower is highlighted
        if (flower.hasOwnProperty('highlighted') && flower.highlighted === true) {
            // Draw glowing yellow circle
            ctx.beginPath();
            ctx.arc(flower.x, flower.y, maxfloweR + 10, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.33)'; // Yellow color with opacity
            ctx.fillStyle = 'rgba(255, 255, 0, 0.33)';
            ctx.lineWidth = 0;
            ctx.stroke();
            ctx.closePath();
            ctx.fill();
        }
        // Draw petals for each skill
        let startAngle = petalStart; // Was 0 
        // console.log("Loop through skills: ", skills)

        skills.forEach(skill => {
            // console.log("Now drawing ", skill, "with color ", skillColors[skill])
            const radius = flower[skill] / 3 * maxfloweR; // Proportional to the skill
            // const endAngle = startAngle + Math.PI / 2; // Each skill is 1/4 of the circle
            const endAngle = startAngle + petalWidth * (Math.PI / 2); // Each skill is 2/3 of 1/4 of the circle           
            ctx.fillStyle = skillColors[skill];
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(flower.x, flower.y);
            ctx.arc(flower.x, flower.y, radius, startAngle, endAngle);
            ctx.lineTo(flower.x, flower.y);
            ctx.fill();
            
            startAngle = endAngle + (1-petalWidth) * (Math.PI / 2); // Update start angle for the next skill
        });

        // Draw name under the flower
        ctx.fillStyle = '#000';
        ctx.fillText(flower.name, flower.x - ctx.measureText(flower.name).width / 2, flower.y + maxfloweR + 15);
    });
}

// Function to update flower positions ///////////////////////////////////////////////////////////////////////////////////////////
function updateFlowerPositions() {
    // Move flowers according to their speeds 
    data.forEach(flower => {
        // Calculate magnitude of the speed vector
        const speedMagnitude = Math.sqrt(flower.speedX ** 2 + flower.speedY ** 2);

        // Check if speed magnitude is more than 1
        if (speedMagnitude > 1) {
            // Reduce speed vector by slowDown constant
            flower.speedX -= flower.speedX * slowDown;
            flower.speedY -= flower.speedY * slowDown;
        }
        // Update flower positions
        flower.x += flower.speedX;
        flower.y += flower.speedY;

        // Bounce from canvas borders
        // Math is really strange, huhu....
        if (flower.x < 1.5 * maxfloweR || flower.x > (canvas.width - 1.5 * maxfloweR)) {
            flower.speedX *= -1 * bounceAccel;
        }
        if (flower.y < 1.5 * maxfloweR || flower.y > (canvas.height - 1.5 * maxfloweR)) {
            flower.speedY *= -1 * bounceAccel;
        }

        // If flower is too close to mouse pointer, adjust its speed to avoid it
        const dx = flower.x - mouseX;
        const dy = flower.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < maxfloweR * 3) {
            // Calculate unit vector pointing away from the mouse
            const unitX = dx / distance;
            const unitY = dy / distance;

            // Adjust flower speed to move away from the mouse
            flower.speedX += unitX * avoidanceSpeed;
            flower.speedY += unitY * avoidanceSpeed;

            // flower.speedX = Math.random() * 2 - 1 + avoidanceSpeed; // Random number between -1 and 1 for horizontal speed
            // flower.speedY = Math.random() * 2 - 1 + avoidanceSpeed; // Random number between -1 and 1 for vertical speed
        }

        // Bounce from other flowers ..................................................................................................
        data.forEach(otherFlower => {
            if (flower !== otherFlower) {
                const dx = flower.x - otherFlower.x;
                const dy = flower.y - otherFlower.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Check for collision
                if (distance < 2 * maxfloweR) {
                    // Calculate reflection angle
                    const reflectionAngle = Math.atan2(dy, dx);

                    // Calculate new speeds after collision
                    const totalSpeed = Math.sqrt(flower.speedX ** 2 + flower.speedY ** 2) * bounceAccel;
                    const newSpeedX = totalSpeed * Math.cos(reflectionAngle);
                    const newSpeedY = totalSpeed * Math.sin(reflectionAngle);

                    // Update flower speeds
                    flower.speedX = newSpeedX;
                    flower.speedY = newSpeedY;
                }
            }
        });

        // Final check -- if they are outside canva -- teleport somewhere 
        if (flower.x < 0 || flower.x > canvas.width) {
            flower.x = Math.random() * (canvas.width - 2 * maxfloweR) + maxfloweR;
            flower.speedX = (Math.random() * 2 - 1) * 2; // Random number between -1 and 1 for horizontal speed
        }
        if (flower.y < 0 || flower.y > canvas.height) {
            flower.y = Math.random() * (canvas.height- 2 * maxfloweR) + maxfloweR;
            flower.speedY = (Math.random() * 2 - 1) * 2; // Random number between -1 and 1 for vertical speed
        }
    });
}

// Function to arrange flowers  ///////////////////////////////////////////////////////////////////////////////////////////////
function arrangeFlowers() {
    // calculate space fro arranging flowers 
    const spaceX = canvas.width - 3 * maxfloweR;
    const spaceY = canvas.height - 3 * maxfloweR;
    // max art and tech skills = 6 ( 3+3 )
    const stepX = spaceX / 6; 
    const stepY = spaceY / 6; 

    data.forEach(flower => {
        //         _____ position ___   _____margin____   ___random offset_____________________
        flower.x = flower.art * stepX + 1.5 * maxfloweR + (Math.random() * 2 - 1) * stepX * 0.5 ;
        flower.y = canvas.height - (flower.tech * stepY + 0.5 * maxfloweR + (Math.random() * 2 - 1) * stepY * 0.5) ;
    });
    // Redraw the flowers with the new positions
    drawFlowers();
}

// Define a function to highlight flowers based on mouse click
function highlightFlowers(mouseX, mouseY) {
    // Reset highlighted attribute for all flowers
    data.forEach(flower => {
        flower.highlighted = false;
    });

    // Check if any flower is under the click
    data.forEach(flower => {
        const dx = mouseX - flower.x;
        const dy = mouseY - flower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If the flower is clicked, set its highlighted attribute to true
        if (distance <= maxfloweR) {
            flower.highlighted = true;
        }
    });

    // Redraw the flowers with updated highlights
    drawFlowers();
}


function animate() {
    // Update your animation logic here, e.g., updating positions, drawing, etc.
   // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw flowers
    drawFlowers();
    updateFlowerPositions();
    // Request the next animation frame
    requestAnimationFrame(animate);
}


//#################################################################################################################################
// Main function to set up and run the animation
//#################################################################################################################################
canvas = document.getElementById('myCanvas');
ctx = canvas.getContext('2d');
legendContainer = document.querySelector('.legend');

//Attach arrangeFlowers to a button click event
const arrangeButton = document.getElementById('arrangeButton');
arrangeButton.addEventListener('click', arrangeFlowers);

//Attach arrangeFlowers to a button click event
const randomizeButton = document.getElementById('randomizeButton');
randomizeButton.addEventListener('click', assignRandomProperties);

// Add event listener to track mouse movement
canvas.addEventListener('mousemove', function(event) {
    // Update mouseX and mouseY with the current mouse position
    mouseX = event.clientX - canvas.getBoundingClientRect().left;
    mouseY = event.clientY - canvas.getBoundingClientRect().top;
});

// Add event listener to track mouse clicks and highlight flowers 
canvas.addEventListener('click', function(event) {
    // Get mouse coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Highlight flowers based on mouse click
    highlightFlowers(mouseX, mouseY);
});

/*
// Add click event listener to the button for Interarctions 
const interactionsButton = document.getElementById('interactionsButton');
interactionsButton.addEventListener('click', function() {
    // Get the index of the current state in the interactionStates array
    const currentIndex = interactionStates.indexOf(interactionsType);

    // Determine the index of the next state, considering circular behavior
    const nextIndex = (currentIndex + 1) % interactionStates.length;

    // Update interactionsType to the next state
    interactionsType = interactionStates[nextIndex];

    // Update the button text to reflect the new state
    interactionsButton.textContent = `Interactions: ${interactionsType}`;
});
*/

// Add intro legend
const introLegend = document.createElement('span');
introLegend.classList.add('legend-intro');
introLegend.textContent = 'Skills:  ';
legendContainer.appendChild(introLegend);
// Create legend items for each skill
skills.forEach(skill => {
    // Create legend item container
    const legendItem = document.createElement('div');
    legendItem.classList.add('legend-item');
    // Create square representing skill color
    const square = document.createElement('div');
    square.classList.add('legend-square');
    square.style.backgroundColor = skillColors[skill];
    // Create text node for skill name
    const skillName = document.createTextNode(skill);
    // Append square and skill name to legend item
    legendItem.appendChild(square);
    legendItem.appendChild(skillName);
    // Append legend item to legend container
    legendContainer.appendChild(legendItem);
});

// Dealing with canvas size 
// Define the initial dimensions of the canvas
let canvasWidth = window.innerWidth * 0.95;
let canvasHeight = window.innerHeight * 0.85;
// Set the canvas dimensions
canvas.width = canvasWidth;
canvas.height = canvasHeight;
// Calculate maxfloweR based on the initial canvas dimensions
maxfloweR = Math.min(Math.max(Math.max(40*canvas.width/1920, 40*canvas.width/1080), minMaxfloweR), maxMaxfloweR);

// Redraw the canvas content when the window is resized
window.addEventListener('resize', function() {
    // Update the canvas dimensions
    canvasWidth = window.innerWidth * 0.95;
    canvasHeight = window.innerHeight * 0.85;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    // Recalculate maxfloweR based on the new canvas dimensions
    maxfloweR = Math.min(Math.max(Math.max(40*canvas.width/1920, 40*canvas.width/1080), minMaxfloweR), maxMaxfloweR);
    // Redraw the canvas content
    drawFlowers();
});

// console.log(canvas.width, canvas.height);
// Load flower data and start animation 
loadFlowerData();
