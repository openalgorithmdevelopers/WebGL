var WebGL = function () {
	var gl, shaderProgram;

	gl = initializeWebGL(gl);

	//Step 1 (Set background color): First specify the color with the help of Quadlet(R,G,B,Alpha) and the clear the buffer related to background.
	gl.clearColor(0, 0, 0, 1.0);	
	gl.clear(gl.COLOR_BUFFER_BIT);
	//Note: The default background color in WebGl is white.

	//Step 2 (Speficy vertices data): Speficy the coordinates (X,Y,Z) of the geometry and other information related to each coordinates.
	var verticesDataArrayJS = 
	[	// X, Y, Z           
		-0.3, 0.7, 0,   //A
		0.3, 0.7, 0, 	//B
		0, 0, 0,		//C
		0.3, -0.7, 0, 	//D
		-0.3, -0.7, 0  	//E
	];  

	//Step 3 (Specify how to connect the points): Specify the order with which the coordinates defined in Step2 will be joined.
	var IndicesArrayJS =
	[
	// A-0, B-1, C-2, D-3, E-4
		0, 1, 2, 		//ABC
		2, 3, 4 		//CDE		
	];

	//Step 4 (Create GPU meomry buffer): In the GPU for holding vertices data of type ARRAY_BUFFER.
	var rectVBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, rectVBO);

	//Step 5 (Pass the vertices data to the buffer created previously).
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesDataArrayJS), gl.STATIC_DRAW);

	//Step 6 (Pass the indices data to GPU buffer): repeat the steps 4 and 5 for the indices data but use ELEMENT_ARRAY_BUFFER.
	var rectIBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectIBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(IndicesArrayJS), gl.STATIC_DRAW);

	//Seven Steps Shader side coding in JS to get the shader program.
	shaderProgram = getShaderProgram(gl);

	//Step 14 (Use the shader program):
	gl.useProgram(shaderProgram);

	//Step 15 (Get access to GPU's geometry coordinates): Get the pointer to the geometry coordinates defined in vertex shader through the shader program.
	var positionAttribLocation = gl.getAttribLocation(shaderProgram, 'geometryCoordinatesGPU');
	var tranMatGPUPointer = gl.getUniformLocation(shaderProgram, 'tranMatGPU');
	
	//Step 16 (Enable Vertex Attribute Array): It enables the pointer defined in Step 8 to access the vertex buffered data.
	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(tranMatGPUPointer);

	//Step 17 (Buffer data definition): Define how the data on the GPU buffer is arranged. SO that the pointer defined in Step 8 can access the data from the buffer.
	gl.vertexAttribPointer(
		positionAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	

	//Step 18 (Draw the geometry): Issue the draw command to generate the geometry as defined by the indices and the type of primitive to create.
	var angle = 45;
	var radian = angle*(3.14/180);
	var Sx = 0.5, Sy = 0.5;
	var m = 0.5, n = 0.5;
	var tranArrayJS = new Float32Array(16);
	//tranArrayJS = [1,0,0,0,		0,1,0,0,	0,0,1,0,	m,n,0,1];	//for translation
	//tranArrayJS = [Math.cos(radian),-Math.sin(radian),0,0,	Math.sin(radian),Math.cos(radian),0,0,	0,0,1,0,	0,0,0,1];	//for rotation
	//tranArrayJS = [Sx,0,0,0,		0,Sy,0,0,	0,0,1,0,	0,0,0,1];	//for scaling
	tranArrayJS = [Sx*Math.cos(radian),- Sx*Math.sin(radian),0,0,	Sy*Math.sin(radian),Sy*Math.cos(radian),0,0,	0,0,1,0,	m,n,0,1];	//for composite transformation
	
	gl.uniformMatrix4fv(tranMatGPUPointer, gl.FALSE, tranArrayJS);
	gl.drawElements(gl.TRIANGLES, IndicesArrayJS.length, gl.UNSIGNED_SHORT, 0);
}

function initializeWebGL(gl)
{
	var canvas = document.getElementById('canvas');

	canvas.width = window.innerWidth;;
	canvas.height = window.innerHeight;;

	gl = canvas.getContext('webgl');

	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Your browser does not support WebGL');
		return;
	}
	return gl;
}

//Seven steps of Shader side coding
function getShaderProgram(gl)
{
	//Step 7 (Define vertex shader text): Define the code of the vertex shader in the form of JS text.
	var vertexShaderText = 
	' precision mediump float; ' +
	' attribute vec3 geometryCoordinatesGPU; ' +
	' uniform mat4 tranMatGPU; ' +
	' void main() ' +
	' { ' +
	'		gl_Position = tranMatGPU * vec4(geometryCoordinatesGPU, 1.0); ' +
	' } ';

	//Step 8 (Create actual vertex shader): Create the actual vertex shader with the text defined in Step 1.
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderText);

	//Step 9 (Compile vertex shader):
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}

	//Step 10: Repeat the above 3 steps for fragment shader.
	var fragmentShaderText =
	' void main() ' +
	' { ' +
	'  		gl_FragColor = vec4(0, 1, 0, 1); ' +
	' } ';

	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

	//Step 11 (Shader program): With the compiled vertex and fragment shader, create the shader program.
	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);

	//Step 12 (Link shader program): 
	gl.linkProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(shaderProgram));
		return;
	}

	//Step 13 (Validate Shader program): Checks if the shader program has been succesfully linked and can be used further.
	gl.validateProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(shaderProgram));
		return;
	}
	return shaderProgram;
}