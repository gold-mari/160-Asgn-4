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

        this.textureType = undefined;
        this.setTextureType(0);

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

    setTextureType(num) {
        // -2: Fragment color
        // -1: UV debug color
        // 0: texture0
        // The polyhedron will be rendered yellow if textureType is none of these.

        // If UVs aren't implemented, default to the frag color.
        if (this.uvsImplemented()) {
            this.textureType = num;
        } else {
            this.textureType = -2; 
        }
        
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
        // Pass in the texture type.
        gl.uniform1i(u_whichTexture, this.textureType);

        // Pass the color of a point to u_FragColor variable
        let triangles = this.getTriangles();
        let finalFalloff = 1-this.shadingIntensity;
        let falloff = 1;

        for (let i = 0; i < triangles.length; i++) {
            falloff = Polyhedron.lerp(1, finalFalloff, (i/triangles.length));
            
            gl.uniform4f(u_FragColor, this.color.r*falloff, this.color.g*falloff, this.color.b*falloff, 1);

            if (this.uvsImplemented()) {
                Triangle.drawTriangle3DUV(triangles[i][0], triangles[i][1]);
            } else {
                Triangle.drawTriangle3D(triangles[i]);
            }
            
        }
    }

    getTriangles() {
        return Polyhedron.triangles;
    }

    uvsImplemented() {
        return false;
    }

    static triangles = [];

    static lerp(start, end, amount) {
        return (1-amount)*start + amount*end;
    }
}