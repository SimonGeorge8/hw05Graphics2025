# Computer Graphics - Exercise 5 - WebGL Basketball Court

## Getting Started
1. Clone this repository to your local machine
2. Make sure you have Node.js installed
3. Start the local web server: `node index.js`
4. Open your browser and go to http://localhost:8000

## Complete Instructions
**All detailed instructions, requirements, and specifications can be found in:**
`basketball_exercise_instructions.html`

## Group Members
**MANDATORY: Add the full names of all group members here:**
- Oron Paz
- Simon Abadi
- Jesse Bondi

## Technical Details
- Run the server with: `node index.js`
- Access at http://localhost:8000 in your web browser

## Controls 
- arrow keys to move the ball around the court
- press 'r' or 'R' to reset the ball to the center of the court
- press 'o' or 'O' to toggle orbital camera control on or off
- press the spacebar ' ' to launch the ball (will shoot at the hoop it is further from)
- press 'w' to increase shot power and 's' to decrease shot power

## Physics system
- Gravity System: Ball experiences downward acceleration over time (-0.04 units/frame)
- Trajectory Physics: Ball follows arc based on initial velocity and gravity calculations

Collision Detection:
- Ground collision with bounce and energy loss (loses 40% of velocity)
- Wall collision with bounce 
- Hoop scoring detection with distance calculations

- Friction System: Ball loses horizontal velocity when bouncing (15% loss per bounce)
- Bounce Limiting: Ball stops after 9 bounces or when velocity drops below threshold (shot missed)

## Additional Features

Stadium Environment:
- Bleacher seating on three sides of the court (left, right ,and infront)
- Stadium enviorment includes extra ring that surrounds the court
- Changed backround to sky blue color

T-Shaped Electronic Scoreboard:
- LED style green score display
- Instant updates showing shots made on scoreboard
- Positioned in front of bleachers

Visual Effects:
- Confetti particle system for successful shots
- Celebration text display

## Known Issues or Limitations
- Score detection not super consistent regarding the ball arcing down towards the net
- Ex: sometimes score will count despite it appearing as the ball coming not directly from above