import { initBuffers, initColorBuffer } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { hslToRgb } from './utils.js'

let cubeRotation = 0.0;
let cubeTranslation = [0.0, 0.0, -6.0];
let cubeTranslationLimits = [
  [0.0, -1, -6.0],
  [0.0, 1, -6.0]
]
let cubeGoUp = false
let cubeColor = 0.000

let deltaTime = 0;

  const canvas = document.querySelector("#glcanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

main();


//
// start here
//
function main() {
  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec4 aVertexColor;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;

      // Apply lighting effect

      highp vec3 ambientLight = vec3(0.01, 0.01, 0.01);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0, 1, .5));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  const fsSource = `
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);


  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
    },
  };

  

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  let then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    if(cubeGoUp) {
      cubeTranslation[1] -= deltaTime;
    } else {
      cubeTranslation[1] += deltaTime;
    }

    if(cubeTranslation[1] < cubeTranslationLimits[0][1]) {
      cubeGoUp = false
    }
    if(cubeTranslation[1] > cubeTranslationLimits[1][1]) {
      cubeGoUp = true
    }

    let newColorBuffer = initColorBuffer(gl, [
        [...hslToRgb(cubeColor, 1, 0.5), 1],
        [...hslToRgb(cubeColor+0.02, 1, 0.5), 1],
        [...hslToRgb(cubeColor+0.04, 1, 0.5), 1],
        [...hslToRgb(cubeColor+0.06, 1, 0.5), 1],
        [...hslToRgb(cubeColor+0.08, 1, 0.5), 1],
        [...hslToRgb(cubeColor+0.10, 1, 0.5), 1],
      ]
    )

    cubeColor = cubeColor+0.001 > 1 ? 0 : cubeColor+0.001, 1

    drawScene(gl, programInfo, {...buffers, color: newColorBuffer}, cubeRotation, cubeTranslation);
    cubeRotation += deltaTime;

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}



