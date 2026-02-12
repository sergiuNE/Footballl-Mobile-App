import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Vul alle velden in');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Wachtwoord moet minstens 6 tekens zijn');
      return;
    }

    setLoading(true);
    try {
      // Maak Firebase user aan
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Sla extra user data op in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        rating: 5, // Start rating
        positions: [], // Favoriete posities
        createdAt: new Date(),
      });

      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Registratie Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Aanmaken</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Naam"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Wachtwoord (min. 6 tekens)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Bezig...' : 'Registreren'}
        </Text>
      </TouchableOpacity>
      
      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Al een account? Log hier in</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});