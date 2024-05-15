class CubeMap {
    constructor() {
        this.map = [];
        this.mapSize = [256, 256];

        for (let x = 0; x < this.mapSize[0]; x++) {
            let row = [];
            for (let z = 0; z < this.mapSize[1]; z++) {
                row.push(CubeMap.rand(4,4));
            }
            this.map.push(row);
        }
    }

    render(parent, seconds, camera, renderDistance=40, renderAngle=70) {
        let inView = 0;

        let cube = new Cube(parent);
        for (let x = 0; x < this.mapSize[0]; x++) {

            let row = this.map[x];
            for (let z = 0; z < this.mapSize[1]; z++) {

                let tileHeight = row[z];

                // Calculate if this cube is clsoe enough to render.
                let coords = [x-this.mapSize[0]/2, z-this.mapSize[1]/2];
                let cubePos = new Vector3([
                    coords[0],
                    0,
                    coords[1],
                ]);
                cubePos.sub(camera.eye);

                // If the tile is within our render distance...
                if (cubePos.magnitude() <= renderDistance) {
                    // If this tile has a nonzero height...
                    if (tileHeight != 0) {
                        // Big optimization: don't render cubes that aren't visible.
                        // Calculate, based on the cube's position, the direction we're facing,
                        // and our field of view, whether or not the cue is visible.
                        let facing = camera.getStep();

                        let angleFromFacing = Math.acos(
                            // Angle between two vectors formula from WikiHow:
                            // https://www.wikihow.com/Find-the-Angle-Between-Two-Vectors
                            Vector3.dot(cubePos, facing) 
                            / 
                            (cubePos.magnitude()*facing.magnitude())
                        ) * 180/Math.PI; // Normalize to degrees

                        // If the cube's angle from our camera is within our FOV... 
                        if (angleFromFacing <= renderAngle) {
                            
                            cube.setTextureType(2);

                            cube.matrix.setTranslate(coords[0], Math.sin(seconds+x+z)*0.2+0.01, coords[1]);
                            cube.matrix.scale(1, tileHeight*0.1, 1);
                            cube.render();

                            inView++;
                        }
                    }
                }
            }
        }

        return inView;
    }

    static rand(max, bias=3) {
        return Math.floor(Math.pow(Math.random(),bias) * (max+1));
    }
}