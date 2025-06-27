let totalScore = 0;
import {OrbitControls} from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x87CEEB); // background color (sky)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

let scoreboardTextMesh;

// Create basketball court
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

  defineLines(scene)

  // defining hoops 
  createHoop(scene, true);  //left hoop
  createHoop(scene, false);  //right hoop (its all about perspective tho if you really think about it)

  createBasketball();

  createStadium();
  
  createScoreboard();
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
  
  const backboard_mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 4, 7), // thickness, height, widht
    new THREE.MeshPhongMaterial({color: 0xffffff, transparent: true, opacity: 0.85}));
  backboard_mesh.position.set(hoop_x, rim_height, hoop_z);
  backboard_mesh.castShadow = true;
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
  
  const basket_rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 16, 32), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
  basket_rim.position.set(hoop_x + rim_offset_x, rim_height, hoop_z);
  basket_rim.rotation.x = Math.PI / 2;
  basket_rim.castShadow = true;
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

// create basketball
let basketball;

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
  
  ball_group.position.set(0, 3, 0);
  
  scene.add(ball_group);
  basketball = ball_group;
}

function createStadium() {
  const stadiumFloor = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 1, 32), new THREE.MeshPhongMaterial({ color: 0x3c3c3c }));
  stadiumFloor.position.y = -0.5;
  stadiumFloor.receiveShadow = true;
  scene.add(stadiumFloor);
  
  // Left side bleachers (behind left hoop)
  for (let tier = 0; tier < 8; tier++) {
    const seatGeometry = new THREE.BoxGeometry(2, 1, 40); 
    const seatMaterial = new THREE.MeshPhongMaterial({ 
      color: tier % 2 === 0 ? 0x4a5568 : 0x2d3748 
    });
    const seats = new THREE.Mesh(seatGeometry, seatMaterial);
    
    seats.position.x = -20 - tier; 
    seats.position.z = 0; 
    seats.position.y = tier; 
    
    seats.castShadow = true;
    scene.add(seats);
  }

  // Front side bleachers (infront of camera when opening page)
  for (let tier = 0; tier < 8; tier++) {
    const seatGeometry = new THREE.BoxGeometry(40, 2, 1);
    const seatMaterial = new THREE.MeshPhongMaterial({ 
      color: tier % 2 === 0 ? 0x4a5568 : 0x2d3748
    });
    const seats = new THREE.Mesh(seatGeometry, seatMaterial);
    
    seats.position.x = 0; 
    seats.position.z = -20 - tier; 
    seats.position.y = tier; 
    
    seats.castShadow = true;
    scene.add(seats);
  }
  
  // Right side bleachers (behind right hoop)
  for (let tier = 0; tier < 8; tier++) {
    const seatGeometry = new THREE.BoxGeometry(2, 1, 40);
    const seatMaterial = new THREE.MeshPhongMaterial({ 
      color: tier % 2 === 0 ? 0x4a5568 : 0x2d3748
    });
    const seats = new THREE.Mesh(seatGeometry, seatMaterial);
    
    seats.position.x = 20 + tier;
    seats.position.z = 0; 
    seats.position.y = tier; 
    
    seats.castShadow = true;
    scene.add(seats);
  }
}

function createScoreboard() {
  const scoreboardX = 0; 
  const scoreboardY = 12; 
  const scoreboardZ = -32; 
  
  // vertical post 
  const postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 16);
  const postMaterial = new THREE.MeshPhongMaterial({ color: 0x2c2c2c });
  const post = new THREE.Mesh(postGeometry, postMaterial);
  post.position.set(scoreboardX, scoreboardY / 2, scoreboardZ);
  post.castShadow = true;
  scene.add(post);
  
  // horizontal board (T top)
  const boardGeometry = new THREE.BoxGeometry(12, 4, 1);
  const boardMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x1a1a1a, 
    shininess: 10
  });
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.set(scoreboardX, scoreboardY + 2, scoreboardZ);
  board.castShadow = true;
  scene.add(board);
  
  const borderGeometry = new THREE.BoxGeometry(12.5, 4.5, 0.8);
  const borderMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
  const border = new THREE.Mesh(borderGeometry, borderMaterial);
  border.position.set(scoreboardX, scoreboardY + 2, scoreboardZ + 0.1);
  border.castShadow = true;
  scene.add(border);
  
  for (let i = 0; i < 4; i++) {
    const ledPanelGeometry = new THREE.BoxGeometry(2.5, 3, 0.2);
    const ledPanelMaterial = new THREE.MeshPhongMaterial({color: 0x001100, emissive: 0x002200});
    const ledPanel = new THREE.Mesh(ledPanelGeometry, ledPanelMaterial);
    ledPanel.position.set(scoreboardX + (i - 1.5) * 3, scoreboardY + 2, scoreboardZ + 0.6);
    scene.add(ledPanel);
  }
  
  updateScoreboardDisplay(0);
}

function updateScoreboardDisplay(score) {
  if (scoreboardTextMesh) {
    scene.remove(scoreboardTextMesh);
  }
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;
  
  context.fillStyle = '#000000'; 
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  context.fillStyle = '#00FF00';
  context.font = 'bold 80px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  //glow effect
  context.shadowColor = '#00FF00';
  context.shadowBlur = 10;
  
  const scoreText = score.toString().padStart(2, '0'); 
  context.fillText(scoreText, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  const textMaterial = new THREE.MeshPhongMaterial({map: texture, transparent: true, emissive: 0x003300, emissiveIntensity: 0.3});
  
  const textGeometry = new THREE.PlaneGeometry(10, 2.5);
  scoreboardTextMesh = new THREE.Mesh(textGeometry, textMaterial);
  
  scoreboardTextMesh.position.set(0, 14, -31); // put text in front of the board
  scene.add(scoreboardTextMesh);
}

// Create the elements
createBasketballCourt();

const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

//track stats
const gameStats = {
    totalScore: 0,
    shotsAttempted: 0,
    shotsMade: 0,
    shootingPercentage: 0.0
};

// physics system
const ballPhysics = {
    currentPos: new THREE.Vector3(0, 3, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    gravity: new THREE.Vector3(0, -0.04, 0),
    isLaunched: false,
    isPlayerControlled: true,
    shotStrength: 0.5,
    horizontalDirection: 0,
    verticalDirection: 0,
    bounceCounter: 0,
    maxBounceLimit: 9,
    lastScoredTime: 0,
    shotInProgress: false
};

const ballRotation = {
    previousPosition: new THREE.Vector3(0, 3, 0),
    rotationMultiplier: 0.1
};

// confetti for succesful shot
const confettiParticles = [];

const hoopTargets = [
    { x: -12, y: 10, z: 0, radius: 0.8 },
    { x: 12, y: 10, z: 0, radius: 0.8 }
];

const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '25px';
scoreDisplay.style.left = '25px';
scoreDisplay.style.color = 'white';
scoreDisplay.style.fontSize = '20px';
scoreDisplay.style.fontFamily = 'Arial, sans-serif';
scoreDisplay.style.background = 'rgba(0,0,0,0.75)';
scoreDisplay.style.padding = '12px';
scoreDisplay.style.borderRadius = '5px';
scoreDisplay.innerHTML = `
    <h3>Game Stats</h3>
    <div>Score: <span id="currentScore">0</span></div>
    <div>Attempts: <span id="totalAttempts">0</span></div>
    <div>Made: <span id="totalMade">0</span></div>
    <div>Accuracy: <span id="accuracy">0.0</span>%</div>
`;
document.body.appendChild(scoreDisplay);

// Instructions display
const instructionsDisplay = document.createElement('div');
instructionsDisplay.style.position = 'absolute';
instructionsDisplay.style.bottom = '25px';
instructionsDisplay.style.left = '25px';
instructionsDisplay.style.color = 'white';
instructionsDisplay.style.fontSize = '14px';
instructionsDisplay.style.fontFamily = 'Arial, sans-serif';
instructionsDisplay.style.background = 'rgba(0,0,0,0.8)';
instructionsDisplay.style.padding = '10px';
instructionsDisplay.style.borderRadius = '5px';
instructionsDisplay.innerHTML = `
    <h4>Controls:</h4>
    <p>Arrow Keys - Move basketball</p>
    <p>W/S - Adjust shot power</p>
    <p>SPACE - Shoot ball</p>
    <p>R - Reset position</p>
    <p>O - Toggle orbit camera</p>
`;
document.body.appendChild(instructionsDisplay);

// Power indicator
const powerIndicator = document.createElement('div');
powerIndicator.style.position = 'absolute';
powerIndicator.style.bottom = '25px';
powerIndicator.style.right = '25px';
powerIndicator.style.width = '32px';
powerIndicator.style.height = '160px';
powerIndicator.style.border = '2px solid white';
powerIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
powerIndicator.style.borderRadius = '3px';
document.body.appendChild(powerIndicator);

const powerLevel = document.createElement('div');
powerLevel.style.position = 'absolute';
powerLevel.style.bottom = '0';
powerLevel.style.width = '100%';
powerLevel.style.backgroundColor = 'green';
powerLevel.style.height = ballPhysics.shotStrength * 100 + '%';
powerLevel.style.borderRadius = '0 0 1px 1px';
powerIndicator.appendChild(powerLevel);

// celebration display
const celebrationText = document.createElement('div');
celebrationText.style.position = 'absolute';
celebrationText.style.top = '50%';
celebrationText.style.left = '50%';
celebrationText.style.transform = 'translate(-50%, -50%)';
celebrationText.style.color = '#FFD700';
celebrationText.style.fontSize = '48px';
celebrationText.style.fontWeight = 'bold';
celebrationText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
celebrationText.style.opacity = '0';
celebrationText.style.zIndex = '1000';
celebrationText.style.pointerEvents = 'none';
celebrationText.style.transition = 'opacity 0.3s ease';
celebrationText.innerHTML = 'SHOT MADE!';
document.body.appendChild(celebrationText);

function updatePowerDisplay() {
    powerLevel.style.height = ballPhysics.shotStrength * 100 + '%';
    powerLevel.style.backgroundColor = 'green';
}

function launchBasketball() {
    //determaine which hoop to shoot at based on position
    let targetHoop;
    if (basketball.position.x < 0) {
        targetHoop = hoopTargets[1]; //right
    } else {
        targetHoop = hoopTargets[0]; // left 
    }
    
    const trajectoryVector = new THREE.Vector3(
        targetHoop.x - basketball.position.x,
        targetHoop.y + 2.5 - basketball.position.y, 
        targetHoop.z - basketball.position.z
    ).normalize();
    
    ballPhysics.velocity.x = trajectoryVector.x * ballPhysics.shotStrength * 3;
    ballPhysics.velocity.y = trajectoryVector.y * ballPhysics.shotStrength * 3;
    ballPhysics.velocity.z = trajectoryVector.z * ballPhysics.shotStrength * 3;
    
    ballPhysics.isLaunched = true;
    ballPhysics.isPlayerControlled = false;
    ballPhysics.bounceCounter = 0;
    ballPhysics.shotInProgress = true; 
    
    gameStats.shotsAttempted++;
    document.getElementById('totalAttempts').textContent = gameStats.shotsAttempted;
}

function resetBasketball() {
    if (ballPhysics.shotInProgress) {
        gameStats.shootingPercentage = (gameStats.shotsMade / gameStats.shotsAttempted * 100).toFixed(1);
        document.getElementById('accuracy').textContent = gameStats.shootingPercentage;
        ballPhysics.shotInProgress = false;
    }
  
    basketball.position.set(0, 3, 0);
    basketball.rotation.set(0, 0, 0); 
    ballPhysics.currentPos.set(0, 3, 0);
    ballPhysics.velocity.set(0, 0, 0);
    ballPhysics.isLaunched = false;
    ballPhysics.isPlayerControlled = true;
    ballPhysics.bounceCounter = 0;
    ballRotation.previousPosition.set(0, 3, 0);
}

function detectScoringCollision() {
    for (const hoop of hoopTargets) {
        const hoopPosition = new THREE.Vector3(hoop.x, hoop.y, hoop.z);
        const ballDistance = hoopPosition.distanceTo(basketball.position);
        
        // check if score should count based on hoop/rim positon
        if (ballDistance < hoop.radius + 0.3 && 
            Math.abs(basketball.position.y - hoop.y) < 0.8 && 
            Math.abs(ballPhysics.lastScoredTime - Date.now()) > 3000) {
            
            // successful shot :)
            totalScore += 2;
            gameStats.totalScore += 2;
            gameStats.shotsMade++;
            gameStats.shootingPercentage = (gameStats.shotsMade / gameStats.shotsAttempted * 100).toFixed(1);
            ballPhysics.shotInProgress = false; 

            celebrateShot();
            
            document.getElementById('currentScore').textContent = gameStats.totalScore;
            document.getElementById('totalMade').textContent = gameStats.shotsMade;
            document.getElementById('accuracy').textContent = gameStats.shootingPercentage;
            
            updateScoreboardDisplay(gameStats.shotsMade);
            
            ballPhysics.lastScoredTime = Date.now();
        }
    }
}

// celebrate shot function with confetti
function celebrateShot() {
    celebrationText.style.opacity = '1';
    setTimeout(() => {
        celebrationText.style.opacity = '0';
    }, 2000);
    
    createConfetti();
}

function createConfetti() {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.opacity = '1';
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '999';
        
        document.body.appendChild(confetti);
        confettiParticles.push({
            element: confetti,
            x: parseFloat(confetti.style.left),
            y: -10,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            life: 100
        });
    }
}

function updateConfetti() {
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const particle = confettiParticles[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; 
        particle.life--;
        
        particle.element.style.left = particle.x + 'px';
        particle.element.style.top = particle.y + 'px';
        particle.element.style.opacity = (particle.life / 100).toString();
        
        if (particle.life <= 0 || particle.y > window.innerHeight) {
            document.body.removeChild(particle.element);
            confettiParticles.splice(i, 1);
        }
    }
}

function simulatePhysics() {
    if (!ballPhysics.isLaunched) {
        if (ballPhysics.horizontalDirection !== 0 || ballPhysics.verticalDirection !== 0) {
            ballRotation.previousPosition.copy(basketball.position);
            
            basketball.position.x += ballPhysics.horizontalDirection * 0.15;
            basketball.position.z += ballPhysics.verticalDirection * 0.15;
            
            basketball.position.x = Math.max(-14, Math.min(14, basketball.position.x));
            basketball.position.z = Math.max(-7, Math.min(7, basketball.position.z));
            
            ballPhysics.currentPos.copy(basketball.position);
            
            const movementVector = new THREE.Vector3()
                .subVectors(basketball.position, ballRotation.previousPosition);
            
            if (movementVector.length() > 0) {
                basketball.rotation.x += -movementVector.z * ballRotation.rotationMultiplier * 8;
                basketball.rotation.z += movementVector.x * ballRotation.rotationMultiplier * 8;
            }
        }
        return;
    }
    
    ballPhysics.velocity.add(ballPhysics.gravity);
    
    ballPhysics.currentPos.add(ballPhysics.velocity);
    basketball.position.copy(ballPhysics.currentPos);
    
    const velocityMagnitude = ballPhysics.velocity.length();
    if (velocityMagnitude > 0) {
        basketball.rotation.x += ballPhysics.velocity.z * 0.3;  
        basketball.rotation.z -= ballPhysics.velocity.x * 0.3; 
        
        basketball.rotation.x += velocityMagnitude * 0.15;  
        
        basketball.rotation.y += ballPhysics.velocity.x * 0.1;
    }
    
    if (ballPhysics.currentPos.y < 1.5 && ballPhysics.velocity.y < 0) {
        ballPhysics.velocity.y = -ballPhysics.velocity.y * 0.6; // energy loss
        ballPhysics.velocity.x *= 0.85; // friction
        ballPhysics.velocity.z *= 0.85; // friction
        ballPhysics.bounceCounter++;
        
        // reset after max bounces or low velocity
        if (ballPhysics.bounceCounter > ballPhysics.maxBounceLimit || 
           (Math.abs(ballPhysics.velocity.x) < 0.02 && 
            Math.abs(ballPhysics.velocity.z) < 0.02 && 
            Math.abs(ballPhysics.velocity.y) < 0.15)) {
            resetBasketball();
        }
    }
    
    // wall collision (bakcboard or sides)
    if (Math.abs(ballPhysics.currentPos.x) > 13 && 
        Math.sign(ballPhysics.currentPos.x) === Math.sign(ballPhysics.velocity.x)) {
        ballPhysics.velocity.x = -ballPhysics.velocity.x * 0.6;
    }
    
    if (Math.abs(ballPhysics.currentPos.z) > 7 && 
        Math.sign(ballPhysics.currentPos.z) === Math.sign(ballPhysics.velocity.z)) {
        ballPhysics.velocity.z = -ballPhysics.velocity.z * 0.6;
    }
    
    detectScoringCollision();
}

function handleKeyPressed(event) {
    if (event.key === "o" || event.key === "O") {
        isOrbitEnabled = !isOrbitEnabled;
    }
    
    if (ballPhysics.isPlayerControlled) {
        if (event.key === "ArrowLeft") {
            ballPhysics.horizontalDirection = -1;
        } else if (event.key === "ArrowRight") {
            ballPhysics.horizontalDirection = 1;
        } else if (event.key === "ArrowUp") {
            ballPhysics.verticalDirection = -1;
        } else if (event.key === "ArrowDown") {
            ballPhysics.verticalDirection = 1;
        }
        
        if (event.key === "w" && ballPhysics.shotStrength < 1.0) {
            ballPhysics.shotStrength += 0.04;
            updatePowerDisplay();
        } else if (event.key === "s" && ballPhysics.shotStrength > 0.15) {
            ballPhysics.shotStrength -= 0.04;
            updatePowerDisplay();
        }
        
        if (event.key === " ") {
            launchBasketball();
        }
    }
    
    if (event.key === "r" || event.key === "R") {
        resetBasketball();
    }
}

function handleKeyReleased(event) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        ballPhysics.horizontalDirection = 0;
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        ballPhysics.verticalDirection = 0;
    }
}

document.addEventListener('keydown', handleKeyPressed);
document.addEventListener('keyup', handleKeyReleased);

// Animation function
function animate() {
    requestAnimationFrame(animate);
    
    simulatePhysics();
    
    updateConfetti();
    
    controls.enabled = isOrbitEnabled;
    controls.update();
    
    renderer.render(scene, camera);
}

animate();