import {OrbitControls} from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Set background color
scene.background = new THREE.Color(0x000000);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// Enable shadows
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

// Game state variables
let basketball;
let isOrbitEnabled = true;
let shotPower = 50; // 0-100%
let score = 0;
let shotsAttempted = 0;
let shotsMade = 0;
let isInFlight = false;
let gameMessage = "";
let lastScoredTime = 0;
let bounceCount = 0; // Track number of bounces

// Physics variables
const gravity = -20; // Increased from -15 to -20 for even faster physics
let ballVelocity = new THREE.Vector3(0, 0, 0);
let ballPosition = new THREE.Vector3(0, 3, 0);
const groundLevel = 0.75; // Basketball radius
const bounceRestitution = 0.7;
const rimPositions = [
  new THREE.Vector3(-12, 10, 0), // Left hoop
  new THREE.Vector3(12, 10, 0)   // Right hoop
];

// Input state tracking
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  KeyW: false,
  KeyS: false
};

// UI elements
let powerBarElement, scoreElement, messageElement, instructionsElement;

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

// Create basketball court (from HW5 with modifications)
function createBasketballCourt() {
  // Court floor
  const courtGeometry = new THREE.BoxGeometry(30, 0.2, 15);
  const courtMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xc68642,  // Brown wood color
    shininess: 50
  });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);

  defineLines(scene);

  // Create hoops with collision detection metadata
  createHoop(scene, true);  //left hoop
  createHoop(scene, false);  //right hoop

  basketball = createBasketball();
}

function defineLines(scene){
  const line_M = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  const center_circle_G = new THREE.RingGeometry(1.7, 1.5, 32);
  const center_circle_M = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const center_circle = new THREE.Mesh(center_circle_G, center_circle_M);
  center_circle.rotation.x = Math.PI / 2;
  center_circle.position.y = 0.12;
  scene.add(center_circle);

  const center_line_G = new THREE.BoxGeometry(0.2, 0.1, 15);
  const center_line = new THREE.Mesh(center_line_G, line_M);
  center_line.position.y = 0.10;
  scene.add(center_line);
  
  createThreePointLines(scene, 7.5, true);
  createThreePointLines(scene, 7.5, false);
}

function createThreePointLines(target_scene, arc_radius, is_left_side) {
  const line_material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const segments_count = 50;
  
  let center_x_position;
  let angle_direction;
  
  if (is_left_side) {
    center_x_position = -13;
    angle_direction = -1;
  } else {
    center_x_position = 13;
    angle_direction = 1;
  }
  
  const arc_points = [];
  for (let point_index = 0; point_index <= segments_count; point_index++) {
    const base_angle = Math.PI / 2;
    const angle_offset = (Math.PI * point_index / segments_count) * angle_direction;
    const current_angle = base_angle + angle_offset;
    
    const x_position = center_x_position + arc_radius * Math.cos(current_angle);
    const z_position = arc_radius * Math.sin(current_angle);
    
    arc_points.push(new THREE.Vector3(x_position, 0.11, z_position));
  }
  
  const arc_geometry = new THREE.BufferGeometry().setFromPoints(arc_points);
  const three_point_line = new THREE.Line(arc_geometry, line_material);
  target_scene.add(three_point_line);
}

function createHoop(target_scene, facing_right) {
  const rim_height = 10;
  
  let rim_offset_x;
  if (facing_right) {
    rim_offset_x = 1;
  } else {
    rim_offset_x = -1;
  }
  
  let hoop_x;
  if (facing_right) {
    hoop_x = -13;
  } else {
    hoop_x = 13;
  }
  
  const hoop_z = 0;
  
  // Create backboard with collision detection metadata
  const backboard_mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 4, 7), // thickness, height, width
    new THREE.MeshPhongMaterial({color: 0xffffff, transparent: true, opacity: 0.85}));
  backboard_mesh.position.set(hoop_x, rim_height, hoop_z);
  backboard_mesh.castShadow = true;
  backboard_mesh.userData = {
    isBackboard: true,
    backboardPosition: new THREE.Vector3(hoop_x, rim_height, hoop_z),
    width: 0.3,
    height: 4,
    depth: 7
  };
  target_scene.add(backboard_mesh);
  
  let support_x;
  if (facing_right) {
    support_x = hoop_x - 1;
  } else {
    support_x = hoop_x + 1;
  }
  
  const arm_distance = Math.abs(support_x - hoop_x);
  
  const pole_mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, rim_height + 3.5, 20), new THREE.MeshPhongMaterial({ color: 0x4b4b4b}));
  pole_mesh.position.set(support_x, (rim_height + 5)/2, hoop_z);
  pole_mesh.castShadow = true;
  target_scene.add(pole_mesh);
  
  // Create rim with scoring detection metadata
  const basket_rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 16, 32), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
  basket_rim.position.set(hoop_x + rim_offset_x, rim_height, hoop_z);
  basket_rim.rotation.x = Math.PI / 2;
  basket_rim.castShadow = true;
  basket_rim.userData = { 
    isRim: true, 
    rimPosition: new THREE.Vector3(hoop_x + rim_offset_x, rim_height, hoop_z),
    rimRadius: 0.8
  };
  target_scene.add(basket_rim);
  
  const string_material = new THREE.MeshPhongMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });
  
  for (let string_num = 0; string_num < 30; string_num++) {
    const angle = (Math.PI * 2 / 30) * string_num;
    const string_x = hoop_x + rim_offset_x + Math.cos(angle) * 0.75;
    const string_z = hoop_z + Math.sin(angle) * 0.75;
    
    const cylinder_geometry = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6);
    const string_mesh = new THREE.Mesh(cylinder_geometry, string_material);
    
    string_mesh.position.set(string_x, rim_height - 0.6, string_z);
    target_scene.add(string_mesh);
  }
  
  const brace_length = Math.sqrt(arm_distance * arm_distance + 16);
  const diagonal_brace = new THREE.Mesh(new THREE.BoxGeometry(brace_length, 0.2, 0.2), new THREE.MeshPhongMaterial({ color: 0x444444 }));
  const brace_angle = Math.atan2(4, arm_distance);
  
  if (facing_right) {
    diagonal_brace.rotation.z = -brace_angle;
  } else {
    diagonal_brace.rotation.z = brace_angle;
  }
  
  diagonal_brace.position.set((support_x + hoop_x) / 2, rim_height, hoop_z);
  diagonal_brace.castShadow = true;
  target_scene.add(diagonal_brace);
  
  const foundation = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, 0.4, 30), new THREE.MeshPhongMaterial({ color: 0x252525 }));
  foundation.position.set(support_x, 0.3, hoop_z);
  foundation.castShadow = true;
  target_scene.add(foundation);
}

// Create basketball with physics capabilities
function createBasketball() {
  const sphere_radius = 0.75;
  const basketball_geometry = new THREE.SphereGeometry(sphere_radius, 32, 32);
  const basketball_material = new THREE.MeshPhongMaterial({ 
    color: 0xff8c00, 
    shininess: 25 
  });
  
  const basketball_mesh = new THREE.Mesh(basketball_geometry, basketball_material);
  basketball_mesh.castShadow = true;
  
  const seam_material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
  const seam_radius = sphere_radius + 0.01;
  const seam_thickness = 0.025;
  
  const horizontal_seam_geo = new THREE.TorusGeometry(seam_radius, seam_thickness, 12, 24);
  const vertical_seam_1_geo = new THREE.TorusGeometry(seam_radius, seam_thickness, 12, 24);
  const vertical_seam_2_geo = new THREE.TorusGeometry(seam_radius, seam_thickness, 12, 24);
  
  const horizontal_seam = new THREE.Mesh(horizontal_seam_geo, seam_material);
  const vertical_seam_1 = new THREE.Mesh(vertical_seam_1_geo, seam_material);
  const vertical_seam_2 = new THREE.Mesh(vertical_seam_2_geo, seam_material);
  
  horizontal_seam.rotation.set(Math.PI / 2, 0, 0);
  vertical_seam_1.rotation.set(0, Math.PI / 2, 0);
  vertical_seam_2.rotation.set(0, 0, 0);
  
  const ball_group = new THREE.Group();
  ball_group.add(basketball_mesh);
  ball_group.add(horizontal_seam);
  ball_group.add(vertical_seam_1);
  ball_group.add(vertical_seam_2);
  
  ball_group.position.copy(ballPosition);
  ball_group.userData = { radius: sphere_radius };
  
  scene.add(ball_group);
  
  return ball_group;
}

// Physics system implementation
function updatePhysics(deltaTime) {
  if (!isInFlight) return;
  
  // Apply gravity
  ballVelocity.y += gravity * deltaTime;
  
  // Store previous position for collision detection
  const prevPosition = ballPosition.clone();
  
  // Update position based on velocity
  ballPosition.x += ballVelocity.x * deltaTime;
  ballPosition.y += ballVelocity.y * deltaTime;
  ballPosition.z += ballVelocity.z * deltaTime;
  
  // Check backboard and rim collisions
  checkBackboardCollision(prevPosition);
  
  // Court boundary collisions with bouncing
  const ballRadius = 0.75;
  
  // X-axis boundaries (left/right walls)
  if (ballPosition.x <= -15 + ballRadius) {
    ballPosition.x = -15 + ballRadius;
    ballVelocity.x = -ballVelocity.x * 0.6; // Bounce with energy loss
    console.log('Left boundary collision!');
  } else if (ballPosition.x >= 15 - ballRadius) {
    ballPosition.x = 15 - ballRadius;
    ballVelocity.x = -ballVelocity.x * 0.6; // Bounce with energy loss
    console.log('Right boundary collision!');
  }
  
  // Z-axis boundaries (front/back walls)
  if (ballPosition.z <= -7.5 + ballRadius) {
    ballPosition.z = -7.5 + ballRadius;
    ballVelocity.z = -ballVelocity.z * 0.6; // Bounce with energy loss
    console.log('Back boundary collision!');
  } else if (ballPosition.z >= 7.5 - ballRadius) {
    ballPosition.z = 7.5 - ballRadius;
    ballVelocity.z = -ballVelocity.z * 0.6; // Bounce with energy loss
    console.log('Front boundary collision!');
  }
  
  // Ground collision detection and bouncing
  if (ballPosition.y <= groundLevel) {
    ballPosition.y = groundLevel;
    ballVelocity.y = -ballVelocity.y * bounceRestitution;
    ballVelocity.x *= 0.85; // Apply friction
    ballVelocity.z *= 0.85;
    
    bounceCount++; // Increment bounce counter
    console.log('Ball bounced! Count:', bounceCount, 'New velocity:', ballVelocity);
    
    // Reset ball after 4 bounces - ONLY WAY TO MISS NOW
    if (bounceCount >= 4) {
      console.log('Ball reset after 4 bounces - MISSED SHOT');
      isInFlight = false;
      ballVelocity.set(0, 0, 0);
      bounceCount = 0;
      
      // Count as missed shot ONLY if it was an active shot attempt
      if (gameMessage === "Shot taken!") {
        gameMessage = "MISSED SHOT - 4 bounces";
        setTimeout(() => {
          if (gameMessage === "MISSED SHOT - 4 bounces") {
            gameMessage = "";
          }
        }, 2500);
        updateUI();
      }
      return;
    }
    
    // Stop ball if velocity is too low - but DON'T count as miss
    if (Math.abs(ballVelocity.y) < 1.2 && 
        Math.abs(ballVelocity.x) < 0.8 && 
        Math.abs(ballVelocity.z) < 0.8) {
      isInFlight = false;
      ballVelocity.set(0, 0, 0);
      bounceCount = 0;
      console.log('Ball stopped - no miss counted');
      
      // Just clear the shot message, don't count as miss
      if (gameMessage === "Shot taken!") {
        gameMessage = "";
        updateUI();
      }
    }
  }
  
  // Safety check - if ball goes too high, bring it down
  if (ballPosition.y > 25) {
    ballPosition.y = 25;
    ballVelocity.y = Math.min(ballVelocity.y, 0);
  }
  
  // Update basketball visual position
  basketball.position.copy(ballPosition);
  
  // Proportional ball rotation during flight based on velocity
  if (ballVelocity.length() > 0.1) {
    const rotationSpeed = ballVelocity.length() * 0.1; // Proportional to velocity
    
    // Rotate based on movement direction during flight
    const velocityDirection = ballVelocity.clone().normalize();
    
    // X-axis rotation for forward/backward movement
    basketball.rotation.x += velocityDirection.z * rotationSpeed * deltaTime;
    // Z-axis rotation for left/right movement  
    basketball.rotation.z += -velocityDirection.x * rotationSpeed * deltaTime;
    // Y-axis rotation for spin effect
    basketball.rotation.y += rotationSpeed * deltaTime * 0.5;
  }
  
  // Check for scoring
  checkScoring();
}

function checkBackboardCollision(prevPosition) {
  const ballRadius = 0.75;
  
  // Left backboard (x = -13)
  if ((prevPosition.x > -13.5 && ballPosition.x <= -13.5) || 
      (prevPosition.x < -12.5 && ballPosition.x >= -12.5)) {
    if (ballPosition.y >= 8 && ballPosition.y <= 12 && Math.abs(ballPosition.z) <= 3.5) {
      ballVelocity.x = -ballVelocity.x * 0.8; // Better bounce retention
      ballPosition.x = prevPosition.x; // Reset to previous safe position
      console.log('Left backboard collision! Velocity:', ballVelocity);
    }
  }
  
  // Right backboard (x = 13)
  if ((prevPosition.x < 13.5 && ballPosition.x >= 13.5) || 
      (prevPosition.x > 12.5 && ballPosition.x <= 12.5)) {
    if (ballPosition.y >= 8 && ballPosition.y <= 12 && Math.abs(ballPosition.z) <= 3.5) {
      ballVelocity.x = -ballVelocity.x * 0.8; // Better bounce retention
      ballPosition.x = prevPosition.x; // Reset to previous safe position
      console.log('Right backboard collision! Velocity:', ballVelocity);
    }
  }
  
  // Check rim collision for bouncing (not just scoring)
  for (let rimPos of rimPositions) {
    const horizontalDistance = Math.sqrt(
      Math.pow(ballPosition.x - rimPos.x, 2) + 
      Math.pow(ballPosition.z - rimPos.z, 2)
    );
    
    // Ball hits rim - bounce off
    if (horizontalDistance <= 1.0 && Math.abs(ballPosition.y - rimPos.y) <= 0.5) {
      // Bounce ball away from rim center
      const rimDirection = new THREE.Vector3().subVectors(ballPosition, rimPos).normalize();
      
      // Apply bounce effect
      ballVelocity.x += rimDirection.x * 3;
      ballVelocity.z += rimDirection.z * 3;
      ballVelocity.y *= 0.7; // Reduce vertical velocity
      
      console.log('Rim collision bounce! New velocity:', ballVelocity);
    }
  }
}

function checkScoring() {
  // Only score if ball is moving downward (proper arc) and at rim level
  if (ballVelocity.y >= -1 || ballPosition.y < 9 || ballPosition.y > 11) return;
  
  for (let rimPos of rimPositions) {
    const horizontalDistance = Math.sqrt(
      Math.pow(ballPosition.x - rimPos.x, 2) + 
      Math.pow(ballPosition.z - rimPos.z, 2)
    );
    
    // Score ONLY when ball hits rim while arcing downward - no other miss conditions
    if (horizontalDistance <= 1.2 && gameMessage === "Shot taken!" && ballVelocity.y < -1) { 
      score += 2;
      shotsMade++;
      gameMessage = "SHOT MADE! 🏀";
      lastScoredTime = Date.now();
      
      console.log('GOAL! Ball hit rim while arcing downward! Score:', score, 'Velocity Y:', ballVelocity.y);
      
      // DON'T reset ball position - let it continue with physics
      // Just award the points and continue the game
      
      setTimeout(() => {
        if (Date.now() - lastScoredTime >= 2000) {
          gameMessage = "";
        }
      }, 2000);
      
      updateUI();
      return;
    }
    
    // If ball hits rim but not arcing downward, just let it continue - no miss message
    if (horizontalDistance <= 1.2 && gameMessage === "Shot taken!") {
      console.log('Ball hit rim but not arcing downward - continuing play');
      // Ball continues with physics, no scoring, no miss message
    }
  }
}

function shootBasketball() {
  if (isInFlight) return;
  
  shotsAttempted++;
  isInFlight = true;
  bounceCount = 0; // Reset bounce counter for new shot
  
  // Find the nearest hoop
  let targetRim = rimPositions[0];
  let minDistance = ballPosition.distanceTo(rimPositions[0]);
  
  for (let rim of rimPositions) {
    const distance = ballPosition.distanceTo(rim);
    if (distance < minDistance) {
      minDistance = distance;
      targetRim = rim;
    }
  }
  
  // Calculate direction to target
  const direction = new THREE.Vector3().subVectors(targetRim, ballPosition);
  const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
  const heightDifference = direction.y;
  
  // Better velocity calculation
  const powerMultiplier = shotPower / 100;
  const baseVelocity = 12 + (powerMultiplier * 15); // Changed back as requested
  
  // Calculate launch angle for nice arc (30-60 degrees based on distance and power)
  const distanceFactor = Math.min(horizontalDistance / 20, 1);
  const launchAngle = (Math.PI / 6) + (distanceFactor * Math.PI / 6); // 30-60 degrees
  
  // Calculate velocity components
  const horizontalVel = baseVelocity * Math.cos(launchAngle);
  const verticalVel = baseVelocity * Math.sin(launchAngle);
  
  // Normalize horizontal direction
  const horizontalDir = new THREE.Vector3(direction.x, 0, direction.z).normalize();
  
  // Set velocity
  ballVelocity.x = horizontalDir.x * horizontalVel;
  ballVelocity.z = horizontalDir.z * horizontalVel;
  ballVelocity.y = verticalVel;
  
  console.log('Shot fired! Velocity:', ballVelocity, 'Power:', shotPower, 'Attempts:', shotsAttempted);
  
  gameMessage = "Shot taken!";
  
  // No more timeout misses - only 4-bounce misses or scores
  updateUI();
}

function resetBasketball() {
  // Reset ball to center court
  ballPosition.set(0, 3, 0);
  ballVelocity.set(0, 0, 0);
  basketball.position.copy(ballPosition);
  basketball.rotation.set(0, 0, 0);
  isInFlight = false;
  bounceCount = 0; // Reset bounce counter
  shotPower = 50;
  gameMessage = "Ball reset to center court";
  setTimeout(() => gameMessage = "", 1500);
  updateUI();
}

function moveBasketball(direction, deltaTime) {
  if (isInFlight) return; // Can't move ball during flight
  
  const moveSpeed = 20; // Increased from 15 to 20 for even faster movement
  const movement = new THREE.Vector3();
  
  switch(direction) {
    case 'left':
      movement.x = -moveSpeed * deltaTime;
      break;
    case 'right':
      movement.x = moveSpeed * deltaTime;
      break;
    case 'forward':
      movement.z = -moveSpeed * deltaTime;
      break;
    case 'backward':
      movement.z = moveSpeed * deltaTime;
      break;
  }
  
  ballPosition.add(movement);
  
  // Keep within court boundaries
  ballPosition.x = Math.max(-14, Math.min(14, ballPosition.x));
  ballPosition.z = Math.max(-7, Math.min(7, ballPosition.z));
  
  basketball.position.copy(ballPosition);
  
  // Fixed ball rotation for all directions during movement
  if (movement.length() > 0) {
    const rotationAmount = movement.length() * 1.0; // Increased for more visible rotation
    
    // Proper rotation for all directions
    if (movement.x !== 0) {
      // Left/Right movement - rotate around Z axis
      basketball.rotation.z += movement.x > 0 ? -rotationAmount : rotationAmount;
    }
    if (movement.z !== 0) {
      // Forward/Backward movement - rotate around X axis  
      basketball.rotation.x += movement.z > 0 ? rotationAmount : -rotationAmount;
    }
  }
}

function adjustShotPower(increase) {
  const adjustment = 5; // Increased from 3 to 5 for faster power adjustment
  if (increase) {
    shotPower = Math.min(100, shotPower + adjustment);
  } else {
    shotPower = Math.max(0, shotPower - adjustment);
  }
  updateUI();
}

// UI Management Functions
function createUI() {
  // Enhanced instructions panel
  instructionsElement = document.createElement('div');
  instructionsElement.style.position = 'absolute';
  instructionsElement.style.bottom = '20px';
  instructionsElement.style.left = '20px';
  instructionsElement.style.color = 'white';
  instructionsElement.style.fontSize = '14px';
  instructionsElement.style.fontFamily = 'Arial, sans-serif';
  instructionsElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  instructionsElement.style.padding = '15px';
  instructionsElement.style.borderRadius = '10px';
  instructionsElement.style.border = '2px solid #3498db';
  instructionsElement.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #3498db;">🏀 Basketball Controls</h3>
    <p style="margin: 5px 0;">⬅️➡️⬆️⬇️ Move Basketball</p>
    <p style="margin: 5px 0;">W/S - Adjust Shot Power</p>
    <p style="margin: 5px 0;">SPACE - Shoot Basketball</p>
    <p style="margin: 5px 0;">R - Reset Ball Position</p>
    <p style="margin: 5px 0;">O - Toggle Orbit Camera</p>
  `;
  document.body.appendChild(instructionsElement);

  // Power bar container with enhanced styling
  const powerBarContainer = document.createElement('div');
  powerBarContainer.style.position = 'absolute';
  powerBarContainer.style.bottom = '20px';
  powerBarContainer.style.right = '20px';
  powerBarContainer.style.width = '40px';
  powerBarContainer.style.height = '200px';
  powerBarContainer.style.border = '3px solid white';
  powerBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  powerBarContainer.style.borderRadius = '10px';
  document.body.appendChild(powerBarContainer);

  // Dynamic power bar
  powerBarElement = document.createElement('div');
  powerBarElement.style.position = 'absolute';
  powerBarElement.style.bottom = '0';
  powerBarElement.style.width = '100%';
  powerBarElement.style.backgroundColor = '#27ae60';
  powerBarElement.style.height = '50%';
  powerBarElement.style.transition = 'height 0.2s ease, background-color 0.2s ease';
  powerBarElement.style.borderRadius = '0 0 7px 7px';
  powerBarContainer.appendChild(powerBarElement);

  // Power label
  const powerLabel = document.createElement('div');
  powerLabel.style.position = 'absolute';
  powerLabel.style.bottom = '230px';
  powerLabel.style.right = '15px';
  powerLabel.style.color = 'white';
  powerLabel.style.fontSize = '16px';
  powerLabel.style.fontFamily = 'Arial, sans-serif';
  powerLabel.style.fontWeight = 'bold';
  powerLabel.innerHTML = '💪 Power';
  document.body.appendChild(powerLabel);

  // Enhanced score display
  scoreElement = document.createElement('div');
  scoreElement.style.position = 'absolute';
  scoreElement.style.top = '20px';
  scoreElement.style.right = '20px';
  scoreElement.style.color = 'white';
  scoreElement.style.fontSize = '16px';
  scoreElement.style.fontFamily = 'Arial, sans-serif';
  scoreElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  scoreElement.style.padding = '20px';
  scoreElement.style.borderRadius = '10px';
  scoreElement.style.textAlign = 'center';
  scoreElement.style.border = '2px solid #e74c3c';
  scoreElement.style.minWidth = '200px';
  document.body.appendChild(scoreElement);

  // Game message display with enhanced styling
  messageElement = document.createElement('div');
  messageElement.style.position = 'absolute';
  messageElement.style.top = '50%';
  messageElement.style.left = '50%';
  messageElement.style.transform = 'translate(-50%, -50%)';
  messageElement.style.color = '#f1c40f';
  messageElement.style.fontSize = '28px';
  messageElement.style.fontFamily = 'Arial, sans-serif';
  messageElement.style.fontWeight = 'bold';
  messageElement.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
  messageElement.style.pointerEvents = 'none';
  messageElement.style.textAlign = 'center';
  messageElement.style.zIndex = '1000';
  document.body.appendChild(messageElement);

  updateUI();
}

function updateUI() {
  // Update power bar with color coding
  if (powerBarElement) {
    powerBarElement.style.height = shotPower + '%';
    if (shotPower < 25) {
      powerBarElement.style.backgroundColor = '#e74c3c'; // Red
    } else if (shotPower < 50) {
      powerBarElement.style.backgroundColor = '#f39c12'; // Orange
    } else if (shotPower < 75) {
      powerBarElement.style.backgroundColor = '#f1c40f'; // Yellow
    } else {
      powerBarElement.style.backgroundColor = '#27ae60'; // Green
    }
  }

  // Update comprehensive score display
  if (scoreElement) {
    const accuracy = shotsAttempted > 0 ? ((shotsMade / shotsAttempted) * 100).toFixed(1) : 0;
    scoreElement.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #e74c3c;">🏀 Game Statistics</h3>
      <p style="margin: 8px 0; font-size: 18px;"><strong>Score: ${score}</strong></p>
      <p style="margin: 8px 0;">Shots Made: ${shotsMade}</p>
      <p style="margin: 8px 0;">Attempts: ${shotsAttempted}</p>
      <p style="margin: 8px 0;">Accuracy: ${accuracy}%</p>
      <p style="margin: 8px 0;">Power: ${shotPower}%</p>
    `;
  }

  // Update game messages
  if (messageElement) {
    messageElement.innerHTML = gameMessage;
    if (gameMessage.includes("SHOT MADE")) {
      messageElement.style.color = '#27ae60';
      messageElement.style.fontSize = '32px';
    } else if (gameMessage.includes("MISSED")) {
      messageElement.style.color = '#e74c3c';
      messageElement.style.fontSize = '24px';
    } else {
      messageElement.style.color = '#f1c40f';
      messageElement.style.fontSize = '20px';
    }
  }
}

// Event handling
function handleKeyDown(e) {
  keys[e.code] = true;
  
  if (e.key === "o" || e.key === "O") {
    isOrbitEnabled = !isOrbitEnabled;
  }
  
  if (e.key === " ") {
    e.preventDefault();
    shootBasketball();
  }
  
  if (e.key === "r" || e.key === "R") {
    resetBasketball();
  }
}

function handleKeyUp(e) {
  keys[e.code] = false;
}

// Process continuous input
function processInput(deltaTime) {
  if (keys.ArrowLeft) moveBasketball('left', deltaTime);
  if (keys.ArrowRight) moveBasketball('right', deltaTime);
  if (keys.ArrowUp) moveBasketball('forward', deltaTime);
  if (keys.ArrowDown) moveBasketball('backward', deltaTime);
  if (keys.KeyW) adjustShotPower(true);
  if (keys.KeyS) adjustShotPower(false);
}

// Initialize everything
createBasketballCourt();
createUI();

// Set camera position for optimal view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Setup orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Animation loop with proper timing
let lastTime = 0;

function animate(currentTime) {
  requestAnimationFrame(animate);
  
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.02); // Cap deltaTime
  lastTime = currentTime;
  
  // Process input
  processInput(deltaTime);
  
  // Update physics
  updatePhysics(deltaTime);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate(0);