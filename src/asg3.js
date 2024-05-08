// ================================================================
// Global variables
// ================================================================

// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    void main() {
        gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
        gl_FragColor = vec4(v_UV, 1, 1);
    }`;

let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_GlobalScaleMatrix;

let g_placeholderSlider = -10;

let g_globalAngle = [0, 0];
let g_globalScale = 1;
let g_dragStartAngle = [0, 0];
let g_dragStartMousePos = [0, 0]
let g_shapesList = [];

let g_startTime = 0;
let g_seconds = 0;

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

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Clear <canvas>
    renderAllShapes();

    g_startTime = performance.now()/1000;
    requestAnimationFrame(tick);
}

function tick() {
    let delta = g_seconds;
    g_seconds = performance.now()/1000 - g_startTime;
    delta = g_seconds - delta;

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

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log("Failed to get the storage location of a_UV");
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log("Failed to get the storage location of u_ModelMatrix");
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log("Failed to get the storage location of u_GlobalRotateMatrix");
        return;
    }

    // Provide default values
    gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);

    let identityMatrix = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements);
}

function addActionsForHTMLUI() {
    // Initialize dynamic text
    sendTextTOHTML("placeholderLabel", `Right Upper Roll (current: ${g_placeholderSlider})`);
    
    // Camera angle
    let placeholderButton = document.getElementById("placeholderButton");
    placeholderButton.addEventListener("mousedown", function() {
        g_globalAngle = [0, 0];
    });

    // Right arm
    let placeholder = document.getElementById("placeholder");
    placeholder.addEventListener("input", function() {
        sendTextTOHTML("placeholderLabel", `Right Upper Roll (current: ${this.value})`);
        g_placeholderSlider = this.value;
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

    // Clear <canvas>
    clearCanvas();

    let root = new Cube();
    root.matrix.translate(0, 0, 0);
    root.matrix.scale(1, 1, 1);

    let orb = new Cube(root);
    orb.setColorHex("ffcc00ff");
    orb.setShadingIntensity(0.25);
    orb.matrix.scale(0.5, 0.5, 0.5);
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