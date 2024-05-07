class Polyhedron {

    // Constructor and setters ====

    constructor(parent) {
        this.type = undefined;
        this.shadingIntensity = 0.5;
        this.color = {
            r: 1.0,
            g: 1.0,
            b: 1.0,
            a: 1.0
        };

        if (!parent) {
            this.matrix = new Matrix4();
        } else {
            this.matrix = new Matrix4(parent.matrix);
            this.color = parent.color;
        }
    }

    setColor(r, g, b, a) {
        this.color = {r, g, b, a};
    }

    setColorHex(hex) {
        // Regex from https://stackoverflow.com/a/6259543
        let hexChunks = hex.match(/.{1,2}/g);
        this.color = {
            r: Number(`0x${hexChunks[0]}`)/255,
            g: Number(`0x${hexChunks[1]}`)/255,
            b: Number(`0x${hexChunks[2]}`)/255,
            a: Number(`0x${hexChunks[3]}`)/255
        };
    }

    setShadingIntensity(value) {
        this.shadingIntensity = value;
    }

    // Render methods ====
    render() {
        // Pass the model matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Pass the color of a point to u_FragColor variable
        let triangles = this.getTriangles();
        let finalFalloff = 1-this.shadingIntensity;
        let falloff = 1;

        for (let i = 0; i < triangles.length; i++) {
            falloff = Polyhedron.lerp(1, finalFalloff, (i/triangles.length));
            
            gl.uniform4f(u_FragColor, this.color.r*falloff, this.color.g*falloff, this.color.b*falloff, 1);

            Triangle.drawTriangle3D(triangles[i]);
        }
    }

    getTriangles() {
        return Polyhedron.triangles;
    }

    static triangles = [];

    static lerp(start, end, amount) {
        return (1-amount)*start + amount*end;
    }
}