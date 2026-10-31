import { EvilIcons, FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { registerCustomIconType } from '@rneui/base';

// @rneui/base looks icon sets up in the modular @react-native-vector-icons/*
// packages. Point the types this app uses at @expo/vector-icons instead, whose
// fonts Expo already bundles. `material` is the default when no type is given.
registerCustomIconType('material', MaterialIcons);
registerCustomIconType('ionicon', Ionicons);
registerCustomIconType('evilicon', EvilIcons);
registerCustomIconType('font-awesome', FontAwesome);
registerCustomIconType('font-awesome-5', FontAwesome5);
