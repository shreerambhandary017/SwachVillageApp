import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../utils/config';
import { useTheme } from '../utils/ThemeContext';
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
interface DashboardStats {
  business_name: string;
  certification_status: string;
  cleanliness_rating: number;
  total_scans: number;
  total_feedback: number;
  average_rating: number;
}

interface DashboardProgress {
  business_details: boolean;
  owner_details: boolean;
  vendor_compliance: boolean;
  cleanliness: boolean;
  cruelty_free: boolean;
}

interface ActivityItem {
  id: string;
  type: string;
  product_name?: string;
  rating?: number;
  comment?: string;
  consumer_name: string;
  timestamp: string;
}

interface DashboardData {
  stats: DashboardStats;
  progress: DashboardProgress;
  completion_percentage: number;
  recent_activity: ActivityItem[];
  certification_complete: boolean;
}

export default function BusinessDashboard() {
  const router = useRouter();
  const { colors, theme } = useTheme();
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
      const response = await fetch(`${API_CONFIG.API_URL}/business/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }

      const result = await response.json();
      console.log('Dashboard data:', result);
      setData(result);
    } catch (error: any) {
      console.error('Dashboard error:', error);
      setError(error.message || 'An error occurred while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const navigateToCertification = () => {
    router.push('/certification');
  };

  // Status badge color based on certification status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme === 'dark' ? '#2ecc71' : '#27ae60'; // Green
      case 'rejected':
        return theme === 'dark' ? '#e74c3c' : '#c0392b'; // Red
      case 'pending':
        return theme === 'dark' ? '#f39c12' : '#e67e22'; // Orange/Amber for pending
      case 'under_review':
        return theme === 'dark' ? '#3498db' : '#2980b9'; // Blue for under review
      default:
        return theme === 'dark' ? '#95a5a6' : '#7f8c8d'; // Gray for not submitted or other statuses
    }
  };

  // Format certification status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      case 'under_review':
        return 'Under Review';
      case 'not_submitted':
        return 'Not Submitted';
      default:
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme === 'dark' ? '#e74c3c' : '#c0392b' }]}>Error</Text>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.primary }]}
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>No Data Available</Text>
          <Text style={[styles.errorText, { color: colors.text }]}>
            We couldn't find any dashboard data for your business.
          </Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.primary }]}
            onPress={fetchDashboardData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Business Dashboard</Text>
          <Text style={styles.subtitle}>{data.stats.business_name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(data.stats.certification_status) },
            ]}
          >
            <Text style={styles.statusText}>
              {formatStatus(data.stats.certification_status)}
            </Text>
          </View>
        </View>

        {/* Business Statistics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Statistics</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Total Scans:</Text>
              <Text style={styles.infoValue}>
                {data.stats.total_scans}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Total Feedback:</Text>
              <Text style={styles.infoValue}>
                {data.stats.total_feedback}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Average Rating:</Text>
              <Text style={styles.infoValue}>
                {data.stats.average_rating ? data.stats.average_rating.toFixed(1) : '0.0'} / 5.0
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cleanliness Rating:</Text>
              <Text style={styles.infoValue}>
                {data.stats.cleanliness_rating || 0} / 5
              </Text>
            </View>
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
            {Math.round(data.completion_percentage)}% Complete
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
                    backgroundColor: data.progress.business_details
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.progress.business_details ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Business Details</Text>
            </View>

            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.progress.owner_details
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.progress.owner_details ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Owner Details</Text>
            </View>

            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.progress.vendor_compliance
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.progress.vendor_compliance ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Vendor Compliance</Text>
            </View>

            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.progress.cleanliness
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.progress.cleanliness ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Cleanliness & Hygiene</Text>
            </View>

            <View style={styles.checklistItem}>
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: data.progress.cruelty_free
                      ? '#27ae60'
                      : '#e74c3c',
                  },
                ]}
              >
                <Text style={styles.checkIconText}>
                  {data.progress.cruelty_free ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.checklistText}>Cruelty Free Verification</Text>
            </View>
          </View>
        </View>

        {/* Document Uploads */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Document Uploads</Text>
          <View style={styles.documentContainer}>
            <View style={styles.documentCircle}>
              <Text style={styles.documentCount}>{Object.values(data.progress).filter(Boolean).length}</Text>
            </View>
            <Text style={styles.documentText}>
              {Object.values(data.progress).filter(Boolean).length} of 5 sections completed
            </Text>
          </View>
        </View>
        {/* Certification Button */}
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

// Add additional styles for the activity section
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  infoContainer: {
    marginTop: 5,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
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
    borderRadius: 15,
    padding: 18,
    marginBottom: 18,
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
    borderRadius: 6,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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