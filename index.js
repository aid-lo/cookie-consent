// TODO: Use a cookie that is accessible to scripts rather than localStorage, to make consent visible to server.
// TODO: Publish module

/**
 * The name of the cookie.
 * @type string
 */
const nameString = 'cookie-consent';

/**
 * Name of the default cookie type (for when a type is not specified.)
 * @type {string}
 */
const defaultCookieType = 'default';

let localStorageAvailable = (() => {
	try {
		localStorage.getItem("");
		return true;
	} catch {
		console.error("cookie-consent: Error accessing localStorage. Cookie consent choices will not be saved.");
		return false;
	}
})()

/**
 * The consent object, stored in memory.
 * @type Object<0|1>
 */
const consent = localStorageAvailable ? (storedString => {

	// Reads from localStorage
	// If corrupted or broken in some way it'll just reset it

	if (storedString)
		try {
			const parsed = JSON.parse(storedString);
			return typeof parsed === 'object' ? parsed : reset();
		}
		catch { return reset(); }
	else return reset();

	function reset() {
		localStorage.removeItem(nameString);
		return {};
	}

})(localStorage.getItem(nameString)) : {};

/**
 * Stores functions that have been registered to be called if and when consent is granted.
 * @type Object<function[]>
 */
const listeners = {};

/**
 * Updates a consent value for a cookie type and saves to localStorage.
 * @param {0|1} value
 * @param {string} [cookieType]
 * @return void
 */
function alterConsent(value, cookieType = defaultCookieType) {
	consent[cookieType] = value;
	if (localStorageAvailable) localStorage.setItem(nameString, JSON.stringify(consent));
}

/**
 * Grants consent for a cookie type.
 * @param {string} [cookieType] The cookie type to grant consent for. Omit this parameter if not using multiple cookie types.
 * @return void
 */
export function grantConsent(cookieType = defaultCookieType) {
	alterConsent(1, cookieType);
	if (listeners[cookieType]) {
		listeners[cookieType].forEach(fn => fn());
		delete listeners[cookieType];
	}
}

/**
 * Revokes consent for a cookie type.
 * @param {string} [cookieType] The cookie type to revoke consent for. Omit this parameter if not using multiple cookie types.
 * @return void
 */
export function revokeConsent(cookieType) {
	alterConsent(0, cookieType);
}

/**
 * Checks whether consent for a certain cookie type has been given.
 * @param {string} [cookieType] The cookie type to check. Omit this parameter if not using multiple cookie types.
 * @return {boolean}
 * - **true:** consent has been given.
 * - **false:** consent has been rejected, or no response has been recorded.
 */
export function hasConsent(cookieType = defaultCookieType) {
	// noinspection FallThroughInSwitchStatementJS
	switch (consent[cookieType]) {
		case 1: return true;
		default: delete consent[cookieType];
		case 0: return false;
	}
}

/**
 * Checks whether a response for a certain cookie type was ever given.
 * @param {string} [cookieType] The cookie type to check. Omit this parameter if not using multiple cookie types.
 * @return {boolean}
 * - **true:** consent has been either given OR rejected.
 * - **false:** no response has been recorded.
 */
export function offeredConsent(cookieType = defaultCookieType) {
	switch (consent[cookieType]) {
		case 0:
		case 1:
			return true;
		default:
			delete consent[cookieType]
			return false;
	}
}

/**
 * Execute a function only after the user has consented to a cookie type. If the cookie type has already been consented
 * to, the function will immediately be executed, otherwise the function will be added to a queue and will be executed
 * when (or if) consent is granted.
 * @param {function} callback The function to execute.
 * @param {string} [cookieType] The cookie type to wait for the consent of. Omit this parameter if not using multiple cookie types.
 */
export function waitForConsent(callback, cookieType = defaultCookieType) {
	if (hasConsent(cookieType)) callback();
	else listeners[cookieType] ? listeners[cookieType].push(callback) : listeners[cookieType] = [callback];
}

// noinspection JSUnusedGlobalSymbols
export default {
	grantConsent: grantConsent,
	revokeConsent: revokeConsent,
	hasConsent: hasConsent,
	offeredConsent: offeredConsent,
	waitForConsent: waitForConsent
};
