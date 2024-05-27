// ================================================================
// Global variables
// ================================================================

// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;

    attribute vec4 a_Position;
    attribute vec2 a_UV;
    attribute vec3 a_Normal;

    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_VertPos;

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    uniform mat4 u_NormalMatrix;

    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
        
        v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));

        v_VertPos = u_ModelMatrix * a_Position;
    }`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;

    varying vec2 v_UV;
    varying vec3 v_Normal;
    uniform vec4 u_FragColor;
    varying vec4 v_VertPos;

    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;

    uniform int u_whichTexture;
    uniform bool u_litMaterial;

    uniform vec3 u_pointpointLightPos;
    uniform vec3 u_cameraPos;
    uniform bool u_showLight;
    uniform vec3 u_lightColor;

    void main() {
        if (u_whichTexture == -3) {
            // Use normal debug color
            gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
        } else if (u_whichTexture == -2) {
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

        if (u_showLight && u_litMaterial) {
            // N dot L
            vec3 lightVector = u_pointpointLightPos-vec3(v_VertPos);
            float r = length(lightVector);
            vec3 N = normalize(v_Normal);
            vec3 L = normalize(lightVector);
            float nDotL = max(0.0, dot(N,L));

            // Specular
            vec3 reflection = reflect(-L, N);
            vec3 eye = normalize(u_cameraPos-vec3(v_VertPos));
            float specularAmount = pow(max(dot(eye, reflection), 0.0), 100.0);

            vec3 ambient = (vec3(u_lightColor) * vec3(gl_FragColor)) * 0.3;
            vec3 diffuse = (vec3(u_lightColor) * vec3(gl_FragColor)) * nDotL;
            vec3 specular = vec3(u_lightColor) * specularAmount;
            gl_FragColor = vec4(diffuse+ambient+specular, 1.0);
        }
    }`;

let canvas;
let gl;

let a_Position;
let a_UV;
let a_Normal;

let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_NormalMatrix;
let u_In
let u_FragColor;
let u_whichTexture;
let u_litMaterial;
let u_pointpointLightPos;
let u_cameraPos;
let u_showLight;
let u_lightColor;

let g_textureSources = [
    '../resources/horse.png',
    '../resources/dylan.png',
    '../resources/sea.png',
    '../resources/sky.png',
];
let u_Samplers = [];
let g_Textures = [];

let g_dragStartAngle = [0, 0];
let g_dragStartMousePos = [0, 0];

let g_lastMouse = undefined;
let g_camera = undefined;

let g_map = undefined;
let g_renderAngle = 70;
let g_renderDistance = 40;
let g_cubesDrawn = 0;

let g_startTime = 0;
let g_seconds = 0;

let g_music = undefined;

let g_showNormals = false;
let g_showLight = true;

let g_pointpointLightPosition = [0, 0.5, 0];
let g_lightColor = [1, 1, 1];

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

    g_camera = new Camera(canvas, {
        fov: 50,
        eye: new Vector3([0,1,4]),
        at: new Vector3([0,1,-2]),
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

    // Setup the cubemap
    g_map = new CubeMap();

    g_startTime = performance.now()/1000;
    requestAnimationFrame(tick);
}

function tick() {
    let delta = g_seconds;
    g_seconds = performance.now()/1000 - g_startTime;
    delta = g_seconds - delta;

    // console.log(Math.sin(g_seconds));

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
    a_Normal = getAttrib('a_Normal');

    u_FragColor = getUniform('u_FragColor');
    u_ModelMatrix = getUniform('u_ModelMatrix');
    u_ViewMatrix = getUniform('u_ViewMatrix');
    u_ProjectionMatrix = getUniform('u_ProjectionMatrix');
    u_NormalMatrix = getUniform('u_NormalMatrix');
    u_whichTexture = getUniform('u_whichTexture');
    u_litMaterial = getUniform('u_litMaterial');
    u_pointpointLightPos = getUniform('u_pointpointLightPos');
    u_cameraPos = getUniform('u_cameraPos');
    u_showLight = getUniform('u_showLight');
    u_lightColor = getUniform('u_lightColor');

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
    // Play music
    let g_music = document.getElementById("music");

    // Initialize dynamic text
    sendTextTOHTML("distanceLabel", `Render Distance (current: ${g_renderDistance})`);
    sendTextTOHTML("pointLightPosLabel", `Point Light Position (current: ${g_pointpointLightPosition})`);
    sendTextTOHTML("lightColorLabel", `Light Color (current: ${RGBListToHexstring(g_lightColor)})`);
    sendTextTOHTML("angleLabel", `Render Angle (current: ${g_renderAngle})`);
    
    // Render distance slider
    let distance = document.getElementById("distance");
    distance.addEventListener("input", function() {
        g_renderDistance = this.value;
        sendTextTOHTML("distanceLabel", `Render Distance (current: ${g_renderDistance})`);
    });

    // Render angle slider
    let angle = document.getElementById("angle");
    angle.addEventListener("input", function() {
        g_renderAngle = this.value;
        sendTextTOHTML("angleLabel", `Render Angle (current: ${g_renderAngle})`);
    });

    // Reset sliders button
    let resetSliders = document.getElementById("resetSliders");
    resetSliders.addEventListener("mousedown", function() {
        g_renderDistance = distance.value = 40
        sendTextTOHTML("distanceLabel", `Render Distance (current: ${g_renderDistance})`);
        g_renderAngle = angle.value = 70;
        sendTextTOHTML("angleLabel", `Render Angle (current: ${g_renderAngle})`);
        g_pointpointLightPosition = [0, 0.5, 0]
        pointLightPosX.value = g_pointpointLightPosition[0];
        pointLightPosY.value = g_pointpointLightPosition[1];
        pointLightPosZ.value = g_pointpointLightPosition[2];
        sendTextTOHTML("pointLightPosLabel", `Point Light Position (current: ${g_pointpointLightPosition})`);
        g_lightColor = [1, 1, 1]
        lightColorR.value = g_lightColor[0];
        lightColorG.value = g_lightColor[1];
        lightColorB.value = g_lightColor[2];
        sendTextTOHTML("lightColorLabel", `Light Color (current: ${RGBListToHexstring(g_lightColor)})`);
    });

    // Reset camera button
    let resetCamera = document.getElementById("resetCamera");
    resetCamera.addEventListener("mousedown", function() {
        g_camera.reset();
    });

    // Toggle normals button
    let toggleNormals = document.getElementById("toggleNormals");
    toggleNormals.value = "Toggle Normals (Off)";
    toggleNormals.addEventListener("mousedown", function() {
        g_showNormals = !g_showNormals;
        toggleNormals.value = `Toggle Normals (${g_showNormals ? "On" : "Off"})`;
    });

    // Toggle lights button
    let toggleLight = document.getElementById("toggleLight");
    toggleLight.value = "Toggle Lights (On)";
    toggleLight.addEventListener("mousedown", function() {
        g_showLight = !g_showLight;
        toggleLight.value = `Toggle Lights (${g_showLight ? "On" : "Off"})`;
    });

    let pointLightPosX = document.getElementById("pointLightPosX");
    let pointLightPosY = document.getElementById("pointLightPosY");
    let pointLightPosZ = document.getElementById("pointLightPosZ");
    [pointLightPosX, pointLightPosY, pointLightPosZ].forEach((slider, index) => {
        slider.addEventListener("input", function() {
            g_pointpointLightPosition[index] = this.value;
            sendTextTOHTML("pointLightPosLabel", `Point Light Position (current: ${g_pointpointLightPosition})`);
        });
    });

    let lightColorR = document.getElementById("lightColorR");
    let lightColorG = document.getElementById("lightColorG");
    let lightColorB = document.getElementById("lightColorB");
    [lightColorR, lightColorG, lightColorB].forEach((slider, index) => {
        slider.addEventListener("input", function() {
            g_lightColor[index] = this.value;
            sendTextTOHTML("lightColorLabel", `Light Color (current: ${RGBListToHexstring(g_lightColor)})`);
        });
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
        g_lastMouse = [x, y];
    } else {
        // Continuing a drag.
        let deltaX = x-g_lastMouse[0];
        g_camera.pan(deltaX * 20);

        g_lastMouse = [x, y];
    }
}

function keydown(ev) {

    if (ev.keyCode == 87) g_camera.moveForward();
    if (ev.keyCode == 83) g_camera.moveBackward();

    if (ev.keyCode == 65) g_camera.moveLeft();
    if (ev.keyCode == 68) g_camera.moveRight();

    if (ev.keyCode == 81) g_camera.pan(-1);
    if (ev.keyCode == 69) g_camera.pan(1);
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
    g_camera.update();
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);

    // Update light-related stuff
    let lightAnimPos = [
        Number(g_pointpointLightPosition[0]) + Math.sin(g_seconds),
        g_pointpointLightPosition[1],
        Number(g_pointpointLightPosition[2]) + Math.cos(g_seconds)
    ];
    gl.uniform3f(u_pointpointLightPos, ...lightAnimPos);
    gl.uniform3f(u_cameraPos, ...g_camera.eye.elements);
    gl.uniform1i(u_showLight, g_showLight);
    gl.uniform3f(u_lightColor, ...g_lightColor);

    // Clear <canvas>
    clearCanvas();

    let root = new Cube();
    root.matrix.translate(0, 0, 0);
    root.matrix.scale(1, 1, 1);

    let horseCube = new Cube(root);
    horseCube.setColorHex("ffcc00ff");
    horseCube.matrix.translate(0, 1, 0);
    horseCube.setShadingIntensity(0.25);
    horseCube.setTextureType(g_showNormals ? -3 : 0);
    horseCube.matrix.scale(0.5, 0.5, 0.5);
    horseCube.render();

    let meCube = new Cube(root);
    meCube.setColorHex("ffcc00ff");
    meCube.setShadingIntensity(0.25);
    meCube.setTextureType(g_showNormals ? -3 : 1);
    meCube.matrix.translate(0.5, 1, 0);
    meCube.matrix.rotate(45, 1, 1, 1);
    meCube.matrix.scale(0.2, 0.2, 0.2);
    meCube.render();

    let sky = new Cube(root);
    sky.setTextureType(g_showNormals ? -3 : 3);
    sky.matrix.rotate(g_seconds*0.3, 1, 1, 1);
    sky.matrix.scale(256, 256, 256);
    sky.setLitMaterial(false);
    sky.render();

    let sea = new Cube(root);
    sea.setTextureType(g_showNormals ? -3 : 2);
    sea.matrix.translate(0, 0, 0);
    sea.matrix.scale(256, 0, 256);
    sea.render();

    let orb = new Sphere(root);
    orb.setColorHex("ffcc00ff");
    orb.setTextureType(g_showNormals ? -3 : -2);
    orb.matrix.translate(-2.5, 0.5, -4);
    orb.matrix.scale(1, 1, 1);
    orb.render();

    let pointLight = new Cube(root);    
    pointLight.setColorHex("ff00ffff");
    pointLight.setTextureType(-2);
    pointLight.matrix.translate(...lightAnimPos);
    pointLight.matrix.scale(0.05, 0.05, 0.05);
    pointLight.setColor(g_lightColor[0], g_lightColor[1], g_lightColor[2], 1)
    pointLight.setLitMaterial(false);
    pointLight.render();

    g_cubesDrawn = g_map.render(root, g_seconds, g_camera, g_renderDistance, g_renderAngle, g_showNormals);

    updatePerformanceDebug(startTime, performance.now());
}

// ================================================================
// Utility methods
// ================================================================

function updatePerformanceDebug(start, end) {
    let duration = end-start;
    sendTextTOHTML("performance",
                        `ms: ${Math.floor(duration)} | ` +
                        `fps: ${Math.floor(1000/duration)/10}` +
                        `<br>cubes drawn: ${g_cubesDrawn + 2}`); // Plus 2 for ground + skybox
}

function sendTextTOHTML(htmlID, text) {
    let htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log(`Failed to get ${htmlID} from HTML.`);
        return;
    }
    htmlElm.innerHTML = text;
}

function RGBListToHexstring(RGBlist) {
    return `#${Math.round(RGBlist[0]*255).toString(16)}` +
            `${Math.round(RGBlist[1]*255).toString(16)}` +
            `${Math.round(RGBlist[2]*255).toString(16)}`;
}