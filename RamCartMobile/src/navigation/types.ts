import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Orders: undefined;
  AdminDashboard: undefined;
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainTabNavProp = BottomTabNavigationProp<MainTabParamList>;
export type RootStackNavProp = NativeStackNavigationProp<RootStackParamList>;
