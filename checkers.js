/*
 * Copyright (c) 1993-1997, Silicon Graphics, Inc.
 * ALL RIGHTS RESERVED 
 * Permission to use, copy, modify, and distribute this software for 
 * any purpose and without fee is hereby granted, provided that the above
 * copyright notice appear in all copies and that both the copyright notice
 * and this permission notice appear in supporting documentation, and that 
 * the name of Silicon Graphics, Inc. not be used in advertising
 * or publicity pertaining to distribution of the software without specific,
 * written prior permission. 
 *
 * THE MATERIAL EMBODIED ON THIS SOFTWARE IS PROVIDED TO YOU "AS-IS"
 * AND WITHOUT WARRANTY OF ANY KIND, EXPRESS, IMPLIED OR OTHERWISE,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF MERCHANTABILITY OR
 * FITNESS FOR A PARTICULAR PURPOSE.  IN NO EVENT SHALL SILICON
 * GRAPHICS, INC.  BE LIABLE TO YOU OR ANYONE ELSE FOR ANY DIRECT,
 * SPECIAL, INCIDENTAL, INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY
 * KIND, OR ANY DAMAGES WHATSOEVER, INCLUDING WITHOUT LIMITATION,
 * LOSS OF PROFIT, LOSS OF USE, SAVINGS OR REVENUE, OR THE CLAIMS OF
 * THIRD PARTIES, WHETHER OR NOT SILICON GRAPHICS, INC.  HAS BEEN
 * ADVISED OF THE POSSIBILITY OF SUCH LOSS, HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, ARISING OUT OF OR IN CONNECTION WITH THE
 * POSSESSION, USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 * US Government Users Restricted Rights 
 * Use, duplication, or disclosure by the Government is subject to
 * restrictions set forth in FAR 52.227.19(c)(2) or subparagraph
 * (c)(1)(ii) of the Rights in Technical Data and Computer Software
 * clause at DFARS 252.227-7013 and/or in similar or successor
 * clauses in the FAR or the DOD or NASA FAR Supplement.
 * Unpublished-- rights reserved under the copyright laws of the
 * United States.  Contractor/manufacturer is Silicon Graphics,
 * Inc., 2011 N.  Shoreline Blvd., Mountain View, CA 94039-7311.
 *
 * OpenGL(R) is a registered trademark of Silicon Graphics, Inc.
 *
 * 2013: Ported to OpenGL 3.1 Core Profile by Alex Clarke
 * 2016: Ported to WebGL 1.0 by Alex Clarke
 * 2020: Ported to WebGL 2.0 by Alex Clarke
 */


// This variable will store the WebGL rendering context
var gl;

var points =
[
    //Square
    -2.0, -1.0,  0.0,
    -2.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     
    -2.0, -1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0, -1.0,  0.0,
     
    //Triangle
     0.0, -1.0,  0.0,
     2.0, -1.0,  0.0,
     1.0,  1.0,  0.0
 ];

var min = 0, max = 1; // increase max to have lots of checkers
// var min = -3, max = 4;

var texCoords = [
     //Square
     min, min,
     min, max,
     max, max,
     
     min, min,
     max, max,
     max, min,
     
     //Triangle
     min, min,
     max, min,
     (max+min)/2, max // fixes the triangle
 ];

/*	Create checkerboard texture	*/
var	checkImageWidth = 64;
var	checkImageHeight = 64;
var checkImage = new Uint8Array(checkImageHeight*checkImageWidth*4);

function makeCheckImage() {
    var i, j, c, idx = 0;
    
    for (i = 0; i < checkImageHeight; i++)
    {
        for (j = 0; j < checkImageWidth; j++)
        {
            // c = ( ( ((i&0x8)==0) ^ ((j&0x8)==0) ) )*255; // moves the "bit of interest"
            c = ( ( ((i&0x1)==0) ^ ((j&0x1)==0) ) )*255; // makes the zoom out messy.
            checkImage[idx++] = c;
            checkImage[idx++] = c;
            checkImage[idx++] = c;
            checkImage[idx++] = 255; // picks the colour
        }
    }
}

function makeDiagonalImage() {
    var i, j, c, idx = 0;
    
    for (i = 0; i < checkImageHeight; i++)
    {
        for (j = 0; j < checkImageWidth; j++)
        {
            if ( i > j ) c = 255;
            else c = 0;
            checkImage[idx++] = c;
            checkImage[idx++] = c;
            checkImage[idx++] = c;
            checkImage[idx++] = 255;
        }
    }
}


var texNames = []; // remembers multiple textures at the same time

var p;
var mv;
var pLoc;
var mvLoc;


window.onload = function init() {
    // Set up a WebGL Rendering Context in an HTML5 Canvas
    var canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL isn't available");
    }
    
    //  Configure WebGL
    gl.clearColor(0.5,0.5,0.5, 1.0);
    
    console.log(gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS));
    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // Set up data to draw
    //***Vertices***
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER,  flatten(points), gl.STATIC_DRAW );
    program.vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer( program.vPosition, 3, gl.FLOAT, gl.FALSE, 0, 0 );
    gl.enableVertexAttribArray( program.vPosition );
    
    //***Texture Coordinates***
    var texCoordsBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, texCoordsBuffer );
    gl.bufferData( gl.ARRAY_BUFFER,  flatten(texCoords), gl.STATIC_DRAW );
    program.vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer( program.vTexCoord, 2, gl.FLOAT, gl.FALSE, 0, 0 );
    gl.enableVertexAttribArray( program.vTexCoord );
    
    
    // Get addresses of transformation uniforms
    projLoc = gl.getUniformLocation(program, "p");
    mvLoc = gl.getUniformLocation(program, "mv");
    
    //Set up viewport
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    
    //Set up projection matrix
    p = perspective(60.0, gl.viewportWidth/gl.viewportHeight, 1.0, 30.0);
    gl.uniformMatrix4fv(projLoc, gl.FALSE, flatten(transpose(p)));
    
    //tell WebGL that the texture data will be packed tightly in memory
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); // controls how WebGL transfers blocks of data
    
    // our picture is upside down! we need to deal with the y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    //generate a checkerboard image into checkImage array in System RAM
    makeCheckImage();
        
    //Tell shader to use texture unit 0
    gl.uniform1i(gl.getUniformLocation(program, "tex"), 0); // this is defined in the fragment shader as a uniform sampler2D
    gl.uniform1i(gl.getUniformLocation(program, "tex2"), 1);

    // we can have up to 36 texture units
   
    
    //Make texture unit 0 active so that the texture binds to it
    gl.activeTexture(gl.TEXTURE0);
    
    //Create a texture name
    texNames[0] = gl.createTexture(); // every texture should be unique
    
    //Bind the texture
    gl.bindTexture(gl.TEXTURE_2D, texNames[0]);
    
    //Set texture parameters

    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // if you comment this out, the default behaviour is repeat
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT); // repeats the same square but mirrored from each other
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // preserves crip edges, good for line art. looks up texel value nearest to it.
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // makes squares look soft by blending texels, good for pictures
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    //Load texture data into WebGL from System RAM
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("mypic")); 
                  // special version of command, mip-map level, internal representation of data
                // width of 1D array buffer, height of 1D array buffer, historical thing only,
                // imageData, 
    
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S)


    // Let's create a second texture
    gl.activeTexture(gl.TEXTURE1); // 
    //Create a texture name
    texNames[1] = gl.createTexture(); // every texture should be unique
    
    //Bind the texture
    gl.bindTexture(gl.TEXTURE_2D, texNames[1]);
    //Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // preserves crip edges, good for line art. looks up texel value nearest to it.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    makeDiagonalImage(); 

    gl.texImage2D(gl.TEXTURE_2D, 0, 
                gl.RGBA, checkImageWidth, checkImageHeight,
                 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                 checkImage); // Load texture data into WebGL from System RAM

    // Or draw just before the next repaint event
    requestAnimationFrame(render);
};


// Goal: magnify 
// var z = 3.6; // we want this to be positive so we can do multiplications and not have to flip the sign
// var near = 0.1; // matches the near plane
// var far = z; // matches the far plane
// var step = 1.01; // determines how far we move every time

// Goal: minimize
var z = 3.6; // we want this to be positive so we can do multiplications and not have to flip the sign
var near = z; // matches the near plane
var far = 200; // matches the far plane
var step = 1.01; // determines how far we move every time

function render() {
    // clear the screen
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, texNames[1]); // bind texture to be full-colour
    gl.bindTexture(gl.TEXTURE_2D, texNames[0]); // blends face with textureboard
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texNames[1]);

    // draw
    gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(translate(0,0,-z))));
    gl.drawArrays(gl.TRIANGLES, 0, 9);
    
    /*
    // code below animates our checkboard into and out of the camera
    if((z > far) || (z < near)) {
        // flip around direction of step
        step = (1/step);
    }
    z *= step;
    */

    requestAnimationFrame(render);
}