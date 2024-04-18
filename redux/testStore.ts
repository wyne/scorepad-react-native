import AsyncStorage from '@react-native-async-storage/async-storage';

import logger from '../src/Logger';

const keys = [
    'persist:settings',
    'persist:players',
    'persist:games',
];

export const exportData = () => {
    keys.forEach((key) => {
        AsyncStorage.getItem(key).then((data) => {
            logger.info(key);
            logger.info(JSON.stringify(data));
        });
    });
};

export const getPreloadedState = () => {
    const playersJson = JSON.parse('{"ids":"[\\"e8f07017-ca0b-474d-b748-bb004f0e47d5\\",\\"06e5a92a-602d-4880-a612-893a10767f4e\\",\\"0e85d2aa-515d-4215-bf2a-d02a8d5b5d18\\",\\"af215759-daef-41f8-aad9-97a90c778257\\",\\"8fd75860-06f2-4d3d-9f2d-62ac0eb674f8\\",\\"81c66201-c84f-439a-9240-a1e45e959838\\",\\"2eff84be-5b21-4827-ac57-4d46d8bd292c\\",\\"a897d496-9c80-4294-b71f-6531e54dc08c\\",\\"f900dc3b-1cbf-4a44-a58e-0d6aec863f93\\",\\"8a7b194a-47d6-45c2-b4a0-eb5f5f7dd1fd\\",\\"08966cc0-2ae0-4356-8552-4c8c5323b68a\\",\\"caf5409d-3921-4ddd-aa3e-1f7a58c42399\\",\\"f33b3cfb-3b1f-45b4-ab58-a1248a8e82a3\\",\\"aafa4261-3ca2-4552-ba12-81c4103461d0\\",\\"b756c49e-bc76-438c-a318-3f9036e3eeb5\\",\\"88a40dca-5930-4a21-9131-78acccc9ea0f\\",\\"3c9a3abc-f2b4-4ef9-b953-24bffebab632\\",\\"3dcfd833-be57-47d3-8dc6-1787c0c1d56b\\",\\"d543400f-a60a-4ff9-bc05-40e640ca8c8f\\",\\"b52d5dc3-602d-4269-9267-6cf2cfa4d529\\",\\"f45ff562-94f3-4a28-8f89-1de17c169cfc\\",\\"39fbf246-de02-428f-b376-53a9b5eba40e\\",\\"cb5acb92-19a8-40e1-9826-5d98879ab23e\\",\\"d6759b6c-2fef-4521-8400-56abb3edc547\\",\\"12f03866-5f89-43cc-857f-6b3c9760df1a\\",\\"577a6225-d6e8-4b47-91fb-02e85864b2a2\\"]","entities":"{\\"8a7b194a-47d6-45c2-b4a0-eb5f5f7dd1fd\\":{\\"id\\":\\"8a7b194a-47d6-45c2-b4a0-eb5f5f7dd1fd\\",\\"playerName\\":\\"Rick\\",\\"scores\\":[4,2,1,1]},\\"f33b3cfb-3b1f-45b4-ab58-a1248a8e82a3\\":{\\"id\\":\\"f33b3cfb-3b1f-45b4-ab58-a1248a8e82a3\\",\\"playerName\\":\\"Morty\\",\\"scores\\":[2,null,2,1]},\\"08966cc0-2ae0-4356-8552-4c8c5323b68a\\":{\\"id\\":\\"08966cc0-2ae0-4356-8552-4c8c5323b68a\\",\\"playerName\\":\\"Summer\\",\\"scores\\":[3,1,1,1]},\\"caf5409d-3921-4ddd-aa3e-1f7a58c42399\\":{\\"id\\":\\"caf5409d-3921-4ddd-aa3e-1f7a58c42399\\",\\"playerName\\":\\"Beth\\",\\"scores\\":[2,null,1,2]},\\"b756c49e-bc76-438c-a318-3f9036e3eeb5\\":{\\"id\\":\\"b756c49e-bc76-438c-a318-3f9036e3eeb5\\",\\"playerName\\":\\"Jerry\\",\\"scores\\":[-1,null,1]},\\"0e85d2aa-515d-4215-bf2a-d02a8d5b5d18\\":{\\"id\\":\\"0e85d2aa-515d-4215-bf2a-d02a8d5b5d18\\",\\"playerName\\":\\"Arthur\\",\\"scores\\":[12,10,2,11]},\\"e8f07017-ca0b-474d-b748-bb004f0e47d5\\":{\\"id\\":\\"e8f07017-ca0b-474d-b748-bb004f0e47d5\\",\\"playerName\\":\\"Gertrude\\",\\"scores\\":[25,null,20,9]},\\"06e5a92a-602d-4880-a612-893a10767f4e\\":{\\"id\\":\\"06e5a92a-602d-4880-a612-893a10767f4e\\",\\"playerName\\":\\"Erwin\\",\\"scores\\":[8,2,1,31]},\\"af215759-daef-41f8-aad9-97a90c778257\\":{\\"id\\":\\"af215759-daef-41f8-aad9-97a90c778257\\",\\"playerName\\":\\"Maude\\",\\"scores\\":[6,10,2,12]},\\"a897d496-9c80-4294-b71f-6531e54dc08c\\":{\\"id\\":\\"a897d496-9c80-4294-b71f-6531e54dc08c\\",\\"playerName\\":\\"Carmen\\",\\"scores\\":[10,2,1,4]},\\"f900dc3b-1cbf-4a44-a58e-0d6aec863f93\\":{\\"id\\":\\"f900dc3b-1cbf-4a44-a58e-0d6aec863f93\\",\\"playerName\\":\\"Isaac\\",\\"scores\\":[6,3,1,2]},\\"81c66201-c84f-439a-9240-a1e45e959838\\":{\\"id\\":\\"81c66201-c84f-439a-9240-a1e45e959838\\",\\"playerName\\":\\"Penelope\\",\\"scores\\":[-1,10,13,2]},\\"2eff84be-5b21-4827-ac57-4d46d8bd292c\\":{\\"id\\":\\"2eff84be-5b21-4827-ac57-4d46d8bd292c\\",\\"playerName\\":\\"Ollie\\",\\"scores\\":[7,2,12,3]},\\"8fd75860-06f2-4d3d-9f2d-62ac0eb674f8\\":{\\"id\\":\\"8fd75860-06f2-4d3d-9f2d-62ac0eb674f8\\",\\"playerName\\":\\"Justin\\",\\"scores\\":[12,4,4,2,5,-2,4]},\\"b52d5dc3-602d-4269-9267-6cf2cfa4d529\\":{\\"id\\":\\"b52d5dc3-602d-4269-9267-6cf2cfa4d529\\",\\"playerName\\":\\"Savitri\\",\\"scores\\":[0,30,8]},\\"39fbf246-de02-428f-b376-53a9b5eba40e\\":{\\"id\\":\\"39fbf246-de02-428f-b376-53a9b5eba40e\\",\\"playerName\\":\\"Thetis\\",\\"scores\\":[1,2,14]},\\"d6759b6c-2fef-4521-8400-56abb3edc547\\":{\\"id\\":\\"d6759b6c-2fef-4521-8400-56abb3edc547\\",\\"playerName\\":\\"Lludd\\",\\"scores\\":[3,43,4]},\\"577a6225-d6e8-4b47-91fb-02e85864b2a2\\":{\\"id\\":\\"577a6225-d6e8-4b47-91fb-02e85864b2a2\\",\\"playerName\\":\\"Maia\\",\\"scores\\":[0,4,8]},\\"aafa4261-3ca2-4552-ba12-81c4103461d0\\":{\\"id\\":\\"aafa4261-3ca2-4552-ba12-81c4103461d0\\",\\"playerName\\":\\"Galateia\\",\\"scores\\":[1,52,4]},\\"88a40dca-5930-4a21-9131-78acccc9ea0f\\":{\\"id\\":\\"88a40dca-5930-4a21-9131-78acccc9ea0f\\",\\"playerName\\":\\"Rashnu\\",\\"scores\\":[0,null,50]},\\"3c9a3abc-f2b4-4ef9-b953-24bffebab632\\":{\\"id\\":\\"3c9a3abc-f2b4-4ef9-b953-24bffebab632\\",\\"playerName\\":\\"Iocasta\\",\\"scores\\":[1,50,50]},\\"3dcfd833-be57-47d3-8dc6-1787c0c1d56b\\":{\\"id\\":\\"3dcfd833-be57-47d3-8dc6-1787c0c1d56b\\",\\"playerName\\":\\"Myrddin\\",\\"scores\\":[0,20,4]},\\"f45ff562-94f3-4a28-8f89-1de17c169cfc\\":{\\"id\\":\\"f45ff562-94f3-4a28-8f89-1de17c169cfc\\",\\"playerName\\":\\"Venere\\",\\"scores\\":[0,10,100]},\\"d543400f-a60a-4ff9-bc05-40e640ca8c8f\\":{\\"id\\":\\"d543400f-a60a-4ff9-bc05-40e640ca8c8f\\",\\"playerName\\":\\"Lugos\\",\\"scores\\":[0,50,4]},\\"12f03866-5f89-43cc-857f-6b3c9760df1a\\":{\\"id\\":\\"12f03866-5f89-43cc-857f-6b3c9760df1a\\",\\"playerName\\":\\"Eudora\\",\\"scores\\":[1,10,4]},\\"cb5acb92-19a8-40e1-9826-5d98879ab23e\\":{\\"id\\":\\"cb5acb92-19a8-40e1-9826-5d98879ab23e\\",\\"playerName\\":\\"Indra\\",\\"scores\\":[1,-10,58]}}","_persist":"{\\"version\\":0,\\"rehydrated\\":true}"}');
    const settingsJson = JSON.parse('{"home_fullscreen":"false","multiplier":"1","addendOne":"1","addendTwo":"10","currentGameId":"\\"d0ee7acd-da3c-47e9-b535-6bc401f3c16d\\"","onboarded":"\\"2.4.1\\"","showPointParticles":"true","_persist":"{\\"version\\":0,\\"rehydrated\\":true}"}');
    const gamesJson = JSON.parse('{"ids":"[\\"bba7e79a-10d6-4d7d-97d0-1992e34579cd\\",\\"9139ee7f-05fa-4152-95f3-62084f94bf85\\",\\"46753726-1f11-424e-93c3-2491ab3058bd\\",\\"a871776b-578b-415d-932a-dda41145b0ed\\"]","entities":"{\\"a871776b-578b-415d-932a-dda41145b0ed\\":{\\"id\\":\\"a871776b-578b-415d-932a-dda41145b0ed\\",\\"title\\":\\"Family Game Night\\",\\"dateCreated\\":1700389151005,\\"roundCurrent\\":3,\\"roundTotal\\":4,\\"playerIds\\":[\\"8a7b194a-47d6-45c2-b4a0-eb5f5f7dd1fd\\",\\"f33b3cfb-3b1f-45b4-ab58-a1248a8e82a3\\",\\"08966cc0-2ae0-4356-8552-4c8c5323b68a\\",\\"caf5409d-3921-4ddd-aa3e-1f7a58c42399\\",\\"b756c49e-bc76-438c-a318-3f9036e3eeb5\\"]},\\"46753726-1f11-424e-93c3-2491ab3058bd\\":{\\"id\\":\\"46753726-1f11-424e-93c3-2491ab3058bd\\",\\"title\\":\\"Dutch Blitz\\",\\"dateCreated\\":1700448139651,\\"roundCurrent\\":3,\\"roundTotal\\":4,\\"playerIds\\":[\\"0e85d2aa-515d-4215-bf2a-d02a8d5b5d18\\",\\"e8f07017-ca0b-474d-b748-bb004f0e47d5\\",\\"06e5a92a-602d-4880-a612-893a10767f4e\\",\\"af215759-daef-41f8-aad9-97a90c778257\\",\\"a897d496-9c80-4294-b71f-6531e54dc08c\\",\\"f900dc3b-1cbf-4a44-a58e-0d6aec863f93\\",\\"81c66201-c84f-439a-9240-a1e45e959838\\",\\"2eff84be-5b21-4827-ac57-4d46d8bd292c\\"]},\\"9139ee7f-05fa-4152-95f3-62084f94bf85\\":{\\"id\\":\\"9139ee7f-05fa-4152-95f3-62084f94bf85\\",\\"title\\":\\"Solitaire\\",\\"dateCreated\\":1700448496128,\\"roundCurrent\\":6,\\"roundTotal\\":7,\\"playerIds\\":[\\"8fd75860-06f2-4d3d-9f2d-62ac0eb674f8\\"]},\\"bba7e79a-10d6-4d7d-97d0-1992e34579cd\\":{\\"id\\":\\"bba7e79a-10d6-4d7d-97d0-1992e34579cd\\",\\"title\\":\\"All In\\",\\"dateCreated\\":1700448546805,\\"roundCurrent\\":2,\\"roundTotal\\":3,\\"playerIds\\":[\\"b52d5dc3-602d-4269-9267-6cf2cfa4d529\\",\\"39fbf246-de02-428f-b376-53a9b5eba40e\\",\\"d6759b6c-2fef-4521-8400-56abb3edc547\\",\\"577a6225-d6e8-4b47-91fb-02e85864b2a2\\",\\"aafa4261-3ca2-4552-ba12-81c4103461d0\\",\\"88a40dca-5930-4a21-9131-78acccc9ea0f\\",\\"3c9a3abc-f2b4-4ef9-b953-24bffebab632\\",\\"3dcfd833-be57-47d3-8dc6-1787c0c1d56b\\",\\"f45ff562-94f3-4a28-8f89-1de17c169cfc\\",\\"d543400f-a60a-4ff9-bc05-40e640ca8c8f\\",\\"12f03866-5f89-43cc-857f-6b3c9760df1a\\",\\"cb5acb92-19a8-40e1-9826-5d98879ab23e\\"]}}","_persist":"{\\"version\\":0,\\"rehydrated\\":true}"}');

    const restoredData = {
        settings: {
            ...settingsJson,
            _persist: JSON.parse(settingsJson['_persist']),
        },
        players: {
            ids: JSON.parse(playersJson['ids']),
            entities: JSON.parse(playersJson['entities']),
            _persist: JSON.parse(playersJson['_persist']),
        },
        games: {
            ids: JSON.parse(gamesJson['ids']),
            entities: JSON.parse(gamesJson['entities']),
            _persist: JSON.parse(gamesJson['_persist']),
        }
    };

    logger.info('restoredData');
    logger.info(restoredData);
    return restoredData;
};
