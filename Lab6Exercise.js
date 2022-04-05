/*
 * Lab6Exercise.js
 * Texturing Exercise.
 *
 * Originally based on NeHe lesson 6, classic OpenGL lesson
 * Adapted for WebGL by Alex Clarke, 2016.
 * Adapted for WebGL 2 by Alex Clarke, 2020.
 */


//----------------------------------------------------------------------------
// Variable Setup
//----------------------------------------------------------------------------

// This variable will store the WebGL rendering context
var gl;

//Define points for
var cubeVerts = [
                 [ 0.5, 0.5, 0.5, 1], //0
                 [ 0.5, 0.5,-0.5, 1], //1
                 [ 0.5,-0.5, 0.5, 1], //2
                 [ 0.5,-0.5,-0.5, 1], //3
                 [-0.5, 0.5, 0.5, 1], //4
                 [-0.5, 0.5,-0.5, 1], //5
                 [-0.5,-0.5, 0.5, 1], //6
                 [-0.5,-0.5,-0.5, 1], //7
                 ];


var solidCubeStart = 0;
var solidCubeVertices = 36;


//Look up patterns from cubeVerts for different primitive types
var cubeLookups = [
                   //Solid Cube - use TRIANGLES, starts at 0, 36 vertices
                   0,4,6, //front
                   0,6,2,
                   1,0,2, //right
                   1,2,3,
                   5,1,3, //back
                   5,3,7,
                   4,5,7, //left
                   4,7,6,
                   4,0,1, //top
                   4,1,5,
                   6,7,3, //bottom
                   6,3,2,
                   ];

//load points into points array - runs once as page loads.
var points = [];
for (var i =0; i < cubeLookups.length; i++)
{
    points.push(cubeVerts[cubeLookups[i]]);
}

var left =  vec3(-1,0,0);
var right = vec3(1,0,0);
var down =  vec3(0,-1,0);
var up =    vec3(0,1,0);
var front = vec3(0,0,1);
var back =  vec3(0,0,-1);
var normals = [
               front, front, front, front, front, front,
               right, right, right, right, right, right,
               back, back, back, back, back, back,
               left, left, left, left, left, left,
               up, up, up, up, up, up,
               down, down, down, down, down, down
               ];

var min = -1, max = 2; // increase max to have lots of checkers
// we need min to be negative because we want the clamp to be centered
// you could have this be 0 but then you'd need to dynamically update the buffer
// 

var texCoords =
[
    //Texture Coordinates for Solid Cube
    //Note that each face is the same.
    max, max,	min, max,	min, min, // triangle 1
    max, max,	min, min,	max, min, // triangle 2
    
    max, max,	min, max,	min, min, // triangle 1
    max, max,	min, min,	max, min, // triangle 2
    
    max, max,	min, max,	min, min, // triangle 1
    max, max,	min, min,	max, min, // triangle 2
    
    max, max,	min, max,	min, min, // triangle 1
    max, max,	min, min,	max, min, // triangle 2
    
    max, max,	min, max,	min, min, // triangle 1
    max, max,	min, min,	max, min, // triangle 2
    
    max, max,	min, max,	min, min, // triangle 1
    max, max,	min, min,	max, min, // triangle 2
];

var red = 		 [1.0, 0.0, 0.0, 1.0];
var green = 	 [0.0, 1.0, 0.0, 1.0];
var blue = 		 [0.0, 0.0, 1.0, 1.0];
var lightred =   [1.0, 0.5, 0.5, 1.0];
var lightgreen = [0.5, 1.0, 0.5, 1.0];
var lightblue =  [0.5, 0.5, 1.0, 1.0];
var white = 	 [1.0, 1.0, 1.0, 1.0];
var black =      [0.0, 0.0, 0.0, 1.0];



//Variables for Transformation Matrices
var mv = new mat4();
var p  = new mat4();
var mvLoc, projLoc;

//Variables for Lighting
var light;
var material;
var lighting;
var uColor;

var program;

//Animation state variables
var xrot = 0, yrot = 0, zrot = 0;
var anim = false;
var lastUpdateTime = new Date().getTime();
var degreesPerSecond = 60;

//Texture variables
var texNames = []; // can remember multiple textures at the same time
var currentTexName = 0; // default value display, will show NeHe
var typeOfDisplay = 0; // default display value, will show repeating

//----------------------------------------------------------------------------
// Texture Setup Function
//----------------------------------------------------------------------------

// We are modifying this to have properties so we can do the lab.
function setUpTextures() {
    // Flip all textures - make sure pictures are right side up
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    
    // ------------
    // DEFAULT PICTURE
    // ------------
    // Create Texture Name and Bind it as current 
    gl.activeTexture(gl.TEXTURE0); // we are currently working on this
    // if we are working on multiple textures at a time (ex. if we want to blend them), then we can do multiple at once
    // this would be known as "multi-texturing"
    texNames[0] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texNames[0]); // this is the texture we put on gl.TEXTURE0
    
    //Set Texture Parameters
    // scale linearly when image bigger than texture    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // scale linearly when image smaller than texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    // Get image
    var image = document.getElementById("pic1");

    // Load image into texture object
    gl.texImage2D(gl.TEXTURE_2D,     // 2D texture
                 0,                 // level of detail 0 (full or no mipmap)
                 gl.RGB,	        // internal format - how GL will store tex.
                 gl.RGB,            // format of image data in memory
                 gl.UNSIGNED_BYTE,  // data type of image data in memory
                 image              // image itself - size is determined automatically
                 );

    // ------------
    // FIRST ELLIE PICTURE
    // ------------
    // Create Texture Name and Bind it as current 
    texNames[1] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texNames[1]);
    
    //Set Texture Parameters
    // scale linearly when image bigger than texture    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // scale linearly when image smaller than texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    // Get image
    image = document.getElementById("pic2");

    // Load image into texture object
    gl.texImage2D(gl.TEXTURE_2D,     // 2D texture
                 0,                 // level of detail 0 (full or no mipmap)
                 gl.RGB,	        // internal format - how GL will store tex.
                 gl.RGB,            // format of image data in memory
                 gl.UNSIGNED_BYTE,  // data type of image data in memory
                 image              // image itself - size is determined automatically
                 );
    
    // ------------
    // SECOND ELLIE PICTURE
    // ------------
    // Create Texture Name and Bind it as current 
    texNames[2] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texNames[2]);
    
    //Set Texture Parameters
    // scale linearly when image bigger than texture    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // scale linearly when image smaller than texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    // Get image
    image = document.getElementById("pic3");

    // Load image into texture object
    gl.texImage2D(gl.TEXTURE_2D,     // 2D texture
                 0,                 // level of detail 0 (full or no mipmap)
                 gl.RGB,	        // internal format - how GL will store tex.
                 gl.RGB,            // format of image data in memory
                 gl.UNSIGNED_BYTE,  // data type of image data in memory
                 image              // image itself - size is determined automatically
                 );
    
    // ------------
    // FOURTH ELLIE PICTURE
    // ------------
    // Create Texture Name and Bind it as current 
    texNames[3] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texNames[3]);
    
    //Set Texture Parameters
    // scale linearly when image bigger than texture    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // scale linearly when image smaller than texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    // Get image
    image = document.getElementById("pic4");

    // Load image into texture object
    gl.texImage2D(gl.TEXTURE_2D,     // 2D texture
                 0,                 // level of detail 0 (full or no mipmap)
                 gl.RGB,	        // internal format - how GL will store tex.
                 gl.RGB,            // format of image data in memory
                 gl.UNSIGNED_BYTE,  // data type of image data in memory
                 image              // image itself - size is determined automatically
                 );
}


//----------------------------------------------------------------------------
// Initialization Event Function
//----------------------------------------------------------------------------
window.onload = function init() {
    // Set up a WebGL Rendering Context in an HTML5 Canvas
    var canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");
    if (!gl)
    {
        canvas.innerHTML="WebGL isn't available";
    }
    
    //  Configure WebGL
    //  eg. - set a clear color
    //      - turn on depth testing
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    //  Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // Set up data to draw
    // Done globally in this program...
    
    // Load the data into GPU data buffers and
    // Associate shader attributes with corresponding data buffers
    //***Vertices***
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER,  flatten(points), gl.STATIC_DRAW );
    program.vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer( program.vPosition, 4, gl.FLOAT, gl.FALSE, 0, 0 );
    gl.enableVertexAttribArray( program.vPosition );
    
    //***Normals***
    normalBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer );
    gl.bufferData( gl.ARRAY_BUFFER,  flatten(normals), gl.STATIC_DRAW );
    program.vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer( program.vNormal, 3, gl.FLOAT, gl.FALSE, 0, 0 );
    gl.enableVertexAttribArray( program.vNormal );

    //***Texture Coordinates***
    texCoordBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, texCoordBuffer );
    gl.bufferData( gl.ARRAY_BUFFER,  flatten(texCoords), gl.STATIC_DRAW ); 
    /*
        // You would need to use these two to rebind a buffer if you want to dynamically change min or max
        gl.bindBuffer( gl.ARRAY_BUFFER, texCoordBuffer );
        gl.bufferData( gl.ARRAY_BUFFER,  flatten(texCoords), gl.STATIC_DRAW ); 
    */
    program.vTexCoords = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer( program.vTexCoords, 2, gl.FLOAT, gl.FALSE, 0, 0 );
    gl.enableVertexAttribArray( program.vTexCoords );
    
    // Get addresses of transformation uniforms
    projLoc = gl.getUniformLocation(program, "p");
    mvLoc = gl.getUniformLocation(program, "mv");
    
    //Set up viewport
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    
    //Set up projection matrix
    p = perspective(45.0, gl.viewportWidth/gl.viewportHeight, 0.1, 100.0);
    gl.uniformMatrix4fv(projLoc, gl.FALSE, flatten(transpose(p)));
    
    
    // Get and set light uniforms
    light = [];   // array of light property locations (defined globally)
    var n = 1;    // number of lights - adjust to match shader
    for (var i = 0; i < n; i++)
    {
        light[i] = {};   // initialize this light object
        light[i].diffuse = gl.getUniformLocation(program,"light["+i+"].diffuse");
        light[i].ambient = gl.getUniformLocation(program,"light["+i+"].ambient");
        light[i].position = gl.getUniformLocation(program,"light["+i+"].position");
        light[i].specular = gl.getUniformLocation(program,"light["+i+"].specular");
        
        //initialize light 0 to default of white light coming from viewer
        if (i == 0)
        {
            gl.uniform4fv(light[i].diffuse, white);
            gl.uniform4fv(light[i].ambient, vec4(0.2, 0.2, 0.2, 1.0));
            gl.uniform4fv(light[i].position,vec4(0.0, 0.0, 1.0, 0.0));
            gl.uniform4fv(light[i].specular,white);
        }
        else //disable all other lights
        {
            gl.uniform4fv(light[i].diffuse, black);
            gl.uniform4fv(light[i].ambient, black);
            gl.uniform4fv(light[i].position,black);
        }
    }
    
    // Get and set material uniforms
    material = {};
    material.diffuse = gl.getUniformLocation(program, "material.diffuse");
    material.ambient = gl.getUniformLocation(program, "material.ambient");
    material.specular = gl.getUniformLocation(program, "material.specular");
    material.shininess = gl.getUniformLocation(program, "material.shininess");
    gl.uniform4fv(material.diffuse, vec4(0.8, 0.8, 0.8, 1.0));
    gl.uniform4fv(material.ambient, vec4(0.8, 0.8, 0.8, 1.0));
    gl.uniform4fv(material.specular, vec4(0.3, 0.3, 0.3, 1.0));
    gl.uniform1f(material.shininess, 15);
    
    // Get and set other lighting state
    lighting = gl.getUniformLocation(program, "lighting");
    uColor = gl.getUniformLocation(program, "uColor");
    gl.uniform1i(lighting, 1);
    gl.uniform4fv(uColor, white);
    
    // Set up textures
    // By default, we are looking at texture unit 0
    setUpTextures();
    requestAnimationFrame(animate);
};

//----------------------------------------------------------------------------
// Rendering Event Function
//----------------------------------------------------------------------------
function render()
{
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    
    //Set initial view
    var eye = vec3(0.0, 0.0, 2.5);
    var at =  vec3(0.0, 0.0, 0.0);
    var up =  vec3(0.0, 1.0, 0.0);
    
    mv = lookAt(eye,at,up);
    
    // testing... 
    // currentTexName = 2; // should display the texture in the array
    gl.activeTexture(gl.TEXTURE0); // there is an evil active texture somewhere. 

    // Choose the texture to attach to the texture unit
    gl.bindTexture(gl.TEXTURE_2D, texNames[currentTexName]); // swaps texture on an active unit

    // Now, we will allow for the dynamic changing of the type of image display
    if (typeOfDisplay == 1) { // we want to clamp the image
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // commenting this out only displays bottom row
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // commenting this out only displays left column
    }
    else { // we want to quite simply repeat the image
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    //draw cube
    mv = mult(mv, rotate(xrot,vec3(1,0,0)));
    mv = mult(mv, rotate(yrot,vec3(0,1,0)));
    mv = mult(mv, rotate(zrot,vec3(0,0,1)));
    gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
    gl.drawArrays(gl.TRIANGLES, 0, 36);	
}

//----------------------------------------------------------------------------
// Animation Function
//----------------------------------------------------------------------------
function animate() {
    var currentTime = new Date().getTime();
    var elapsed_sec = (currentTime - lastUpdateTime)/1000;
    lastUpdateTime = currentTime;
    if(anim)
    {
        var baseRot = degreesPerSecond*elapsed_sec;
        xrot += baseRot;
        yrot += baseRot;
        zrot += baseRot;
    }
    setUpTextures();
    render();
    requestAnimationFrame(animate);
}


//----------------------------------------------------------------------------
// Simpler Key Handling than Lab 3 Robot Arm
// Cannot recognize difference between shifted and unshifted keys
//----------------------------------------------------------------------------
document.onkeydown = function handleKeyDown(event) {
   // Get unshifted key character
   var c = event.keyCode;
   var key = String.fromCharCode(c);

	//Place key down detection code here
    if (key == "A") {
        anim = !anim;
    }

    // The below code allows us to swap between what image is displayed.
    if (key == "1") {
        currentTexName = 1;
    }
    // Swaps to the second image available
    if (key == "2") {
        currentTexName = 2;
    }
    // Swaps to the third image
    if (key == "3") {
        currentTexName = 3;
   }
   // Swaps to the default image
   if (key == "0") {
       currentTexName = 0;
   }

   // Repeats the image being displayed. This is the default view.
   if (key == "R") {
       typeOfDisplay = 0;
   }

   // Clamps the image in the middle of the screen
   if (key == "C") {
       // reload buffer OR set the values of min/max at the beginning of the program
       typeOfDisplay = 1;
   }
}