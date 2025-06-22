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

  defineLines(scene)
  
  // defining hoops 
  createHoop(scene, true);  //left hoop
  createHoop(scene, false);  //right hoop (its all about perspective tho if you really think about it)
  createBasketball();
}

function defineLines(scene){
  const line_M = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  const center_line_G = new THREE.BoxGeometry(0.2, 0.1, 15);
  const center_line = new THREE.Mesh(center_line_G, line_M);
  center_line.position.y = 0.10;
  scene.add(center_line);
  
  const center_circle_G = new THREE.RingGeometry(1.7, 1.5, 32);
  const center_circle_M = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    side: THREE.DoubleSide 
  });
  const center_circle = new THREE.Mesh(center_circle_G, center_circle_M);
  center_circle.rotation.x = Math.PI / 2;
  center_circle.position.y = 0.12;
  scene.add(center_circle);
  
  const three_point_radius = 7.4;
  const three_point_segments = 50; //arbitrary
  const left_three_line_segmants = [];
  for (let i = 0; i <= three_point_segments; i++) {
    const angle = Math.PI/2 - (Math.PI * i / three_point_segments);
    const x = -13.5 + three_point_radius * Math.cos(angle);
    const z = three_point_radius * Math.sin(angle);
    left_three_line_segmants.push(new THREE.Vector3(x, 0.12, z));
  }
  const left_three_line_G = new THREE.BufferGeometry().setFromPoints(left_three_line_segmants);
  const left_three_line = new THREE.Line(left_three_line_G, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 5}));
  scene.add(left_three_line);
  
  const right_three_line_segmants = [];
  for (let i = 0; i <= three_point_segments; i++) {
    const angle = Math.PI/2 + (Math.PI * i / three_point_segments);
    const x = 13.5 + three_point_radius * Math.cos(angle);
    const z = three_point_radius * Math.sin(angle);
    right_three_line_segmants.push(new THREE.Vector3(x, 0.11, z));
  }
  
  const right_three_line_G = new THREE.BufferGeometry().setFromPoints(right_three_line_segmants);
  const right_three_line = new THREE.Line(right_three_line_G, new THREE.LineBasicMaterial({ color: 0xffffff }));
  scene.add(right_three_line);
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
    hoop_x = -13.5;
  } else {
    hoop_x = 13.5;
  }
  
  const hoop_z = 0;
  
  const backboard_mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 4, 7), // thickness, height, widht
    new THREE.MeshPhongMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.85
    })
  );
  backboard_mesh.position.set(hoop_x, rim_height, hoop_z);
  backboard_mesh.castShadow = true;
  target_scene.add(backboard_mesh);
  
  let support_x;
  if (facing_right) {
    support_x = hoop_x - 0.7;
  } else {
    support_x = hoop_x + 0.7;
  }
  
  const arm_distance = Math.abs(support_x - hoop_x);
  
  const pole_mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, rim_height + 3.5, 20),
    new THREE.MeshPhongMaterial({ color: 0x4b4b4b})
  );
  pole_mesh.position.set(support_x, (rim_height + 5)/2, hoop_z);
  pole_mesh.castShadow = true;
  target_scene.add(pole_mesh);
  
  const horizontal_support = new THREE.Mesh(
    new THREE.BoxGeometry(arm_distance, 0.3, 0.3),
    new THREE.MeshPhongMaterial({ color: 0x4b4b4b })
  );
  horizontal_support.position.set((support_x + hoop_x) / 2, rim_height + 2, hoop_z);
  horizontal_support.castShadow = true;
  target_scene.add(horizontal_support);
  
  const basket_rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.05, 16, 32),
    new THREE.MeshPhongMaterial({ color: 0xff0000 })
  );
  basket_rim.position.set(hoop_x + rim_offset_x, rim_height, hoop_z);
  basket_rim.rotation.x = Math.PI / 2;
  basket_rim.castShadow = true;
  target_scene.add(basket_rim);
  
  const string_material = new THREE.LineBasicMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.7
  });
  
  for (let string_index = 0; string_index < 16; string_index++) {
    const string_angle = (Math.PI * 2 / 16) * string_index;
    const net_string = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(
          hoop_x + rim_offset_x + Math.cos(string_angle) * 0.8,
          rim_height,
          hoop_z + Math.sin(string_angle) * 0.8
        ),
        new THREE.Vector3(
          hoop_x + rim_offset_x + Math.cos(string_angle) * 0.4,
          rim_height - 1.5,
          hoop_z + Math.sin(string_angle) * 0.4
        )
      ]),
      string_material
    );
    target_scene.add(net_string);
  }
  
  const brace_length = Math.sqrt(arm_distance * arm_distance + 16);
  const diagonal_brace = new THREE.Mesh(
    new THREE.BoxGeometry(brace_length, 0.2, 0.2),
    new THREE.MeshPhongMaterial({ color: 0x444444 })
  );
  const brace_angle = Math.atan2(4, arm_distance);
  
  if (facing_right) {
    diagonal_brace.rotation.z = -brace_angle;
  } else {
    diagonal_brace.rotation.z = brace_angle;
  }
  
  diagonal_brace.position.set((support_x + hoop_x) / 2, rim_height, hoop_z);
  diagonal_brace.castShadow = true;
  target_scene.add(diagonal_brace);
  
  const foundation = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 1, 0.4, 30),
    new THREE.MeshPhongMaterial({ color: 0x252525 })
  );
  foundation.position.set(support_x, 0.3, hoop_z);
  foundation.castShadow = true;
  target_scene.add(foundation);
  
  let target_square_x;
  if (facing_right) {
    target_square_x = hoop_x - 0.15;
  } else {
    target_square_x = hoop_x + 0.15;
  }
  
  const target_square = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.4, 1),
    new THREE.MeshPhongMaterial({ color: 0xE0E0E0 })
  );
  target_square.position.set(target_square_x, rim_height + 0.4, hoop_z);
  target_square.castShadow = true;
  target_scene.add(target_square);
}

// Create static basketball
function createBasketball() {
  const ball_G = new THREE.SphereGeometry(1, 32, 32);
  
  const ball_M = new THREE.MeshPhongMaterial({ 
    color: 0xffa500,  
    shininess: 30
  });
  
  const ball = new THREE.Mesh(ball_G, ball_M);
  ball.position.set(0, 3, 0);
  ball.castShadow = true;
  
  const line1G = new THREE.TorusGeometry(1.01, 0.05, 16, 32);
  const line2G = new THREE.TorusGeometry(1.01, 0.05, 16, 32);
  const line3G = new THREE.TorusGeometry(1.01, 0.05, 16, 32);
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const line1 = new THREE.Mesh(line1G, lineMaterial);
  const line2 = new THREE.Mesh(line2G, lineMaterial);
  const line3 = new THREE.Mesh(line3G, lineMaterial);
  
  line1.rotation.x = Math.PI / 2;
  line2.rotation.y = Math.PI / 2;
  
  ball.add(line1);
  ball.add(line2);
  ball.add(line3);
  
  scene.add(ball);
}

// Create all elements
createBasketballCourt();

// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// Instructions display
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

// Handle key events
function handleKeyDown(e) {
  if (e.key === "o" || e.key === "O") {
    isOrbitEnabled = !isOrbitEnabled;
  }
}

document.addEventListener('keydown', handleKeyDown);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();