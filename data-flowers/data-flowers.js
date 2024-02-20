let data = []; // Global variable to store the dataset
let canvas; // Global variables to store canvas and its context
let legendContainer; // Legend container
let ctx;

// Add event listener to track mouse movement
let mouseX;
let mouseY;

const avoidanceSpeed = 0.15; // Speed to avoid mouse pointer  
const slowDown= 0.05;        // Slowdown constant 

const petalWidth= 2/3;        // Petal width as a proportion of a sector 

const skills = ['data', 'dataviz', 'drawing', 'handicraft'];
const maxfloweR = 40;
const skillColors = {
    'data'      : '#2D5DA1',    // Data -- Medium Sapphire, rest is tetradic https://www.colorhexa.com/2d5da1
    'dataviz'   : '#2DA171',    // DataViz 
    'drawing'   : '#A12D5D',    // Drawing
    'handicraft': '#A1712D'     // Handicraft
};

// Function to load flower data /////////////////////////////////////////////////////////////////////////////////////////////////
function loadFlowerData() {
    return fetch('data-flowers.json')
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
            ctx.arc(flower.x, flower.y, maxfloweR + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.33)'; // Yellow color with opacity
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.closePath();
        }
        // Draw petals for each skill
        let startAngle = 0;
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
            flower.speedX *= -1;
        }
        if (flower.y < 1.5 * maxfloweR || flower.y > (canvas.height - 1.5 * maxfloweR)) {
            flower.speedY *= -1;
        }

        // If flower is too close to mouse pointer, adjust its speed to avoid it
        const dx = flower.x - mouseX;
        const dy = flower.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < maxfloweR * 2) {
            // Calculate unit vector pointing away from the mouse
            const unitX = dx / distance;
            const unitY = dy / distance;

            // Adjust flower speed to move away from the mouse
            flower.speedX += unitX * avoidanceSpeed;
            flower.speedY += unitY * avoidanceSpeed;

            // flower.speedX = Math.random() * 2 - 1 + avoidanceSpeed; // Random number between -1 and 1 for horizontal speed
            // flower.speedY = Math.random() * 2 - 1 + avoidanceSpeed; // Random number between -1 and 1 for vertical speed

        }

        // Bounce from other flowers
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
                    const totalSpeed = Math.sqrt(flower.speedX ** 2 + flower.speedY ** 2);
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

// console.log(canvas.width, canvas.height);
// Load flower data and start animation 
loadFlowerData();
