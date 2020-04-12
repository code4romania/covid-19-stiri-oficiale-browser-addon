// eslint-disable-next-line no-unused-vars
class LocalOrSyncStorage {
    static async getFromCacheStorageOrDefault(key, defaultValue) {
        let item = await this.getStorage().get(key);
        item = item[key];
        if (!item) {
            item = defaultValue;
            LocalOrSyncStorage.save(key, item);
        }
        return item;
    }

    static async save(key, value) {
        let objectToStore = {};
        objectToStore[key] = value;
        return this.getStorage().set(objectToStore);
    }

    static getStorage() {
        if (browser.storage.sync) {
            return browser.storage.sync;
        } else {
            return browser.storage.local;
        }
    }

}