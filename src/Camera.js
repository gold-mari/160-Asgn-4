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
        this.baseParams = params;
        this.reset();
        this.update();
    }

    reset() {
        this.fov = this.baseParams.fov;
        this.eye = new Vector3(this.baseParams.eye);
        this.at = new Vector3(this.baseParams.at);
        this.up = new Vector3(this.baseParams.up);

        this.projectionMatrix = new Matrix4();
        this.viewMatrix = new Matrix4();

        this.movementScale = 0.1;
        this.rotationScale = 0.02;

        this.update();
    }

    update() {
        this.projectionMatrix.setPerspective(
            this.fov,                               // FOV
            this.canvas.width/this.canvas.height,   // aspect
            0.1,                                    // near
            250                                     // far
                                                    // wherever you are, i believe that the heart will go on
        );

        this.viewMatrix.setLookAt(
            ...this.eye.elements, // eye
            ...this.at.elements,  // at
            ...this.up.elements   // up
        );

        this.movedSinceLastFrame = false;
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

    getTurnVector(amount=1) {
        let step = this.getStep();
        let radius = Math.sqrt(Math.pow(step.elements[0], 2) + Math.pow(step.elements[2], 2));
        let radians = Math.atan2(step.elements[2], step.elements[0]);

        let newRadians = radians + amount*this.rotationScale;

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

        this.movedSinceLastFrame = true;
    }

    moveBackward() {
        let step = this.getStep();
        this.eye.sub(step);
        this.at.sub(step);

        this.movedSinceLastFrame = true;
    }

    moveRight() {
        let right = Vector3.cross(this.getStep(), g_camera.up);
        this.eye.add(right);
        this.at.add(right);

        this.movedSinceLastFrame = true;
    }

    moveLeft() {
        let right = Vector3.cross(this.getStep(), g_camera.up);
        this.eye.sub(right);
        this.at.sub(right);

        this.movedSinceLastFrame = true;
    }

    pan(amount) {
        let turnVector = this.getTurnVector(amount);
        this.at.set(this.eye);
        this.at.add(turnVector);

        this.movedSinceLastFrame = true;
    }
}