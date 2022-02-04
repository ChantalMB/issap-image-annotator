import { writable } from 'svelte/store';

export const infoStore = writable({});

export const fileList = writable({});

export const selectedID = writable("");
export const setImg = writable("");
export const showImg = writable("");

export const changingPicture = writable(false);
export const jumpToImgPanel = writable(false);

export const exifData = writable({});

export const projName = writable("");

export const select_display = writable("");

export const selectedShape = writable("");

export const shpStore = writable({});

export const artiStore = writable({});

export const ctxtStore = writable({});

export const ctxtInfo = writable([]);

export const zoomIn = writable();
export const zoomOut = writable();
export const centreImg = writable();

export const rowCheck = writable(false);
export const rmShp = writable(false);
export const rmImg = writable(false);

export const viewer = writable();

export const typeCategory = writable([]);







