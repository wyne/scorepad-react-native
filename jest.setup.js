global.FormData = class FormData {
    constructor() {
        this.data = [];
    }
    append(key, value) {
        this.data.push({ key, value });
    }
};
