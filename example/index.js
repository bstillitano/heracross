import { AppRegistry } from 'react-native';
import Root from './src/Root';
import { setUpExample } from './src/setup';
import { name as appName } from './app.json';

setUpExample();

AppRegistry.registerComponent(appName, () => Root);
