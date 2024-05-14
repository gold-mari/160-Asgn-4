class Camera {

    constructor(
        canvas,
        params={
            fov: 60,
            eye: new Vector3([0,0,0]),
            at: new Vector3([0,0,-1]),
            up: new Vector3([0,1,0]),
        }
    ) {
        this.canvas = canvas;

        this.fov = params.fov;
        this.eye = params.eye;
        this.at = params.at;
        this.up = params.up;

        this.projectionMatrix = new Matrix4();
        this.viewMatrix = new Matrix4();

        this.movementScale = 0.1;
        this.rotationScale = 0.02;

        this.recalculateMatrices();
    }

    recalculateMatrices() {
        this.projectionMatrix.setPerspective(
            this.fov,                               // FOV
            this.canvas.width/this.canvas.height,   // aspect
            0.1,                                    // near
            100                                     // far
        );

        this.viewMatrix.setLookAt(
            ...this.eye.elements, // eye
            ...this.at.elements,  // at
            ...this.up.elements   // up
        );
    }

    // ================================
    // Movement code
    // ================================

    getStep() {
        let step = new Vector3(this.at);
        step.sub(this.eye);
        step.normalize();
        step.mul(this.movementScale);

        return step;
    }

    getTurnVector(panRight) {
        let step = this.getStep();
        let radius = Math.sqrt(Math.pow(step.elements[0], 2) + Math.pow(step.elements[2], 2));
        let radians = Math.atan2(step.elements[2], step.elements[0]);
        let newRadians = (panRight) ? radians+this.rotationScale : radians-this.rotationScale;

        let turnVector = new Vector3([
            radius * Math.cos(newRadians),
            0,
            radius * Math.sin(newRadians)
        ]);

        return turnVector;
    }

    moveForward() {
        let step = this.getStep();
        this.eye.add(step);
        this.at.add(step);
    }

    moveBackward() {
        let step = this.getStep();
        this.eye.sub(step);
        this.at.sub(step);
    }

    moveRight() {
        let right = Vector3.cross(this.getStep(), g_Camera.up);
        this.eye.add(right);
        this.at.add(right);
    }

    moveLeft() {
        let right = Vector3.cross(this.getStep(), g_Camera.up);
        this.eye.sub(right);
        this.at.sub(right);
    }

    panRight() {
        let turnVector = this.getTurnVector(true);
        this.at.set(this.eye);
        this.at.add(turnVector);
    }

    panLeft() {
        let turnVector = this.getTurnVector(false);
        this.at.set(this.eye);
        this.at.add(turnVector);
    }
}