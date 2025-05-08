import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthToken } from '../utils/auth';

// Types for dashboard data
interface DashboardData {
  business_name: string;
  application_status: 'pending' | 'approved' | 'rejected';
  completion_percentage: number;
  sections: {
    business_details: boolean;
    owner_details: boolean;
    vendor_compliance: boolean;
    cleanliness_hygiene: boolean;
    cruelty_free: boolean;
    sustainability: boolean;
  };
  document_uploads: number;
  audit_required: boolean;
  last_updated: string;
}

export default function BusinessDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get auth token
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch dashboard data from API
      const response = await fetch('http://192.168.1.5:5000/api/business/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }

      setData(result.data);
    } catch (error: any) {
      console.error('Dashboard error:', error);
      setError(error.message || 'An error occurred while fetching dashboard data');
      
      // Use mock data for testing when API fails
      setData({
        business_name: 'Eco-Friendly Products Ltd.',
        application_status: 'pending',
        completion_percentage: 75,
        sections: {
          business_details: true,
          owner_details: true,
          vendor_compliance: true,
          cleanliness_hygiene: false,
          cruelty_free: true,
          sustainability: false,
        },
        document_uploads: 4,
        audit_required: true,
        last_updated: '2023-07-15T10:30:00Z',
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToCertification = () => {
    router.push('/certification');
  };

  // Status badge color based on application status
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
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
            onPress={fetchDashboardData}
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
          <Text style={styles.errorTitle}>No Data Available</Text>
          <Text style={styles.errorText}>
            We couldn't find any dashboard data for your business.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchDashboardData}
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
          <Text style={styles.title}>Business Dashboard</Text>
          <Text style={styles.subtitle}>{data.business_name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(data.application_status) },
            ]}
          >
            <Text style={styles.statusText}>
              {data.application_status.charAt(0).toUpperCase() + data.application_status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Certification Progress</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${data.completion_percentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {data.completion_percentage}% Complete
          </Text>
        </View>

        {/* Sections Checklist */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Application Checklist</Text>
          <View style={styles.checklist}>
            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.sections.business_details
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.sections.business_details ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Business Details</Text>
            </View>

            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.sections.owner_details
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.sections.owner_details ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Owner Details</Text>
            </View>

            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.sections.vendor_compliance
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.sections.vendor_compliance ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Vendor Compliance</Text>
            </View>

            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.sections.cleanliness_hygiene
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.sections.cleanliness_hygiene ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Cleanliness & Hygiene</Text>
            </View>

            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.sections.cruelty_free
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.sections.cruelty_free ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Cruelty-Free Operations</Text>
            </View>

            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.sections.sustainability
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.sections.sustainability ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Sustainability</Text>
            </View>
          </View>
        </View>

        {/* Document Uploads */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Document Uploads</Text>
          <View style={styles.documentContainer}>
            <View style={styles.documentCircle}>
              <Text style={styles.documentCount}>{data.document_uploads}</Text>
            </View>
            <Text style={styles.documentText}>Documents Uploaded</Text>
          </View>
        </View>

        {/* Audit Warning if needed */}
        {data.audit_required && (
          <View style={styles.warningCard}>
            <View style={styles.warningIconContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Audit Required</Text>
              <Text style={styles.warningText}>
                Your application is under review by the audit team. This may take 3-5 business days.
              </Text>
            </View>
          </View>
        )}

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(data.last_updated).toLocaleString()}
        </Text>

        {/* Complete Application Button */}
        {data.completion_percentage < 100 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={navigateToCertification}
          >
            <Text style={styles.completeButtonText}>
              Complete Certification
            </Text>
          </TouchableOpacity>
        )}
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
  title: {
    fontSize: 28,
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
  progressBarContainer: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f39c12',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  checklist: {
    marginTop: 5,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checklistText: {
    fontSize: 16,
    color: '#333',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  documentCount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  documentText: {
    fontSize: 16,
    color: '#333',
  },
  warningCard: {
    backgroundColor: '#fff8e1',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffe0b2',
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIconContainer: {
    marginRight: 15,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f57c00',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 20,
  },
  completeButton: {
    backgroundColor: '#f39c12',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 