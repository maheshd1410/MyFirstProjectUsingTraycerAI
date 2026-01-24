import React, { useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

interface RootNavigatorProps {
  navigationRef?: React.MutableRefObject<any>;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ navigationRef }) => {
  const localNavRef = useRef<any>();
  const navRef = navigationRef || localNavRef;
  // Simple mock auth state - in real app, this would come from AsyncStorage or secure storage
  const [isAuthenticated] = useState(false);

  return (
    <NavigationContainer ref={navRef}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
