import {line, arc} from "./physics/collision.js";
const parser = new DOMParser();

/**
 * @typedef SVGLevel
 * @property {SVGCollisions} collisionObjects
 * @property {SVGCollisions} killObjects
 * @property {Path2D[]} pathObjects
 * @property {number[]} bounds
 * @property {number[]} spawnpoint
 * @property {number} playerRadius
 */

/**
 * @param {SVGRectElement} rect
 * @returns {number[]}
 */
function getRectBounds(rect) {
	const x1 = rect.x.baseVal.value;
	const y1 = rect.y.baseVal.value;
	const x2 = x1 + rect.width.baseVal.value;
	const y2 = y1 + rect.height.baseVal.value;

	return [x1, y1, x2, y2];
}


/**
 * @param {number} x1
 * @param {number} x2
 * @param {number} y1
 * @param {number} y2
 * @param {number} r
 * @returns {number[][]}
 */
function findArcCenters(x1, y1, x2, y2, r) {
	// Calculate the midpoint
	const mx = (x1 + x2) / 2;
	const my = (y1 + y2) / 2;

	// Calculate the distance between the start and end points
	const d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

	// Check if the radius is valid
	if (d >= 2 * r) {
		throw new Error("The radius is too small for the given points.");
	}

	// Calculate the distance from the midpoint to the center
	const dc = Math.sqrt(r ** 2 - (d / 2) ** 2);

	// Calculate the direction vector
	const directionX = (x2 - x1) / d;
	const directionY = (y2 - y1) / d;

	// Calculate the perpendicular vector
	const perpX = -directionY;
	const perpY = directionX;

	// Calculate the center of the arc
	const center1 = [
		mx + dc * perpX,
		my + dc * perpY
	];

	const center2 = [
		mx - dc * perpX,
		my - dc * perpY
	];

	return [center1, center2]; // Return both possible centers
}

/**
 * @typedef SVGCollisions
 * @property {import("./physics/collision.js").Collision[]} lines
 * @property {import("./physics/collision.js").Collision[]} arcs
 */

/**
 * @param {SVGElement} group
 * @returns {SVGCollisions}
 */
export function svgGetCollisions(group) {
	const result = {
		lines: [],
		arcs: [],
	};

	for (const rect of group.getElementsByTagName("rect")) {
		const [x1, y1, x2, y2] = getRectBounds(rect);

		result.lines.push(
			line([x1, -y1], [x2, -y1]),
			line([x2, -y1], [x2, -y2]),
			line([x2, -y2], [x1, -y2]),
			line([x1, -y2], [x1, -y1]),
		);
	}

	for (const path of group.getElementsByTagName("path")) {
		let firstCoords = null;
		let previousCoords = [0, 0];
		const d = path.getAttribute("d");
		const segments = d.split(/,\s*|\s+/);
		/** @type {string | null} */
		let command = null;
		let numbersLeft = 0;
		let prevNumbersLeft = 0;
		let numbersBuffer = [];
		let finishedCommand = true;
		for (const segment of segments) {
			// if there is no active command or we finished processing a command, then we look for a new command
			// also mark that we're processing a command and tell the state machine how many numbers to pop
			if ((command == null || finishedCommand) && isNaN(segment)) {
				switch (segment) {
					case 'v':
					case 'V':
					case 'h':
					case 'H':
						command = segment;
						finishedCommand = false;
						prevNumbersLeft = numbersLeft = 1;
						break;
					case 'm':
					case 'M':
					case 'l':
					case 'L':
						command = segment;
						finishedCommand = false;
						prevNumbersLeft = numbersLeft = 2;
						break;
					case 'a':
					case 'A':
						command = segment;
						finishedCommand = false;
						prevNumbersLeft = numbersLeft = 7;
						break;
					case 'z':
					case 'Z':
						if (firstCoords != null) {
							result.lines.push(line([previousCoords[0], -previousCoords[1]], [firstCoords[0], firstCoords[-1]]));
						}
						break;
					default:
						throw new Error(`command not supported: ${segment}`);
				}

				continue;
			}

			// if there is an active command, then we need a number next
			// get that number
			if (isNaN(segment)) {
				throw new Error(`expected number, found ${segment}`);
			}

			numbersBuffer.push(Number(segment));

			numbersLeft--;

			// if this was the last number that we needed for a command, then we process it
			if (numbersLeft == 0) {
				// FINALLY a use case for the fallthrough syntax!! it's only been 10 billion years
				switch (command) {
					case 'v':
						// add previous y coord if relative
						numbersBuffer[0] += previousCoords[1];
					case 'V':
						result.lines.push(line([previousCoords[0], -previousCoords[1]], [previousCoords[0], -numbersBuffer[0]]));
						previousCoords[1] = numbersBuffer[0];
						break;
					case 'h':
						// add previous x coord if relative
						numbersBuffer[0] += previousCoords[0];
					case 'H':
						result.lines.push(line([previousCoords[0], -previousCoords[1]], [numbersBuffer[0], -previousCoords[1]]));
						previousCoords[0] = numbersBuffer[0];
						break;
					case 'm':
						numbersBuffer[0] += previousCoords[0];
						numbersBuffer[1] += previousCoords[1];
					case 'M':
						previousCoords = [...numbersBuffer];
						if (firstCoords == null) {
							firstCoords = [...previousCoords];
						}
						break;
					case 'l':
						numbersBuffer[0] += previousCoords[0];
						numbersBuffer[1] += previousCoords[1];
					case 'L':
						result.lines.push(line([previousCoords[0], -previousCoords[1]], [numbersBuffer[0], -numbersBuffer[1]]));
						previousCoords = [...numbersBuffer];
						break;
					case 'a':
						numbersBuffer[5] += previousCoords[0];
						numbersBuffer[6] += previousCoords[1];
					case 'A':
						const startX = previousCoords[0];
						const startY = previousCoords[1];

						const [radiusX, radiusY, rotation, large, sweep, endX, endY] = numbersBuffer;

						//if (radiusX != radiusY) {
						//	throw new Error(`ellipses not supported (${radiusX} != ${radiusY})`);
						//}

						const [center1, center2] = findArcCenters(
							startX,
							startY,
							endX,
							endY,
							radiusX,
						)

						const center = sweep == 0 ? center1 : center2;

						let angleCtoS = Math.atan2(center1[1] - startY, center1[0] - startX);
						let angleCtoE = Math.atan2(center1[1] - endY, center1[0] - endX);

						if (angleCtoE - angleCtoS > Math.PI) {
							if (!large) {
								[angleCtoS, angleCtoE] = [angleCtoE, angleCtoS];
							}
						} else {
							if (large) {
								[angleCtoS, angleCtoE] = [angleCtoE, angleCtoS];
							}
						}

						result.arcs.push(arc([center[0], -center[1]], radiusX, -angleCtoE, -angleCtoS));

						previousCoords = [endX, endY];

						break;
					default:
						throw new Error(`command not supported: ${segment}`);
				}

				numbersBuffer = [];
				numbersLeft = prevNumbersLeft;

				finishedCommand = true;
			}
		}
	}

	return result;
}

/**
 * @param {string} svgText
 * @returns {SVGLevel}
 */
export function svgImport(svgText) {
	const svgDocument = parser.parseFromString(svgText, "text/xml");

	const boundsRect = Array.from(svgDocument.getElementsByTagName("rect"))
		.filter(r => r.getAttribute("inkscape:label") == "bounds")[0];

	const [bx1, by1, bx2, by2] = getRectBounds(boundsRect);

	const spawnCircle = Array.from(svgDocument.getElementsByTagName("circle"))
		.filter(c => c.getAttribute("inkscape:label") == "spawn")[0];

	const spawnpoint = [
		spawnCircle.cx.baseVal.value,
		-spawnCircle.cy.baseVal.value,
	];

	const playerRadius = spawnCircle.r.baseVal.value;

	/** @type SVGLevel */
	const result = {
		collisionObjects: null,
		killObjects: null,
		pathObjects: [],
		bounds: [bx1, -by1, bx2, -by2],
		spawnpoint,
		playerRadius
	}

	const groups = svgDocument.getElementsByTagName("g");

	for (const group of groups) {
		let label = group.getAttribute("inkscape:label");

		switch (label) {
			case "collision":
				result.collisionObjects = svgGetCollisions(group);
				break;
			case "render":
				for (const path of group.getElementsByTagName("path")) {
					result.pathObjects.push(new Path2D(path.getAttribute("d")));
				}
				break;
			case "kill":
				result.killObjects = svgGetCollisions(group);
				break;
		}
	}

	return result;
}
