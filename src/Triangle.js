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
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        gl.drawArrays(gl.TRIANGLES, 0, n);
    }
}