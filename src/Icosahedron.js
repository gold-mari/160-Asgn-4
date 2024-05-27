class Icosahedron extends Polyhedron {
    
    constructor(parent) {
        super(parent);
        this.type = "icosahedron";
    }

    getTriangles() {
        if (Icosahedron.triangles) {
            return Icosahedron.triangles;
        }
        else {
            // Generate the triangles!
            // Principles from: http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html

            // Define vertices
            let f = 0.31; // Scaling factor for a "unit" icosahedron
            let t = f * (1 + Math.sqrt(5)) / 2; // Magic constant, roll with it

            let v = [ // vertices of our icosahedron. short variable name because we use it A LOT.
                [-f, t, 0], [f, t, 0], [-f, -t, 0], [f, -t, 0],
                [0, -f, t], [0, f, t], [0, -f, -t], [0, f, -t],
                [t, 0, -f], [t, 0, f], [-t, 0, -f], [-t, 0, f]
            ];

            Icosahedron.triangles = [
                // 5 faces around point 0
                [...v[0], ...v[11], ...v[5]],
                [...v[0], ...v[5], ...v[1]],
                [...v[0], ...v[1], ...v[7]],
                [...v[0], ...v[7], ...v[10]],
                [...v[0], ...v[10], ...v[11]],

                // 5 adjacent faces
                [...v[1], ...v[5], ...v[9]],
                [...v[5], ...v[11], ...v[4]],
                [...v[11], ...v[10], ...v[2]],
                [...v[10], ...v[7], ...v[6]],
                [...v[7], ...v[1], ...v[8]],

                // 5 adjacent faces
                [...v[4], ...v[9], ...v[5]],
                [...v[2], ...v[4], ...v[11]],
                [...v[6], ...v[2], ...v[10]],
                [...v[8], ...v[6], ...v[7]],
                [...v[9], ...v[8], ...v[1]],

                // 5 faces around point 3
                [...v[3], ...v[9], ...v[4]],
                [...v[3], ...v[4], ...v[2]],
                [...v[3], ...v[2], ...v[6]],
                [...v[3], ...v[6], ...v[8]],
                [...v[3], ...v[8], ...v[9]],
            ]

            return Icosahedron.triangles;
        }
    }

    static triangles = undefined;
}