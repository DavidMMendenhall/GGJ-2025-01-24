/** @type Record<string, number> */
export const buttonNameToId = {
	"R1": 5,
	"L1": 4,
	"R2": 7,
	"L2": 6,
}

/** @type Record<number, keyof buttonNameToId> */
export const buttonIdToName = Object.fromEntries(Object.entries(buttonNameToId).map(([name, id]) => [id, name]));

export class Controls {
	/**
	 * @type Set<string>
	 * Buttons that were pressed this frame
	 */
	pressed;
	/**
	 * @type Set<string>
	 * Buttons that were released this frame
	 */
	released;
	/**
	 * @type Set<string>
	 * Buttons that are held this frame
	 */
	held;
	/**
	 * @type Array<number>
	 * The left stick direction
	 */
	leftStick;
	/**
	 * @type Array<number>
	 * The right stick direction
	 */
	rightStick;

	constructor() {
		this.pressed = new Set();
		this.released = new Set();
		this.held = new Set();
		this.leftStick = [0, 0];
		this.rightStick = [0, 0];
	}

	/** @returns Gamepad | null */
	get currentGamepad() {
		return navigator.getGamepads()[0];
	}

	/**
	 * @param {number} timeDelta
	 * @returns void
	 */
	update(timeDelta) {
		this.pressed.clear();
		if (this.currentGamepad == null) {
			return;
		}
		for (const [idx, button] of this.currentGamepad.buttons.entries()) {
			const buttonName = buttonIdToName[idx];

			if (buttonName == null) {
				continue;
			}

			let held = this.held.has(buttonName);

			if (button.pressed && !held) {
				this.pressed.add(buttonName);
				this.held.add(buttonName);
			}

			if (!button.pressed && held) {
				this.pressed.delete(buttonName);
				this.held.delete(buttonName);
			}
		}

		let [leftX, leftY, rightX, rightY] = this.currentGamepad.axes;

		this.leftStick = [leftX, -leftY];
		this.rightStick = [rightX, -rightY];
	}
}

