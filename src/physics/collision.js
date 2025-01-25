// @ts-check

/**
 * @typedef Collision
 * @prop {(point:number[])=>number} distance
 * @prop {(point:number[])=>number[]} nearestPoint
 * @prop {(point:number[], radius:number)=>boolean} collideCircle
 */

/**
 * Projects u on to v
 * @param {number[]} u 
 * @param {number[]} v 
 */
const project = (u, v) => {
    let j = dot(u, v) / (v[0] ** 2 + v[1] ** 2);
    return [v[0] * j, v[1] * j ];
}



/**
 * 
 * @param {number[]} v the vector to normalize
 * @returns 
 */
let normalize = (v) => {
    const [x, y] = v;
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

export {line, arc, project};

