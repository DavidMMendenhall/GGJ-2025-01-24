import {Controls} from "./controls.js";

let c = new Controls();

/**
 * @param {number} timestamp - The time
 */
function update(timestamp) {
	c.update(timestamp);
	let message = "";
	for (const key of c.held.values()) {
		message += key + " ";
	}

	message += Math.atan2(c.leftStick[0], c.leftStick[1]) * 180 / (Math.PI);
	message += " ";
	message += Math.atan2(c.rightStick[0], c.rightStick[1]) * 180 / (Math.PI);

	requestAnimationFrame(update);
}

requestAnimationFrame(update);
