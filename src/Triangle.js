class Triangle {

    // Constructor and setters ====

    constructor() {
        this.type = "triangle";
        this.position = {
            x: 0.0,
            y: 0.0,
            z: 0.0
        };
        this.color = {
            r: 1.0,
            g: 1.0,
            b: 1.0,
            a: 1.0
        };
        this.size = 10.0;
    }

    setPosition(x, y, z) {
        this.position = {x, y, z};
    }

    setColor(r, g, b, a) {
        this.color = {r, g, b, a};
    }

    setSize(size) {
        this.size = size;
    }

    // Render methods ====

    render() {
        let [x, y] = [this.position.x, this.position.y];
        
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, this.color.r, this.color.g, this.color.b, this.color.a);
        // Pass the size of a point to the u_Size variable
        gl.uniform1f(u_Size, this.size);

        // Size delta defined in asg1.js.
        Triangle.drawTriangle([ 
            x,                          y,
            x+(this.size*SIZE_DELTA),   y,
            x,                          y+(this.size*SIZE_DELTA)
        ]);
    }

    static drawTriangle(vertices) {

        let n = 3;

        // Create a buffer object
        let vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log("Triangle Error: drawTriangle failed. Failed to create the buffer object.");
            return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        gl.drawArrays(gl.TRIANGLES, 0, n);
    }

    static drawTriangle3D(vertices) {

        let n = vertices.length/3;

        // Create a buffer object
        let vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log("Triangle Error: drawTriangle3D failed. Failed to create the buffer object.");
            return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        gl.drawArrays(gl.TRIANGLES, 0, n);
    }

    static drawTriangle3DUV(vertices, uv) {

        if (vertices.length/3 != uv.length/2) {
            console.log("Triangle Error: drawTriangle3DUV failed.\n" + 
                        `Different number of vertices (${vertices.length/3}) and UVs (${uv.length/2}).")`);
            return -1;
        }

        let n = vertices.length/3;

        // Create a vertex buffer object
        let vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log("Triangle Error: drawTriangle3DUV failed. Failed to create the buffer object.");
            return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Create a buffer object
        let uvBuffer = gl.createBuffer();
        if (!uvBuffer) {
            console.log("Triangle Error: drawTriangle3DUV failed. Failed to create the buffer object.");
            return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        // Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, uv, gl.DYNAMIC_DRAW);
        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_UV);

        gl.drawArrays(gl.TRIANGLES, 0, n);
    }

    static drawTriangle3DUVNormal(vertices, uv, normals) {

        let n = vertices.length/3;
        if (n != uv.length/2 || n != normals.length/3) {
            console.log("Triangle Error: drawTriangle3DUV failed.\n" + 
                        `Different number of vertices (${n}), ` +
                        `UVs (${uv.length/2}), or normals (${normals.length/2}).`);
            return -1;
        }

        bindBuffer(vertices, a_Position, 3);
        bindBuffer(uv, a_UV, 2);
        bindBuffer(normals, a_Normal, 3);

        gl.drawArrays(gl.TRIANGLES, 0, n);

        // Local function for binding a buffer.
        function bindBuffer(data, attribute, size) {
            // Create a vertex buffer object
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.log("Triangle Error: drawTriangle3DUV failed. Failed to create the buffer object.");
                return -1;
            }
    
            // Bind the buffer object to target
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            // Write data into the buffer object
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            // Assign the buffer object to a_Position variable
            gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
            // Enable the assignment to a_Position variable
            gl.enableVertexAttribArray(attribute);
        }
    }
}