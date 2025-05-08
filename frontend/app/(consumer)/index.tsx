import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { logoutUser } from '../utils/auth';

export default function ConsumerDashboard() {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const navigateToScanBarcode = () => {
    router.push('./scan-barcode' as any);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Swach Village</Text>
        <Text style={styles.subtitle}>Verify Clean and Cruelty-Free Products</Text>
        
        <View style={styles.featureCard}>
          <Text style={styles.cardTitle}>Product Verification</Text>
          <Text style={styles.cardDescription}>
            Scan a product barcode to verify if the business is certified clean and cruelty-free.
          </Text>
          
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={navigateToScanBarcode}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                <Image 
                  source={require('../../assets/images/barcode-scan.png')} 
                  style={styles.buttonIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.scanButtonText}>Scan Product Barcode</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.recentScansContainer}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <View style={styles.emptyScans}>
            <Text style={styles.emptyText}>No recent scans</Text>
            <Text style={styles.emptyTextSub}>Your recently scanned products will appear here</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 10,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recentScansContainer: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyScans: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
    marginBottom: 5,
  },
  emptyTextSub: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 