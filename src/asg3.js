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
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;

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
        } else {
            // Error: Use yellow to indicate missing texture
            gl_FragColor = vec4(1, 1, 0, 1);
        }
    }`;

let canvas;
let gl;
let a_Position;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let a_UV;
let u_FragColor;
let u_Sampler0;
let u_whichTexture;

let g_placeholderSlider = -10;

let g_globalAngle = [0, 0];
let g_dragStartAngle = [0, 0];
let g_dragStartMousePos = [0, 0];

let g_View = {
    eye: new Vector3([3,0,-3]),
    at: new Vector3([-100,0,100]),
    up: new Vector3([0,1,0])
};

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
    // canvas.onmousedown = function(ev) { click(ev, true) };

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
    u_GlobalRotateMatrix = getUniform('u_GlobalRotateMatrix');
    u_ViewMatrix = getUniform('u_ViewMatrix');
    u_ProjectionMatrix = getUniform('u_ProjectionMatrix');; 
    u_Sampler0 = getUniform('u_Sampler0');
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
    sendTextTOHTML("placeholderLabel", `Right Upper Roll (current: ${g_placeholderSlider})`);
    
    // Placeholder button
    let placeholderButton = document.getElementById("placeholderButton");
    placeholderButton.addEventListener("mousedown", function() {
        g_globalAngle = [0, 0];
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
    var image = new Image();  // Create the image object
    if (!image) {
      console.log('Failed to create the image object');
      return false;
    }
    
    // Register the event handler to be called on loading an image
    image.onload = function(){ sendImageToTEXTURE0(image); };
    // Tell the browser to load an image
    image.src = '../resources/horse.png';
  
    // Add more texture loading

    return true;
}
  
function sendImageToTEXTURE0(image) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
      console.log('Failed to create the texture object');
      return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    
    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler0, 0);
    
    gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
  
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 0); // Draw the rectangle
}

function clearCanvas() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);
}

// ================================================================
// Event callback methods
// ================================================================

// function click(ev, dragStart) {

//     // Extract the event click and convert to WebGL canvas space
//     let [x, y] = coordinatesEventToGLSpace(ev);

//     if (dragStart) {
//         g_dragStartAngle = [g_globalAngle[0], g_globalAngle[1]];
//         g_dragStartMousePos = [x, y]
//     }

//     g_globalAngle[0] = g_dragStartAngle[0] + ((x - g_dragStartMousePos[0]) * -180);
//     g_globalAngle[1] = g_dragStartAngle[1] + ((y - g_dragStartMousePos[1]) * 180);
//     renderAllShapes();
// }

function keydown(ev) {
    let step;
    let radius, radians;

    if ([87, 65, 83, 68, 81, 69].includes(ev.keyCode)) { // If the movement is valid...
        // Get our 'step' vector, a normalized vector pointed from where 
        // we are to where we're looking.
        baseAt = new Vector3(g_View.at);
        step = new Vector3(g_View.at);
        step.sub(g_View.eye);
        step.normalize();
        step.mul(0.1);
        if ([81, 69].includes(ev.keyCode)) { // If the movement is a rotation (is Q/E)...
            radius = Math.sqrt(Math.pow(step.elements[0], 2) + Math.pow(step.elements[0], 2));
            radians = Math.atan2(step.elements[2], step.elements[0]);
            // console.log(`radius - ${radius}\nradians - ${radians}`);
        }
    }

    switch (ev.keyCode) {
        case 87: {  // "W", move forward
            g_View.eye.add(step);
            g_View.at.add(step);
            break;
        }
        case 65: {  // "A", move left
            let left = Vector3.cross(step, g_View.up);
            g_View.eye.sub(left);
            g_View.at.sub(left);
            break;
        }
        case 83: {  // "S", move backward
            g_View.eye.sub(step);
            g_View.at.sub(step);
            break;
        }
        case 68: {  // "D", move right
            let right = Vector3.cross(step, g_View.up);
            g_View.eye.add(right);
            g_View.at.add(right);
            break
        }
        case 81: { // "Q", turn counterclockwise
            turnVector = new Vector3([
                radius * Math.cos(radians - 0.02),
                0,
                radius * Math.sin(radians - 0.02)
            ]);

            console.log(g_View.eye);
            g_View.at.set(g_View.eye);
            g_View.at.add(turnVector);
            break;
        }
        case 69: { // "E", turn clockwise
            turnVector = new Vector3([
                radius * Math.cos(radians + 0.02),
                0,
                radius * Math.sin(radians + 0.02)
            ]);

            console.log(g_View.eye);
            g_View.at.set(g_View.eye);
            g_View.at.add(turnVector);
            break;
        }
    }

    renderAllShapes();
    console.log(ev.keyCode);
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

    // Pass in the projection matrix
    let projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(
        50,                         // FOV
        canvas.width/canvas.height, // aspect
        0.1,                        // near
        100                         // far
    );
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);

    // Pass in the view matrix
    let viewMatrix = new Matrix4();
    viewMatrix.setLookAt(
        ...g_View.eye.elements, // eye
        ...g_View.at.elements,  // at
        ...g_View.up.elements   // up
    );

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

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

    let one = new Cube(root);
    one.setColorHex("ffcc00ff");
    one.setShadingIntensity(0.25);
    one.matrix.scale(0.5, 0.5, 0.5);
    one.render();

    let two = new Cube(root);
    two.setColorHex("ffcc00ff");
    two.setShadingIntensity(0.25);
    two.setTextureType(-1);
    two.matrix.translate(0.5, 0, 0);
    two.matrix.rotate(45, 1, 1, 1);
    two.matrix.scale(0.2, 0.2, 0.2);
    two.render();

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