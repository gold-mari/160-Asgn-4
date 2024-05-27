class Sphere extends Polyhedron {
    
    constructor(parent) {
        super(parent);
        this.type = "sphere";
    }

    getVertices() {
        if (Sphere.vertices) {
            return Sphere.vertices;
        }
        else {
            Sphere.Initialize();
            return Sphere.vertices;
        }
    }

    getUVs() {
        if (Sphere.uvs) {
            return Sphere.uvs;
        }
        else {
            Sphere.Initialize();
            return Sphere.uvs;
        }
    }

    getNormals() {
        if (Sphere.normals) {
            return Sphere.normals;
        }
        else {
            Sphere.Initialize();
            return Sphere.normals;
        }
    }

    uvsImplemented() { return true; }
    normalsImplemented() { return true; }

    static vertices = undefined;
    static uvs = undefined;
    static normals = undefined;

    static Initialize() {
        // Generate the arrays!
        // Code from the lecture

        var faceGap = Math.PI/10;
        var faceSize = Math.PI/10;

        let vertices = [];
        let uvs = [];

        for (let t=0; t<Math.PI; t+=faceGap) {
            for (let r=0; r<2*Math.PI; r+=faceGap) {
                var p1 = [
                    Math.sin(t)*Math.cos(r), 
                    Math.sin(t)*Math.sin(r), 
                    Math.cos(t)
                ];
                var p2 = [
                    Math.sin(t+faceSize)*Math.cos(r), 
                    Math.sin(t+faceSize)*Math.sin(r), 
                    Math.cos(t+faceSize)
                ];
                var p3 = [
                    Math.sin(t)*Math.cos(r+faceSize), 
                    Math.sin(t)*Math.sin(r+faceSize), 
                    Math.cos(t)
                ];
                var p4 = [
                    Math.sin(t+faceSize)*Math.cos(r+faceSize), 
                    Math.sin(t+faceSize)*Math.sin(r+faceSize), 
                    Math.cos(t+faceSize)
                ];

                vertices = vertices.concat([
                    ...p1, ...p2, ...p4,
                    ...p1, ...p4, ...p3
                ]);

                uvs = uvs.concat([
                    0,0,  0,0,  0,0,
                    0,0,  0,0,  0,0
                ]);
            }
        }

        Sphere.vertices = new Float32Array(vertices);
        Sphere.uvs = new Float32Array(uvs);
        Sphere.normals = new Float32Array(vertices);
    }
}