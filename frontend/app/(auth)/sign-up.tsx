import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { registerUser, UserRole, navigateByRole } from '../utils/auth';
import { useTheme } from '../utils/ThemeContext';
import ThemeSwitch from '../components/ThemeSwitch';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [role, setRole] = useState<UserRole>('consumer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const validateInputs = () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (role === 'business' && !businessName) {
      setError('Business name is required for business accounts');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Basic phone validation (at least 10 digits)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return false;
    }
    
    return true;
  };
  
  const handleSignUp = async () => {
    if (!validateInputs()) {
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const credentials = {
        full_name: fullName,
        email,
        phone,
        password,
        role,
        ...(role === 'business' && { business_name: businessName })
      };
      
      // Register user and get response
      const response = await registerUser(credentials);
      
      console.log('Registration successful, preparing to redirect...');
      
      // Show success alert
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully.',
        [
          { 
            text: 'OK',
            onPress: async () => {
              // Use the navigation helper function
              await navigateByRole(router);
            } 
          }
        ]
      );
      
      // Also trigger navigation directly in case alert handling fails
      await navigateByRole(router);
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.themeSwitch}>
              <ThemeSwitch />
            </View>
            
            <View style={styles.headerContainer}>
              <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
                <Image
                  source={require('../../assets/images/swach_logo.png')}
                  style={styles.logo}
                  contentFit="contain"
                />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join Swach Village</Text>
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <View style={[styles.form, { backgroundColor: colors.surface }]}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                  />
                </View>
              </View>
              
              <View style={styles.roleToggleContainer}>
                <Text style={[styles.label, { color: colors.text }]}>I am a:</Text>
                <View style={styles.toggleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'business' && styles.activeRoleButton
                    ]}
                    onPress={() => setRole('business')}
                  >
                    <Text 
                      style={[
                        styles.roleButtonText, 
                        role === 'business' && styles.activeRoleButtonText
                      ]}
                    >
                      Business
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'consumer' && styles.activeRoleButton
                    ]}
                    onPress={() => setRole('consumer')}
                  >
                    <Text 
                      style={[
                        styles.roleButtonText, 
                        role === 'consumer' && styles.activeRoleButtonText
                      ]}
                    >
                      Consumer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {role === 'business' && (
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>Business Name</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                    <Ionicons name="business-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={businessName}
                      onChangeText={setBusinessName}
                      placeholder="Enter your business name"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={[styles.signUpButton, { backgroundColor: colors.primary }]} 
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.signInContainer}>
                <Text style={[styles.signInText, { color: colors.textSecondary }]}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                  <Text style={[styles.signInLink, { color: colors.primary }]}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  themeSwitch: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  roleToggleContainer: {
    marginBottom: 25,
  },
  toggleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#eee',
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeRoleButton: {
    backgroundColor: '#FF7B00',
    borderColor: '#FF7B00',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeRoleButtonText: {
    color: '#fff',
  },
  signUpButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signInText: {
    fontSize: 16,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 15,
  },
}); 