import { writable } from 'svelte/store';

export const infoStore = writable({});

export const fileList = writable({});

export const selectedID = writable("");
export const setImg = writable("");
export const showImg = writable("");

export const changingPicture = writable(false);

export const exifData = writable({});

export const projName = writable("");

export const select_display = writable("");

export const selectedShape = writable("");

export const shpStore = writable({});

export const artiStore = writable({});


export const ctxtStore = writable({});

export const currentTable = writable([]);

export const ctxtInfo = writable([]);


