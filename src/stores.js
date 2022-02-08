import { writable } from 'svelte/store';

export const infoStore = writable({});

export const pointlessStore = writable({});

export const fileList = writable({});

export const selectedID = writable("");
export const setImg = writable("");
export const showImg = writable("");

export const changingPicture = writable(false);
export const jumpToImgPanel = writable(false);

export const exifData = writable({});

export const projName = writable("ISSAP_project_save");

export const selectDisplay = writable("");

export const selectedShape = writable("");

export const shpStore = writable({});

export const artiStore = writable({});

export const ctxtStore = writable({});

export const ctxtInfo = writable([]);
export const ctxtInfoSp = writable([]);

export const zoomIn = writable();
export const zoomOut = writable();
export const centreImg = writable();

export const rowCheck = writable(false);
export const rmShp = writable(false);
export const rmImg = writable(false);

export const viewer = writable();

export const typeCategory = writable([]);

export const os = writable([{"unknown":"Unknown"},{"us":"USA"},{"eur":"EUR"},{"ca":"CA"}]);
export const ag = writable([{"unknown":"Unknown"}, {"esa":"ESA"},{"nasa":"NASA"},{"csa":"CSA"}]);
export const phg = writable([{"unknown":"Unknown"}, {"kb":"Kayla Barron"}, {"rj":"Raja Chari"}, {"tm":"Thomas Marshburn"}, {"mm":"Matthias Maurer"}, {"mvh": "Mark Vande Hei"}]);









