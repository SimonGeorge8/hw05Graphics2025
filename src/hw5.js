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

// create  basketball
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
  
  return ball_group;
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

const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute'
scoreElement.style.bottom = '500px';
scoreElement.style.right = '40%';
scoreElement.style.width = '200px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '16px';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.style.height = '150px';
scoreElement.innerHTML = `
  <h3>Score:</h3>
  <p>0-0</p>
`;
document.body.appendChild(scoreElement);


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