import { Redirect } from 'expo-router';

export default function Index() {
  // Later: check of gebruiker is ingelogd
  const isLoggedIn = false;
  
  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home" />;
  }
  
  return <Redirect href="/(auth)/login" />;
}