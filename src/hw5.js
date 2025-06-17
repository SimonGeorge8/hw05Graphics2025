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

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

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
  
  // Court lines 
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  // Center line
  const centerLineGeometry = new THREE.BoxGeometry(0.1, 0.21, 15);
  const centerLine = new THREE.Mesh(centerLineGeometry, lineMaterial);
  centerLine.position.y = 0.11;
  scene.add(centerLine);
  
  // Center circle
  const centerCircleGeometry = new THREE.RingGeometry(1.8, 2, 32);
  const centerCircleMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    side: THREE.DoubleSide 
  });
  const centerCircle = new THREE.Mesh(centerCircleGeometry, centerCircleMaterial);
  centerCircle.rotation.x = Math.PI / 2;
  centerCircle.position.y = 0.11;
  scene.add(centerCircle);
  
  // Three-point lines (arcs) as line segments on the court
  const threePointRadius = 6.75;
  const threePointSegments = 32;
  const halfPi = Math.PI / 2;
  
  // Left three-point line
  const leftThreePointPoints = [];
  for (let i = 0; i <= threePointSegments; i++) {
    const angle = halfPi - (Math.PI * i / threePointSegments);
    const x = -13.5 + threePointRadius * Math.cos(angle);
    const z = threePointRadius * Math.sin(angle);
    leftThreePointPoints.push(new THREE.Vector3(x, 0.11, z));
  }
  
  const leftThreePointGeometry = new THREE.BufferGeometry().setFromPoints(leftThreePointPoints);
  const leftThreePointLine = new THREE.Line(leftThreePointGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
  scene.add(leftThreePointLine);
  
  // Right three-point line
  const rightThreePointPoints = [];
  for (let i = 0; i <= threePointSegments; i++) {
    const angle = halfPi + (Math.PI * i / threePointSegments);
    const x = 13.5 + threePointRadius * Math.cos(angle);
    const z = threePointRadius * Math.sin(angle);
    rightThreePointPoints.push(new THREE.Vector3(x, 0.11, z));
  }
  
  const rightThreePointGeometry = new THREE.BufferGeometry().setFromPoints(rightThreePointPoints);
  const rightThreePointLine = new THREE.Line(rightThreePointGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
  scene.add(rightThreePointLine);
  
  // Create basketball hoops facing the center of the court
  createBasketballHoop(-13.5, 0, true);  // Left hoop (facing right)
  createBasketballHoop(13.5, 0, false);  // Right hoop (facing left)
}

// Create basketball hoop function
function createBasketballHoop(x, z, facingRight) {
  // Basketball hoop height constants
  const rimHeight = 10; // Standard basketball rim height (10 feet or ~3 meters)
  const backboardHeight = rimHeight + 2; // Backboard extends above the rim
  const poleHeight = backboardHeight + 3; // Pole is taller than the backboard
  
  // Determine the direction offsets based on which way the hoop is facing
  const rimOffsetX = facingRight ? 1 : -1;
  
  // Create a hoop group to hold all parts
  const hoopGroup = new THREE.Group();
  scene.add(hoopGroup);
  
  // Create the backboard
  const backboardGeometry = new THREE.BoxGeometry(0.2, 4, 6);
  const backboardMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
  backboard.position.set(x, backboardHeight - 2, z); // Center of backboard
  backboard.castShadow = true;
  hoopGroup.add(backboard);
  
  // Create the hoop rim
  const rimGeometry = new THREE.TorusGeometry(0.8, 0.05, 16, 32);
  const rimMaterial = new THREE.MeshPhongMaterial({ color: 0xf97316 });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.position.set(x + rimOffsetX, rimHeight, z);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  hoopGroup.add(rim);
  
  // Create the net using lines
  const netMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.7
  });
  
  const netLength = 1.5; // Length of the net
  
  for (let i = 0; i < 16; i++) {
    // Create vertical net strings
    const angle = (Math.PI * 2 / 16) * i;
    const netGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(
        x + rimOffsetX + Math.cos(angle) * 0.8,
        rimHeight,
        z + Math.sin(angle) * 0.8
      ),
      new THREE.Vector3(
        x + rimOffsetX + Math.cos(angle) * 0.4,
        rimHeight - netLength,
        z + Math.sin(angle) * 0.4
      )
    ]);
    
    const netLine = new THREE.Line(netGeometry, netMaterial);
    hoopGroup.add(netLine);
  }
  
  // Position the support structure BEHIND the backboard
  // Determine the backboard side
  const backSideX = facingRight ? x - 0.7 : x + 0.7;
  
  // Create the support pole
  const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, poleHeight, 16);
  const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  // Position the pole behind the backboard
  pole.position.set(backSideX, poleHeight/2, z);
  pole.castShadow = true;
  hoopGroup.add(pole);
  
  // Create the main support arm
  const mainArmLength = Math.abs(backSideX - x);
  const mainArmGeometry = new THREE.BoxGeometry(mainArmLength, 0.3, 0.3);
  const mainArm = new THREE.Mesh(mainArmGeometry, poleMaterial);
  // Position the arm to connect the pole to the backboard at top
  mainArm.position.set((backSideX + x) / 2, backboardHeight, z);
  mainArm.castShadow = true;
  hoopGroup.add(mainArm);
  
  // Create a second, angled support arm for stability
  const secondArmLength = Math.sqrt(mainArmLength*mainArmLength + 4*4); // Pythagoras
  const secondArmGeometry = new THREE.BoxGeometry(secondArmLength, 0.2, 0.2);
  const secondArm = new THREE.Mesh(secondArmGeometry, poleMaterial);
  // Calculate angle for the second arm
  const angleY = Math.atan2(4, mainArmLength);
  // Apply rotation and position
  secondArm.rotation.z = facingRight ? -angleY : angleY;
  secondArm.position.set((backSideX + x) / 2, backboardHeight - 2, z);
  secondArm.castShadow = true;
  hoopGroup.add(secondArm);
  
  // Add a base for the pole
  const baseGeometry = new THREE.CylinderGeometry(1, 1.2, 0.6, 16);
  const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(backSideX, 0.3, z);
  base.castShadow = true;
  hoopGroup.add(base);
  
  // Add a small rectangular box on the backboard (optional)
  const boxGeometry = new THREE.BoxGeometry(0.3, 0.4, 1);
  const boxMaterial = new THREE.MeshPhongMaterial({ color: 0xE0E0E0 });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(x + (facingRight ? -0.15 : 0.15), rimHeight + 0.4, z);
  box.castShadow = true;
  hoopGroup.add(box);
}

// Create static basketball
function createBasketball() {
  const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
  
  // Create seams on the basketball
  const ballMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xd97706,  // Orange basketball color
    shininess: 60
  });
  
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, 4, 0); // Positioned at center court
  ball.castShadow = true;
  
  // Add black lines (seams) on the basketball
  const lineGeometry1 = new THREE.TorusGeometry(1.01, 0.05, 16, 32);
  const lineGeometry2 = new THREE.TorusGeometry(1.01, 0.05, 16, 32);
  const lineGeometry3 = new THREE.TorusGeometry(1.01, 0.05, 16, 32);
  
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  const line1 = new THREE.Mesh(lineGeometry1, lineMaterial);
  const line2 = new THREE.Mesh(lineGeometry2, lineMaterial);
  const line3 = new THREE.Mesh(lineGeometry3, lineMaterial);
  
  line1.rotation.x = Math.PI / 2;
  line2.rotation.y = Math.PI / 2;
  
  ball.add(line1);
  ball.add(line2);
  ball.add(line3);
  
  scene.add(ball);
  
  return ball;
}

// Create all elements
createBasketballCourt();
const basketball = createBasketball();

// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// UI Framework - Score display container (prepared for HW06)
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.left = '20px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.textContent = 'Score: 0';
document.body.appendChild(scoreElement);

// UI Framework - Instructions display container
const instructionsElement = document.createElement('div');
instructionsElement.style.position = 'absolute';
instructionsElement.style.bottom = '20px';
instructionsElement.style.left = '20px';
instructionsElement.style.color = 'white';
instructionsElement.style.fontSize = '16px';
instructionsElement.style.fontFamily = 'Arial, sans-serif';
instructionsElement.style.textAlign = 'left';
instructionsElement.innerHTML = `
  <h3>Controls:</h3>
  <p>O - Toggle orbit camera</p>
`;
document.body.appendChild(instructionsElement);

// UI Framework - Power indicator container (prepared for HW06)
const powerBarContainer = document.createElement('div');
powerBarContainer.style.position = 'absolute';
powerBarContainer.style.bottom = '20px';
powerBarContainer.style.right = '20px';
powerBarContainer.style.width = '30px';
powerBarContainer.style.height = '150px';
powerBarContainer.style.border = '2px solid white';
powerBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
document.body.appendChild(powerBarContainer);

const powerBar = document.createElement('div');
powerBar.style.position = 'absolute';
powerBar.style.bottom = '0';
powerBar.style.width = '100%';
powerBar.style.backgroundColor = 'green';
powerBar.style.height = '50%'; // Static power level for HW05
powerBarContainer.appendChild(powerBar);

// Handle key events - HW05 only supports orbit camera toggle
function handleKeyDown(e) {
  if (e.key === "o" || e.key === "O") {
    isOrbitEnabled = !isOrbitEnabled;
  }
}

document.addEventListener('keydown', handleKeyDown);

// Window resize handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();