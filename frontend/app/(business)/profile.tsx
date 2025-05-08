import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getAuthToken, logoutUser } from '../utils/auth';
import { useRouter } from 'expo-router';

// Types for profile data
interface BusinessProfile {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  joined_date: string;
  business: {
    business_name: string;
    registration_number: string;
    pan_card: string;
    aadhaar_card: string;
    gst_number: string;
    owner_name: string;
    citizenship: string;
    cleanliness_rating: number;
    is_vegetarian: boolean;
    is_vegan: boolean;
    cruelty_free: boolean;
    sustainability: string;
    certification_status: string;
    certification_date: string;
  };
}

export default function BusinessProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BusinessProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Get auth token
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch profile data from API
      const response = await fetch('http://192.168.1.5:5000/api/business/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch profile data');
      }

      setData(result.data);
    } catch (error: any) {
      console.error('Profile error:', error);
      setError(error.message || 'An error occurred while fetching profile data');
      
      // Use mock data for testing when API fails
      setData({
        user_id: 123,
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 98765 43210',
        role: 'business',
        joined_date: '2023-05-10T08:30:00Z',
        business: {
          business_name: 'Eco-Friendly Products Ltd.',
          registration_number: 'BUS12345678',
          pan_card: 'ABCDE1234F',
          aadhaar_card: '1234-5678-9012',
          gst_number: '22AAAAA0000A1Z5',
          owner_name: 'John Doe',
          citizenship: 'Indian',
          cleanliness_rating: 4,
          is_vegetarian: true,
          is_vegan: false,
          cruelty_free: true,
          sustainability: 'Uses recyclable packaging and sustainable sourcing',
          certification_status: 'pending',
          certification_date: '2023-06-15T14:30:00Z'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/certification');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#27ae60'; // Green
      case 'rejected':
        return '#e74c3c'; // Red
      default:
        return '#f39c12'; // Orange/Amber for pending
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f39c12" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchProfileData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Profile Data</Text>
          <Text style={styles.errorText}>
            We couldn't find any profile data for your business.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchProfileData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {data.full_name.substring(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>{data.full_name}</Text>
          <Text style={styles.subtitle}>{data.business.business_name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(data.business.certification_status) },
            ]}
          >
            <Text style={styles.statusText}>
              {data.business.certification_status.charAt(0).toUpperCase() + 
              data.business.certification_status.slice(1)}
            </Text>
          </View>
        </View>

        {/* User Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{data.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{data.phone || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{data.role.charAt(0).toUpperCase() + data.role.slice(1)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>
              {new Date(data.joined_date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Business Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Owner</Text>
            <Text style={styles.infoValue}>{data.business.owner_name || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration</Text>
            <Text style={styles.infoValue}>{data.business.registration_number || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PAN Card</Text>
            <Text style={styles.infoValue}>{data.business.pan_card || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>GST Number</Text>
            <Text style={styles.infoValue}>{data.business.gst_number || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Citizenship</Text>
            <Text style={styles.infoValue}>{data.business.citizenship || 'Not provided'}</Text>
          </View>
        </View>

        {/* Certification Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Certification Details</Text>
          
          <View style={styles.complianceRow}>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceLabel}>Cleanliness</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text 
                    key={star} 
                    style={{ 
                      color: star <= (data.business.cleanliness_rating || 0) ? '#f39c12' : '#ddd', 
                      fontSize: 18 
                    }}
                  >
                    ★
                  </Text>
                ))}
              </View>
            </View>
            
            <View style={styles.complianceItem}>
              <Text style={styles.complianceLabel}>Vegetarian</Text>
              <Text style={styles.complianceValue}>
                {data.business.is_vegetarian ? 'Yes' : 'No'}
              </Text>
            </View>
            
            <View style={styles.complianceItem}>
              <Text style={styles.complianceLabel}>Vegan</Text>
              <Text style={styles.complianceValue}>
                {data.business.is_vegan ? 'Yes' : 'No'}
              </Text>
            </View>
            
            <View style={styles.complianceItem}>
              <Text style={styles.complianceLabel}>Cruelty-Free</Text>
              <Text style={styles.complianceValue}>
                {data.business.cruelty_free ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sustainability</Text>
            <Text style={styles.infoValue}>
              {data.business.sustainability || 'Not provided'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Certified On</Text>
            <Text style={styles.infoValue}>
              {data.business.certification_date 
                ? new Date(data.business.certification_date).toLocaleDateString() 
                : 'Not certified yet'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editButtonText}>
            Edit Certification Details
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>
            Log Out
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#f39c12',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 5,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  complianceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    marginTop: 5,
  },
  complianceItem: {
    width: '50%',
    marginBottom: 15,
  },
  complianceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  complianceValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#f39c12',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 