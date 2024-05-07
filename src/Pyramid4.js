class Pyramid4 extends Polyhedron {
    
    constructor(parent) {
        super(parent);
        this.type = "pyramid4";
    }

    getTriangles() {
        return Pyramid4.triangles;
    }

    static triangles = [
        // Front
        [-0.5,-0.5,-0.5,  0,0.5,0,  0.5,-0.5,-0.5],    
        // Back
        [-0.5,-0.5,0.5,  0,0.5,0,  0.5,-0.5,0.5],  

        // Left
        [0,0.5,0,  -0.5,-0.5,0.5,  -0.5,-0.5,-0.5],  
        // Right
        [0,0.5,0,  0.5,-0.5,0.5,  0.5,-0.5,-0.5],  

        // Bottom
        [-0.5,-0.5,-0.5,  0.5,-0.5,0.5,  -0.5,-0.5,0.5],  
        [-0.5,-0.5,-0.5,  0.5,-0.5,0.5,  0.5,-0.5,-0.5]
    ];
}