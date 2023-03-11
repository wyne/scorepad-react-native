import React, { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import { NavigationContainer } from '@react-navigation/native';
import * as Sentry from 'sentry-expo';
import DrawerLeft from './src/components/DrawerLeft';

Sentry.init({
    dsn: 'https://88dd6d7c83b64ed8870ff21a2a9f1ba7@o1326242.ingest.sentry.io/4504710808076288',
    enableInExpoDevelopment: true,
    debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

export default class App extends React.Component {
    render() {
        return (
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <NavigationContainer>
                        <DrawerLeft />
                    </NavigationContainer>
                </PersistGate>
            </Provider>
        );
    }
}
