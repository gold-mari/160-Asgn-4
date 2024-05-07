// ================================================================
// Global variables
// ================================================================

// Vertex shader program
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_GlobalScaleMatrix;
    void main() {
        gl_Position = u_GlobalScaleMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    }`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
    }`;

// Globals
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const SIZE_DELTA = 1/200.0; // Used to scale shapes like triangles and circles.

let canvas;
let gl;
let penColorPreviewDiv;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_rightUpperArm_Roll = -10;
let g_rightUpperArm_Yaw = 45;
let g_rightLowerArm_Angle = 75;
let g_rightHand_Angle = 45;
let g_leftUpperArm_Roll = -40;
let g_leftUpperArm_Yaw = 45;
let g_leftLowerArm_Angle = 75;
let g_leftHand_Angle = 90;

let g_globalAngle = [0, 0];
let g_globalScale = 1;
let g_dragStartAngle = [0, 0];
let g_dragStartMousePos = [0, 0]
let g_shapesList = [];

let g_startTime = 0;
let g_seconds = 0;
let g_shudderTimer = 0;
let g_animate = true;
let anims = {
    orbRot: 0,
    orbOffset: [],
    shudder: 0
};

// ================================================================
// Main
// ================================================================

function main() {
    
    // Set up canvas and gl variables
    setUpWebGL();
    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    // Set up actions for the HTML UI elements
    addActionsForHTMLUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = function(ev) { click(ev, true) };
    // If the mouse is down, draw.
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev, false); } };

    // Register function to be called on mouse scroll
    canvas.addEventListener('wheel', function(event){
        scroll(event);
        event.preventDefault();
    }, false);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.9, 0.9, 1.0);

    // Clear <canvas>
    renderAllShapes();

    g_startTime = performance.now()/1000;
    requestAnimationFrame(tick);
}

function tick() {
    let delta = g_seconds;
    g_seconds = performance.now()/1000 - g_startTime;
    delta = g_seconds - delta;

    if (g_animate) {
        // Orbital rotation
        // g_globalAngle[0] = (g_globalAngle[0] + 0.25)%360;

        anims.orbRot = (anims.orbRot+2)%360
        anims.orbOffset = [
            Math.random()*0.02,
            Math.sin(g_seconds)*0.05,
            Math.random()*0.01
        ];
        
        anims.breath = Math.sin(g_seconds * 0.9).toFixed(3);    // Slow sine movement
        anims.rattle = Math.random().toFixed(3);                // Per-frame random movement
        if (g_shudderTimer > 0.2) {                             // Quick sampled-and-held movement
            anims.shudder = anims.rattle;
            g_shudderTimer = 0;
        }
        g_shudderTimer += delta;
    }

    renderAllShapes();

    requestAnimationFrame(tick);
}

// ================================================================
// Initializers
// ================================================================

function setUpWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById("webgl");

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {
        preserveDrawingBuffer: true
    });

    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position");
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log("Failed to get u_FragColor variable");
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log("Failed to get u_ModelMatrix variable");
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log("Failed to get u_GlobalRotateMatrix variable");
        return;
    }

    u_GlobalScaleMatrix = gl.getUniformLocation(gl.program, 'u_GlobalScaleMatrix');
    if (!u_GlobalScaleMatrix) {
        console.log("Failed to get u_GlobalScaleMatrix variable");
        return;
    }

    // Provide default values
    gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);

    let identityMatrix = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements);
}

function addActionsForHTMLUI() {
    // Initialize dynamic text
    sendTextTOHTML("leftUpperRollLabel", `Left Upper Roll (current: ${g_leftUpperArm_Roll})`);
    sendTextTOHTML("leftUpperYawLabel", `Left Upper Yaw (current: ${g_leftUpperArm_Yaw})`);
    sendTextTOHTML("leftLowerAngleLabel", `Left Lower Angle (current: ${g_leftLowerArm_Angle})`);
    sendTextTOHTML("leftHandAngleLabel", `Left Hand Angle (current: ${g_leftHand_Angle})`);
    sendTextTOHTML("rightUpperRollLabel", `Right Upper Roll (current: ${g_rightUpperArm_Roll})`);
    sendTextTOHTML("rightUpperYawLabel", `Right Upper Yaw (current: ${g_rightUpperArm_Yaw})`);
    sendTextTOHTML("rightLowerAngleLabel", `Right Lower Angle (current: ${g_rightLowerArm_Angle})`);
    sendTextTOHTML("rightHandAngleLabel", `Right Hand Angle (current: ${g_rightHand_Angle})`);
    
    // Camera angle
    let resetCam = document.getElementById("resetCam");
    resetCam.addEventListener("mousedown", function() {
        g_globalAngle = [0, 0];
    });

    // Toggle animations
    let toggleAnims = document.getElementById("toggleAnims");
    toggleAnims.addEventListener("mousedown", function() {
        g_animate = !g_animate;
        // If we're starting to animate again, restart the clock.
        if (g_animate) g_startTime = performance.now()/1000;
    });


    // Right arm
    let rightUpperRoll = document.getElementById("rightUpperRoll");
    rightUpperRoll.addEventListener("input", function() {
        sendTextTOHTML("rightUpperRollLabel", `Right Upper Roll (current: ${this.value})`);
        g_rightUpperArm_Roll = this.value;
        renderAllShapes();
    });

    let rightUpperYaw = document.getElementById("rightUpperYaw");
    rightUpperYaw.addEventListener("input", function() {
        sendTextTOHTML("rightUpperYawLabel", `Right Upper Yaw (current: ${this.value})`);
        g_rightUpperArm_Yaw = this.value;
        renderAllShapes();
    });

    let rightLowerAngle = document.getElementById("rightLowerAngle");
    rightLowerAngle.addEventListener("input", function() {
        sendTextTOHTML("rightLowerAngleLabel", `Right Lower Angle (current: ${this.value})`);
        g_rightLowerArm_Angle = this.value;
        renderAllShapes();
    });

    let rightHandAngle = document.getElementById("rightHandAngle");
    rightHandAngle.addEventListener("input", function() {
        sendTextTOHTML("rightHandAngleLabel", `Right Hand Angle (current: ${this.value})`);
        g_rightHand_Angle = this.value;
        renderAllShapes();
    });

    // Left arm
    let leftUpperRoll = document.getElementById("leftUpperRoll");
    leftUpperRoll.addEventListener("input", function() {
        sendTextTOHTML("leftUpperRollLabel", `Left Upper Roll (current: ${this.value})`);
        g_leftUpperArm_Roll = this.value;
        renderAllShapes();
    });

    let leftUpperYaw = document.getElementById("leftUpperYaw");
    leftUpperYaw.addEventListener("input", function() {
        sendTextTOHTML("leftUpperYawLabel", `Left Upper Yaw (current: ${this.value})`);
        g_leftUpperArm_Yaw = this.value;
        renderAllShapes();
    });

    let leftLowerAngle = document.getElementById("leftLowerAngle");
    leftLowerAngle.addEventListener("input", function() {
        sendTextTOHTML("leftLowerAngleLabel", `Left Lower Angle (current: ${this.value})`);
        g_leftLowerArm_Angle = this.value;
        renderAllShapes();
    });

    let leftHandAngle = document.getElementById("leftHandAngle");
    leftHandAngle.addEventListener("input", function() {
        sendTextTOHTML("leftHandAngleLabel", `Left Hand Angle (current: ${this.value})`);
        g_leftHand_Angle = this.value;
        renderAllShapes();
    });
}

function clearCanvas() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);
}

// ================================================================
// Event callback methods
// ================================================================

function click(ev, dragStart) {

    // Extract the event click and convert to WebGL canvas space
    let [x, y] = coordinatesEventToGLSpace(ev);

    if (dragStart) {
        g_dragStartAngle = [g_globalAngle[0], g_globalAngle[1]];
        g_dragStartMousePos = [x, y]
    }

    g_globalAngle[0] = g_dragStartAngle[0] + ((x - g_dragStartMousePos[0]) * -180);
    g_globalAngle[1] = g_dragStartAngle[1] + ((y - g_dragStartMousePos[1]) * 180);
    renderAllShapes();
}

function scroll(ev) {
    console.log(ev.deltaY);

    g_globalScale = Math.max(0, g_globalScale + Number(-ev.deltaY*0.001))
}

// ================================================================
// Render methods
// ================================================================

function coordinatesEventToGLSpace(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    // Transform from client space to WebGL canvas space
    x = ((x - rect.left) - canvas.height/2)/(canvas.height/2);
    y = (canvas.width/2 - (y - rect.top))/(canvas.width/2);

    return [x, y];
}

function renderAllShapes() {

    // Store the time at the start of this function.
    let startTime = performance.now();

    // Pass in the global angle and scale matrix
    let globalRotationMatrix = new Matrix4();
    globalRotationMatrix.rotate(g_globalAngle[0], 0, 1, 0);
    globalRotationMatrix.rotate(g_globalAngle[1], 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotationMatrix.elements);
    let globalScaleMatrix = new Matrix4();
    globalScaleMatrix.scale(g_globalScale, g_globalScale, g_globalScale);
    gl.uniformMatrix4fv(u_GlobalScaleMatrix, false, globalScaleMatrix.elements);

    // Clear <canvas>
    clearCanvas();

    let root = new Cube();
    root.matrix.translate(0, -0.1, 0);
    root.matrix.scale(1.25, 1.25, 1.25);

    let robe = new Pyramid4(root);
    robe.setColorHex("ff1158ff");
    robe.matrix.translate(0, -0.1, 0);
    robe.matrix.scale(0.5, 0.75, 0.5);
    robe.render();

    let head = new Cube(robe);
    head.setColorHex("6d5858ff");
    head.matrix.scale(1/0.5, 1/0.75, 1/0.5); // Undo parent scale
    head.matrix.translate(0, anims.breath*0.01, 0);
    head.matrix.rotate(anims.breath, 0.2, 0, 1);
    head.matrix.translate(0, 0.3, 0);
    head.matrix.scale(0.25, 0.25, 0.25);
    head.render();
    // Render head decorations
    {
        let hair = new Cube(head);
        hair.setColorHex("ffffffff");
        hair.matrix.translate(0, 0, 0.2);
        hair.matrix.scale(1.2, 1.1, 0.8);
        hair.render();

        let eyePositions = [0.25, -0.25];
        eyePositions.forEach(eyePosition => {
            let sclera = new Cube(head);
            sclera.setColorHex("ffffffff");
            sclera.matrix.translate(eyePosition, 0, -0.46);
            sclera.matrix.scale(0.3, 0.2, 0.1);
            sclera.render();

            let iris = new Cube(sclera);
            iris.setColorHex("7799ccff");
            iris.matrix.translate(-eyePosition, 0, -0.46);
            iris.matrix.scale(0.4, 0.9, 0.1);
            iris.render();

            let pupil = new Cube(iris);
            pupil.setColorHex("000000ff");
            pupil.matrix.translate(anims.rattle*eyePosition*0.1, -anims.rattle*0.1, 0);
            pupil.matrix.translate(-eyePosition*0.9, -0.1, -0.46);
            pupil.matrix.scale(0.7, 0.7, 1);
            pupil.render();

            let brow = new Cube(sclera);
            brow.setColorHex("442200ff");

            if (eyePosition == 0.25) { // only one eyebrow
                brow.matrix.translate(0, anims.rattle*0.2, 0);    
            }
            brow.matrix.rotate(eyePosition*80, 0, 0, 1);
            brow.matrix.translate(eyePosition, 1, -0.46);
            brow.matrix.scale(1, 0.75, 0.1);
            brow.render();
        });

        let mouth = new Pyramid4(head);
        mouth.setColorHex("000000ff");
        mouth.matrix.translate(0, -0.25, -0.5);
        mouth.matrix.scale(0.3, -0.1, 0.01);
        mouth.render();

        let tongue = new Octahedron(mouth);
        tongue.setColorHex("ff1158ff");
        tongue.matrix.scale(0.8, 1, 1);
        tongue.render();

        let beard = new Octahedron(head);
        beard.setColorHex("ffffffff");
        beard.matrix.translate(0, -0.7, 0);
        beard.matrix.scale(2, 2, 2);
        beard.render();

        let hat = new Pyramid4(head);
        hat.setColorHex("ff1158ff");
        hat.matrix.translate(0, 1.1, 0);
        hat.matrix.scale(1, 1.2, 1);
        hat.render();

        let hatBrim = new Cube(hat);
        hatBrim.matrix.translate(0, -0.5, 0);
        hatBrim.matrix.scale(2, 0.1, 2);
        hatBrim.render();

        let hatBauble = new Icosahedron(hat)
        hatBauble.setColorHex("ffbb22ff");
        hatBauble.matrix.translate(0, 0.5, 0);
        hatBauble.matrix.scale(0.3, 0.3/1.2, 0.3);
        hatBauble.render();
    }
    
    let arms = ["left", "right"]
    arms.forEach(side => {
        let armSign = (side == "left") ? -1 : 1;

        let sleeve = new Pyramid4(robe);
        sleeve.matrix.scale(1/0.5, 1/0.75, 1/0.5); // Undo parent scale
        sleeve.matrix.translate(armSign*0.1, 0.1, 0);

        let baseYaw = (side == "left") ? -g_leftUpperArm_Yaw : g_rightUpperArm_Yaw;
        let yaw = Number(anims.breath*5) + Number(anims.rattle*0.5) + Number(baseYaw);
        sleeve.matrix.rotate(yaw, 0, 1, 0);

        let baseRoll = (side == "left") ? -g_leftUpperArm_Roll : g_rightUpperArm_Roll;
        let roll = Number(anims.shudder*3) + Number(anims.rattle*2) + Number(baseRoll);
        sleeve.matrix.rotate(roll, 0, 0, 1);

        sleeve.matrix.translate(armSign*0.1, 0, 0); // Sets pivot to be tip of pyramid
        sleeve.matrix.rotate(armSign*90, 0, 0, 1);
        sleeve.matrix.scale(0.2, 0.2, 0.2);
        sleeve.render();

        let arm_pyr = new Pyramid4(sleeve);
        arm_pyr.setColorHex("6d5858ff");
        arm_pyr.matrix.translate(0, -0.5, 0);

        let baseAngle = (side == "left") ? g_leftLowerArm_Angle : g_rightLowerArm_Angle
        let angle = Number(anims.breath*5*-armSign) + Number(baseAngle);
        arm_pyr.matrix.rotate(angle, 1, 0, 0);

        arm_pyr.matrix.translate(0, -0.5, 0); // Sets pivot to be tip of pyramid
        arm_pyr.matrix.scale(0.5, -1, 0.5);
        arm_pyr.render();

        let arm_cub = new Cube(arm_pyr);
        arm_cub.matrix.scale(0.5, 1, 0.5);
        arm_cub.render();

        let hand = new Cube(arm_pyr);
        hand.matrix.scale(1/0.5, 1/-1, 1/0.5); // Undo parent scale
        hand.matrix.translate(armSign*-0.025, -0.4, 0);

        baseAngle = (side == "left") ? -g_leftHand_Angle : g_rightHand_Angle;
        angle = Number(anims.breath*10*armSign) + Number(anims.rattle*3) + Number(baseAngle);
        hand.matrix.rotate(angle, 0, 0, 1);
        hand.matrix.translate(0, -0.25, 0); // Sets pivot to be bottom of cube
        hand.matrix.scale(0.2, 0.5, 0.5);
        hand.render();
    });

    let orb = new Icosahedron(root);
    orb.setColorHex("ffff00ff");
    orb.setShadingIntensity(0.1);
    orb.matrix.translate(...anims.orbOffset);
    orb.matrix.translate(0, -0.2, -0.5);
    orb.matrix.scale(0.25, 0.25, 0.25);
    orb.matrix.rotate(anims.orbRot, 1, 2, 3);
    orb.render();

    updatePerformanceDebug(startTime, performance.now());
}

// ================================================================
// Utility methods
// ================================================================

function updatePerformanceDebug(start, end) {
    let duration = end-start;
    sendTextTOHTML("performance",
                        `ms: ${Math.floor(duration)} | fps: ${Math.floor(10000/duration)/10}`)
}

function sendTextTOHTML(htmlID, text) {
    let htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log(`Failed to get ${htmlID} from HTML.`);
        return;
    }
    htmlElm.innerHTML = text;
}