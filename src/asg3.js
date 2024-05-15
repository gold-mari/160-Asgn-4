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
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;

    uniform int u_whichTexture;

    void main() {
        if (u_whichTexture == -2) {
            // Use fragment color
            gl_FragColor = u_FragColor;
        } else if (u_whichTexture == -1) {
            // Use UV debug color
            gl_FragColor = vec4(v_UV, 1, 1);
        } else if (u_whichTexture == 0) {
            // Use texture0
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        } else if (u_whichTexture == 1) {
            // Use texture1
            gl_FragColor = texture2D(u_Sampler1, v_UV);
        } else if (u_whichTexture == 2) {
            // Use texture0
            gl_FragColor = texture2D(u_Sampler2, v_UV);
        } else if (u_whichTexture == 3) {
            // Use texture1
            gl_FragColor = texture2D(u_Sampler3, v_UV);
        } else {
            // Error: Use yellow to indicate missing texture
            gl_FragColor = vec4(1, 1, 0, 1);
        }
    }`;

let canvas;
let gl;
let a_Position;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let a_UV;
let u_FragColor;

let g_textureSources = [
    '../resources/horse.png',
    '../resources/dylan.png',
    '../resources/grass.png',
    '../resources/sky.png',
];
let u_Samplers = [];
let g_Textures = [];

let u_whichTexture;

let g_placeholderSlider = -10;

let g_dragStartAngle = [0, 0];
let g_dragStartMousePos = [0, 0];

let g_lastMouse = undefined;
let g_Camera = undefined;

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

    g_Camera = new Camera(canvas, {
        fov: 50,
        eye: new Vector3([3,0,-3]),
        at: new Vector3([-100,0,100]),
        up: new Vector3([0,1,0])
    })

    // On click
    canvas.onmousedown = function(ev) { click(ev, true) };
    // On drag
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev, false); } };

    document.onkeydown = keydown;

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Initialize textures
    initTextures();

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

    a_Position = getAttrib('a_Position');
    a_UV = getAttrib('a_UV');

    u_FragColor = getUniform('u_FragColor');
    u_ModelMatrix = getUniform('u_ModelMatrix');
    u_ViewMatrix = getUniform('u_ViewMatrix');
    u_ProjectionMatrix = getUniform('u_ProjectionMatrix');; 
    u_whichTexture = getUniform('u_whichTexture');

    // Provide default values
    gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);

    let identityMatrix = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements);

    function getAttrib(name) {
        let attribVar = gl.getAttribLocation(gl.program, name);
        if (attribVar < 0) {
            console.log("Failed to get the storage location of " + name);
            return null;
        } else {
            return attribVar;
        }
    }

    function getUniform(name) {
        let uniformVar = gl.getUniformLocation(gl.program, name);
        if (!uniformVar) {
            console.log("Failed to get the storage location of " + name);
            return null;
        } else {
            return uniformVar;
        }
    }
}

function addActionsForHTMLUI() {
    // Initialize dynamic text
    sendTextTOHTML("placeholderLabel", `Placeholder Slider (current: ${g_placeholderSlider})`);
    
    // Placeholder button
    let placeholderButton = document.getElementById("placeholderButton");
    placeholderButton.addEventListener("mousedown", function() {
        console.log("Clicked");
    });

    // Placeholder slider
    let placeholder = document.getElementById("placeholder");
    placeholder.addEventListener("input", function() {
        sendTextTOHTML("placeholderLabel", `Right Upper Roll (current: ${this.value})`);
        g_placeholderSlider = this.value;
        renderAllShapes();
    });
}

function initTextures() {
    for (let i = 0; i < g_textureSources.length; i++) {
        let image = new Image();  // Create the image object
        if (!image) {
        console.log('Failed to create the image object');
        return false;
        }

        var texture = gl.createTexture();   // Create a texture object
        if (!texture) {
            console.log('Failed to create the texture object');
            return false;
        } else {
            g_Textures.push(texture);
        }

        // Register the event handler to be called on loading an image
        image.onload = function(){ sendImageToTEXTURE(i, image); };
        // Tell the browser to load an image
        image.src = g_textureSources[i];
    };
  
    return true;
}
  
function sendImageToTEXTURE(index, image) {

    var u_Sampler = gl.getUniformLocation(gl.program, `u_Sampler${index}`);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl[`TEXTURE${index}`]);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, g_Textures[index]);
  
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    
    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler, index);
    
    gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
  
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 0); // Draw the rectangle

    // Add the filled out sampler to our sampler list
    u_Samplers.push(u_Sampler);
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
        // Starting a drag.
        console.log("Started a drag");
        g_lastMouse = [x, y];
    } else {
        // Continuing a drag.
        console.log("Continued a drag");

        let deltaX = x-g_lastMouse[0];
        console.log(`deltaX: ${deltaX}`);

        g_Camera.pan(deltaX * 20);

        g_lastMouse = [x, y];
    }
    renderAllShapes();
}

function keydown(ev) {

    if (ev.keyCode == 87) g_Camera.moveForward();
    if (ev.keyCode == 83) g_Camera.moveBackward();

    if (ev.keyCode == 65) g_Camera.moveLeft();
    if (ev.keyCode == 68) g_Camera.moveRight();

    if (ev.keyCode == 81) g_Camera.pan(-1);
    if (ev.keyCode == 69) g_Camera.pan(1);

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

    // Update our camera.
    g_Camera.recalculateMatrices();
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_Camera.projectionMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, g_Camera.viewMatrix.elements);

    // Clear <canvas>
    clearCanvas();

    let root = new Cube();
    root.matrix.translate(0, 0, 0);
    root.matrix.scale(1, 1, 1);

    let one = new Cube(root);
    one.setColorHex("ffcc00ff");
    one.setShadingIntensity(0.25);
    one.matrix.scale(0.5, 0.5, 0.5);
    one.render();

    let two = new Cube(root);
    two.setColorHex("ffcc00ff");
    two.setShadingIntensity(0.25);
    two.setTextureType(1);
    two.matrix.translate(0.5, 0, 0);
    two.matrix.rotate(45, 1, 1, 1);
    two.matrix.scale(0.2, 0.2, 0.2);
    two.render();

    let sky = new Cube(root);
    sky.setTextureType(3);
    sky.matrix.scale(20, 20, 20);
    sky.render();

    let grass = new Cube(root);
    grass.setTextureType(2);
    grass.matrix.translate(0, -1, 0);
    grass.matrix.scale(20, 0, 20);
    grass.render();

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