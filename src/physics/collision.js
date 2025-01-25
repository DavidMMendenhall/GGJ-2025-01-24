// @ts-check

/**
 * @typedef Collision
 * @prop {(point:number[])=>number} distance
 * @prop {(point:number[])=>number[]} nearestPoint
 * @prop {(point:number[], radius:number)=>boolean} collideCircle
 */



/**
 * Projects u on to v
 * @param {[number, number]} u 
 * @param {[number, number]} v 
 */
const project = (u, v) => {
    let j = dot(u, v) / (v[0] ** 2 + v[1] ** 2);
    return [v[0] * j, v[1] * j ];
}



/**
 * 
 * @param {number[]} param0
 * @returns 
 */
const normalize = ([x, y]) => {
    let mag = Math.sqrt(x ** 2 + y ** 2);
    if (mag === 0){
        return [0, 0];
    }
    return [x / mag, y / mag];
}

/**
 * 
 * @param {number[]} point 
 * @param {number[]} plane 
 * @returns 
 */
let pointPlaneDistance = (point, plane) => {
    return dot(point, plane) + plane[2];
}

/**
 * 
 * @param {number[]} a 
 * @param {number[]} b 
 */
let dot = (a, b) => {
    return a[0] * b[0] + a[1] * b[1];
}


/**
 * 
 * @param {number[]} p1 
 * @param {number[]} p2 
 * @returns 
 */
let pointDistance = (p1, p2) => {
    return  Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
}

/**
 * 
 * @param {number[]} p1 
 * @param {number[]} p2
 * @returns {Collision}
 */
let line = (p1 , p2) => {
    const [x0, y0] = p1;
    const [x1, y1] = p2;
    let dx = x0 - x1;
    let dy = y0 - y1;
    let length = Math.sqrt(dx ** 2 + dy ** 2);
    let xm = (x0 + x1) * 0.5;
    let ym = (y0 + y1) * 0.5;
    let normal = normalize([dy, -dx]);
    let linePlane = [normal[0], normal[1], -normal[0] * x0 - normal[1] * y0];
    let bisectingPlane = [-normal[1], normal[0], normal[1] * xm - normal[0] * ym];

    /**
     * 
     * @param {number[]} p 
     */
    const distance = (p) => {
        let bisectPlaneDst = pointPlaneDistance(p, bisectingPlane);
        let linePlaneDst = pointPlaneDistance(p, linePlane);
        // is line past line edges
        if( Math.abs(bisectPlaneDst) > length / 2){
            return bisectPlaneDst < 0 ? pointDistance([x1, y1], p) : pointDistance([x0, y0], p);
        }
        return linePlaneDst;
        
    }

    /**
     * 
     * @param {number[]} p 
     * @returns 
     */
    const nearestPoint = (p) => {
        let bisectPlaneDst = pointPlaneDistance(p, bisectingPlane);
        if( Math.abs(bisectPlaneDst) > length / 2){
            return bisectPlaneDst < 0 ? [x1, y1] : [x0, y0];
        }
        let prj = project([p[0] - x0, p[1] - y0], [normal[0], normal[1]])
        return [p[0] - prj[0], p[1] - prj[1]];
        
    }

    /**
     * 
     * @param {number[]} p 
     * @param {number} r 
     * @returns 
     */
    const collideCircle = (p, r) => {
        return Math.abs(distance(p)) < r;
    }

    return {
        distance,
        nearestPoint,
        collideCircle,
    }
}

/**
 * 
 * @param {number[]} center
 * @param {number} radius 
 * @param {number} arcStart 
 * @param {number} arcEnd
 * @returns {Collision}
 */
let arc = (center, radius, arcStart, arcEnd) => {
    let clockwise = arcStart > arcEnd;
    let centerAngle = (arcStart + arcEnd) * 0.5;
    let centerVector = [Math.cos(centerAngle), Math.sin(centerAngle)];
    let startVector = [Math.cos(arcStart), Math.sin(arcStart)];
    let endVector = [Math.cos(arcEnd), Math.sin(arcEnd)];
    let minDot = dot(centerVector, startVector);
        /**
     * @param {number[]} p 
     * @returns 
     */
    const distance = (p) => {
        let dir = normalize([p[0] - center[0], p[1] - center[1]]);
        if(minDot < dot(dir, centerVector)){
            return pointDistance(p, center) - radius;
        }
        
        return pointDistance(p, nearestPoint(p));
    }

        /**
     * 
     * @param {number[]} p 
     * @returns 
     */
    const nearestPoint = (p) => {
        let dir = normalize([p[0] - center[0], p[1] - center[1]]);
        if(minDot < dot(dir, centerVector)){
            return [dir[0] * radius + center[0], dir[1] * radius + center[1]];
        }
        return dot(dir, startVector) > dot(dir, endVector) ? [radius * startVector[0] + center[0], radius * startVector[1] + center[1]] : [radius * endVector[0] + center[0], radius * endVector[1] + center[1]];
    }

    /**
     * 
     * @param {number[]} p 
     * @param {number} r 
     * @returns 
     */
    const collideCircle = (p, r) => {
        return Math.abs(distance(p)) < r;
    }
    return {
        distance,
        nearestPoint,
        collideCircle,
    }
}

/**
 * @typedef Ball
 * @prop {number} x
 * @prop {number} y
 * @prop {number} vx
 * @prop {number} vy
 * @prop {number} ax
 * @prop {number} ay
 * @prop {number} r
 * @prop {(ball:Ball) => boolean} collisionCheck_ball
 * @prop {(deltaMs:number, geometry:Collision[], gravity:number[]) => void} update
 * @prop {number[]} center 
 * @prop {number[]} acceleration
 * @prop {number[]} velocity
 */
/**
 * 
 * @param {[number, number]} param0 
 * @param {number} r 
 * @returns {Ball}
 */
let ball = ([x, y], r) => {
    const cling = 0.01;
    let ax = 0;
    let ay = 0;
    let vx = 0;
    let vy = 0;
    /**
     * 
     * @param {Ball} otherBall 
     */
    const collisionCheck_ball = (otherBall) => {
        let dx = otherBall.x - x;
        let dy = otherBall.y - y;
        return dx ** 2 + dy ** 2 < (r + otherBall.r) ** 2;
    }

    /**
     * @param {number} deltaMs
     * @param {Collision[]} geometry
     * @param {number[]} gravity
     */
    const update = (deltaMs, geometry, gravity) => {
        const delta = deltaMs /  1000;
        x += vx * delta / 2;
        y += vy * delta / 2;
        vx += ax * delta;
        vy += ay * delta;
        x += vx * delta / 2;
        y += vy * delta / 2;
        ax = 0;
        ay = 0;
        geometry.forEach((collision) => {
            if(collision.collideCircle([x, y], r)){
                let repelPoint = collision.nearestPoint([x, y]);
                let vec = [x - repelPoint[0], y - repelPoint[1]];
                let distance = Math.sqrt(vec[0] ** 2 + vec[1] ** 2);
                let dir = normalize(vec);
                x += dir[0] * (r - distance)
                y += dir[1] * (r - distance)
                vx = 0;
                vy = 0;
            }
        })
    }

    return {
        get center() {
            return [x, y];
        },
        set center(value) {
            [x, y] = value;
        },
        get acceleration() {
            return [ax, ay];
        },
        set acceleration(value) {
            [ax, ay] = value;
        },
        get velocity() {
            return [ax, ay];
        },
        set velocity(value) {
            [vx, vy] = value;
        },
        get r(){
            return r;
        },
        set r(value){
            r = value;
        },
        get x(){
            return x;
        },
        set x(value){
            x = value;
        },
        get y(){
            return y;
        },
        set y(value){
            y = value;
        },
        get ax(){
            return ax;
        },
        set ax(value){
            ax = value;
        },
        get ay(){
            return ay;
        },
        set ay(value){
            ay = value;
        },
        get vx(){
            return vx;
        },
        set vx(value){
            vx = value;
        },
        get vy(){
            return vy;
        },
        set vy(value){
            vy = value;
        },
        collisionCheck_ball,
        update,
    }


}

export {line, arc, ball, project};

