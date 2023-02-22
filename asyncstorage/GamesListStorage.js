import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../src/constants';

export const storeGames = async (value) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEY.GAMES_LIST, JSON.stringify(value))
    } catch (e) {
        // saving error
    }
}

export const retrieveGames = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY.GAMES_LIST)
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        // error reading value
    }
}
