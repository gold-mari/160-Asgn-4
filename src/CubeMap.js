class CubeMap {
    constructor() {
        this.map = [];
        this.mapSize = [32, 32]
        for (let x = 0; x < this.mapSize[0]; x++) {
            let row = [];
            for (let z = 0; z < this.mapSize[1]; z++) {
                row.push(CubeMap.rand(4));
            }
            this.map.push(row);
        }

        console.log(this.map);
    }

    render(parent) {
        let cube = new Cube(parent);
        for (let x = 0; x < this.mapSize[0]; x++) {
            let row = this.map[x];
            for (let z = 0; z < this.mapSize[1]; z++) {
                let tileHeight = row[z];

                if (tileHeight != 0) {     
                    // let cube = new Cube(parent);    
                    cube.setTextureType(2);
                    cube.matrix.setTranslate(x-this.mapSize[0]/2, 0.01, z-this.mapSize[1]/2);
                    cube.matrix.scale(1, tileHeight*0.25, 1);
                    cube.render();
                }
            }
        }
    }

    static rand(max) {
        return Math.floor(Math.pow(Math.random(),3) * (max+1));
    }
}