import { View, Text, StyleSheet } from 'react-native';

export default function Create() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>➕ Aanmaken</Text>
      <Text>Maak een wedstrijd aan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});