class CubeMap {
    constructor() {
        this.map = [];
        for (let x = 0; x < 8; x++) {
            let row = [];
            for (let z = 0; z < 8; z++) {
                row.push(CubeMap.randInt(4));
            }
            this.map.push(row);
        }

        console.log(this.map);
    }

    render(parent) {
        for (let x = 0; x < 8; x++) {
            let row = this.map[x];
            for (let z = 0; z < 8; z++) {
                let tileHeight = row[z];

                if (tileHeight != 0) {
                    let cube = new Cube(parent);
                    cube.setTextureType(2);
                    cube.matrix.translate(x-4, 0, z-4);
                    cube.matrix.scale(0.2, 0.2*tileHeight, 0.2);
                    cube.render();
                }
            }
        }
    }

    static randInt(max) {
        return Math.floor(Math.random() * (max+1));
    }
}