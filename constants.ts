export const REGISTRY_ID_HEADER = "AHX-Registry-Id";
export const AUGMENTATION_ID_HEADER = "AHX-Augmentation-Id";
export const MARKET_ID_HEADER = "AHX-Market-Id";

/**
 * Base URL for fetch/xhr requests to the registry within the host app
 * this should be followed by the addon id and addon specific path.
 *
 * This should be provided by the host app in requests to the registry.
 */
export const BASE_REQ_URL_HEADER = "AHX-Base-Req-URL";

/**
 * Base URL for browser navigation to addon pages within the host app
 * this should be followed by the addon id and addon specific path.
 *
 * This may be provided by the host app in requests to the registry,
 * if the navigation URLs differ from fetch/xhr request URLs.
 */
export const BASE_NAV_URL_HEADER = "AHX-Base-Nav-URL";

/**
 * Base URL for fetch/xhr requests to the addon in the host app.
 * Addons may use this in `hx-get` attributes, that perform requests
 * via fetch/xhr.
 *
 * This is provided by the registry in requests to addons.
 *
 * The host app may also provide this to the registry if the URL differs
 * from the usual base URL for a specific addon.
 */
export const REQ_URL_HEADER = "AHX-Req-URL";

/**
 * Base URL for browser navigation within the addon in the host app.
 * Addons may use this in `href` or `action` attributes, that cause
 * the browser to navigate to a new another location.
 *
 * This is provided by the registry in requests to addons, only if
 * it differs from the regular request URL.
 */
export const NAV_URL_HEADER = "AHX-Nav-URL";

/**
 * May be set in addon response headers to indicate the content should
 * be displayed as a full page within the host app.
 */
export const FULL_PAGE_HEADER = "AHX-Full-Page";

/**
 * Prefix for augmentation ids in HTML.
 */
export const AUGMENTATION_PREFIX = "ahx-";
