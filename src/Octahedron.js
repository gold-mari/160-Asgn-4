class Octahedron extends Polyhedron {
    
    constructor(parent) {
        super(parent);
        this.type = "octahedron";
    }

    getTriangles() {
        return Octahedron.triangles;
    }

    static triangles = [
        // If we're making a precise octahedron, 0.354 would be exactly 1/2sqrt(2), but it's okay.
        // Top
            // Front
            [-0.354,0,-0.354,  0,0.5,0,  0.354,0,-0.354],    
            // Back
            [-0.354,0,0.354,  0,0.5,0,  0.354,0,0.354],  
            // Left
            [0,0.5,0,  -0.354,0,0.354,  -0.354,0,-0.354],  
            // Right
            [0,0.5,0,  0.354,0,0.354,  0.354,0,-0.354],

        // Bottom
            // Front
            [-0.354,0,-0.354,  0,-0.5,0,  0.354,0,-0.354],    
            // Back
            [-0.354,0,0.354,  0,-0.5,0,  0.354,0,0.354],  
            // Left
            [0,-0.5,0,  -0.354,0,0.354,  -0.354,0,-0.354],  
            // Right
            [0,-0.5,0,  0.354,0,0.354,  0.354,0,-0.354],
    ];
}