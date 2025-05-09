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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
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

  // Get background color for status card
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#E8F8F5'; // Light green
      case 'rejected':
        return '#FDEDEC'; // Light red
      case 'pending':
        return '#FEF5E7'; // Light orange
      case 'under_review':
        return '#EBF5FB'; // Light blue
      default:
        return '#F8F9F9'; // Light gray
    }
  };

  // Get text color for status message
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#27ae60'; // Green
      case 'rejected':
        return '#e74c3c'; // Red
      case 'pending':
        return '#f39c12'; // Orange
      case 'under_review':
        return '#3498db'; // Blue
      default:
        return '#7f8c8d'; // Gray
    }
  };

  // Status message based on status
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Certification Approved';
      case 'rejected':
        return 'Certification Rejected';
      case 'pending':
        return 'Under Review';
      case 'under_review':
        return 'Under Review';
      case 'not_submitted':
        return 'Not Submitted';
      default:
        return 'Certification Incomplete';
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
        {/* Header with Gradient */}
        <LinearGradient
          colors={[colors.primary, '#e67e22']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerText}>Business Dashboard</Text>
              <Text style={styles.headerSubText}>{data.stats.business_name || 'Loading...'}</Text>
              <View
                style={[
                  styles.statusContainer,
                  { backgroundColor: getStatusBgColor(data.stats.certification_status) }
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(data.stats.certification_status) }]} />
                <Text style={styles.statusText}>{formatStatus(data.stats.certification_status)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Business Statistics - Cards Layout */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: '#FEF5E7' }]}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path d="M4 4h16v2H4zm0 6h16v2H4zm0 6h16v2H4z" fill="#f39c12" />
              </Svg>
            </View>
            <Text style={styles.statsValue}>{data.stats.total_scans}</Text>
            <Text style={styles.statsLabel}>Total Scans</Text>
          </View>
          
          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: '#E8F6F3' }]}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#16a085" />
              </Svg>
            </View>
            <Text style={styles.statsValue}>{data.stats.total_feedback}</Text>
            <Text style={styles.statsLabel}>Total Feedback</Text>
          </View>
          
          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: '#FCF3CF' }]}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#f1c40f" />
              </Svg>
            </View>
            <Text style={styles.statsValue}>{data.stats.average_rating ? data.stats.average_rating.toFixed(1) : '0.0'}</Text>
            <Text style={styles.statsLabel}>Average Rating</Text>
          </View>
          
          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: '#EBDEF0' }]}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path d="M19.07 4.93C17.22 3 14.66 1.96 12 2c-2.66-.04-5.21 1-7.06 2.93C3 6.78 1.96 9.34 2 12c-.04 2.66 1 5.21 2.93 7.06C6.78 21 9.34 22.04 12 22c2.66.04 5.21-1 7.06-2.93C21 17.22 22.04 14.66 22 12c.04-2.66-1-5.22-2.93-7.07M17 13h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="#8e44ad" />
              </Svg>
            </View>
            <Text style={styles.statsValue}>{data.stats.cleanliness_rating || 0}</Text>
            <Text style={styles.statsLabel}>Cleanliness</Text>
          </View>
        </View>

        {/* Progress with Circular Display */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Certification Progress</Text>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressTextContainer}>
              <Svg height="140" width="140" viewBox="0 0 100 100">
                <Circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#EEEEEE"
                  strokeWidth="8"
                  fill="transparent"
                />
                <Circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={colors.primary}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - data.completion_percentage / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <SvgText
                  x="50"
                  y="50"
                  fontSize="20"
                  fontWeight="bold"
                  fill={colors.text}
                  textAnchor="middle"
                  dy="8"
                >
                  {Math.round(data.completion_percentage)}%
                </SvgText>
              </Svg>
            </View>
            
            <View style={styles.progressDetailsContainer}>
              <Text style={styles.progressDetailsTitle}>Certification Steps</Text>
              <Text style={styles.progressDetailsText}>
                You've completed {Object.values(data.progress).filter(Boolean).length} of 5 certification steps.
              </Text>
              <TouchableOpacity
                style={styles.progressDetailsButton}
                onPress={navigateToCertification}
              >
                <Text style={styles.progressDetailsButtonText}>
                  Continue Certification
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Enhanced Application Checklist */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Application Checklist</Text>
          <View style={styles.checklistContainer}>
            {/* Business Details Step */}
            <TouchableOpacity 
              style={styles.checklistItemContainer}
              onPress={navigateToCertification}
            >
              <View style={styles.checklistItem}>
                <View
                  style={[
                    styles.checkIconContainer,
                    {
                      backgroundColor: data.progress.business_details ? '#E8F8F5' : '#FDEDEC',
                      borderColor: data.progress.business_details ? '#27ae60' : '#e74c3c',
                    },
                  ]}
                >
                  <Text 
                    style={[
                      styles.checkIconText,
                      { color: data.progress.business_details ? '#27ae60' : '#e74c3c' }
                    ]}
                  >
                    {data.progress.business_details ? '✓' : '1'}
                  </Text>
                </View>
                <View style={styles.checklistTextContainer}>
                  <Text style={styles.checklistTitle}>Business Details</Text>
                  <Text style={styles.checklistDescription}>Company information, registration, and tax details</Text>
                </View>
                <View style={styles.checklistStatus}>
                  <Text style={[styles.checklistStatusText, { color: data.progress.business_details ? '#27ae60' : '#e74c3c' }]}>
                    {data.progress.business_details ? 'Complete' : 'Incomplete'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Owner Details Step */}
            <TouchableOpacity 
              style={styles.checklistItemContainer}
              onPress={navigateToCertification}
            >
              <View style={styles.checklistItem}>
                <View
                  style={[
                    styles.checkIconContainer,
                    {
                      backgroundColor: data.progress.owner_details ? '#E8F8F5' : '#FDEDEC',
                      borderColor: data.progress.owner_details ? '#27ae60' : '#e74c3c',
                    },
                  ]}
                >
                  <Text 
                    style={[
                      styles.checkIconText,
                      { color: data.progress.owner_details ? '#27ae60' : '#e74c3c' }
                    ]}
                  >
                    {data.progress.owner_details ? '✓' : '2'}
                  </Text>
                </View>
                <View style={styles.checklistTextContainer}>
                  <Text style={styles.checklistTitle}>Owner Details</Text>
                  <Text style={styles.checklistDescription}>Owner identification and contact information</Text>
                </View>
                <View style={styles.checklistStatus}>
                  <Text style={[styles.checklistStatusText, { color: data.progress.owner_details ? '#27ae60' : '#e74c3c' }]}>
                    {data.progress.owner_details ? 'Complete' : 'Incomplete'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Vendor Compliance Step */}
            <TouchableOpacity 
              style={styles.checklistItemContainer}
              onPress={navigateToCertification}
            >
              <View style={styles.checklistItem}>
                <View
                  style={[
                    styles.checkIconContainer,
                    {
                      backgroundColor: data.progress.vendor_compliance ? '#E8F8F5' : '#FDEDEC',
                      borderColor: data.progress.vendor_compliance ? '#27ae60' : '#e74c3c',
                    },
                  ]}
                >
                  <Text 
                    style={[
                      styles.checkIconText,
                      { color: data.progress.vendor_compliance ? '#27ae60' : '#e74c3c' }
                    ]}
                  >
                    {data.progress.vendor_compliance ? '✓' : '3'}
                  </Text>
                </View>
                <View style={styles.checklistTextContainer}>
                  <Text style={styles.checklistTitle}>Vendor Compliance</Text>
                  <Text style={styles.checklistDescription}>Supplier and sourcing information</Text>
                </View>
                <View style={styles.checklistStatus}>
                  <Text style={[styles.checklistStatusText, { color: data.progress.vendor_compliance ? '#27ae60' : '#e74c3c' }]}>
                    {data.progress.vendor_compliance ? 'Complete' : 'Incomplete'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Cleanliness Step */}
            <TouchableOpacity 
              style={styles.checklistItemContainer}
              onPress={navigateToCertification}
            >
              <View style={styles.checklistItem}>
                <View
                  style={[
                    styles.checkIconContainer,
                    {
                      backgroundColor: data.progress.cleanliness ? '#E8F8F5' : '#FDEDEC',
                      borderColor: data.progress.cleanliness ? '#27ae60' : '#e74c3c',
                    },
                  ]}
                >
                  <Text 
                    style={[
                      styles.checkIconText,
                      { color: data.progress.cleanliness ? '#27ae60' : '#e74c3c' }
                    ]}
                  >
                    {data.progress.cleanliness ? '✓' : '4'}
                  </Text>
                </View>
                <View style={styles.checklistTextContainer}>
                  <Text style={styles.checklistTitle}>Cleanliness & Hygiene</Text>
                  <Text style={styles.checklistDescription}>Sanitation practices and facility conditions</Text>
                </View>
                <View style={styles.checklistStatus}>
                  <Text style={[styles.checklistStatusText, { color: data.progress.cleanliness ? '#27ae60' : '#e74c3c' }]}>
                    {data.progress.cleanliness ? 'Complete' : 'Incomplete'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Cruelty Free Step */}
            <TouchableOpacity 
              style={styles.checklistItemContainer}
              onPress={navigateToCertification}
            >
              <View style={styles.checklistItem}>
                <View
                  style={[
                    styles.checkIconContainer,
                    {
                      backgroundColor: data.progress.cruelty_free ? '#E8F8F5' : '#FDEDEC',
                      borderColor: data.progress.cruelty_free ? '#27ae60' : '#e74c3c',
                    },
                  ]}
                >
                  <Text 
                    style={[
                      styles.checkIconText,
                      { color: data.progress.cruelty_free ? '#27ae60' : '#e74c3c' }
                    ]}
                  >
                    {data.progress.cruelty_free ? '✓' : '5'}
                  </Text>
                </View>
                <View style={styles.checklistTextContainer}>
                  <Text style={styles.checklistTitle}>Cruelty Free Verification</Text>
                  <Text style={styles.checklistDescription}>Animal welfare standards and testing policies</Text>
                </View>
                <View style={styles.checklistStatus}>
                  <Text style={[styles.checklistStatusText, { color: data.progress.cruelty_free ? '#27ae60' : '#e74c3c' }]}>
                    {data.progress.cruelty_free ? 'Complete' : 'Incomplete'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Certification Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Certification Status</Text>
          <View style={[styles.statusCard, { backgroundColor: getStatusBgColor(data.stats.certification_status) }]}>
            <View style={styles.statusCardIconContainer}>
              <Svg width="40" height="40" viewBox="0 0 24 24">
                {data.stats.certification_status === 'approved' ? (
                  <Path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#27ae60"/>
                ) : data.stats.certification_status === 'rejected' ? (
                  <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#e74c3c"/>
                ) : (
                  <Path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#f39c12"/>
                )}
              </Svg>
            </View>
            <View style={styles.statusCardContent}>
              <Text style={[styles.statusCardTitle, { color: getStatusTextColor(data.stats.certification_status) }]}>
                {getStatusMessage(data.stats.certification_status)}
              </Text>
              <Text style={styles.statusCardText}>
                {data.completion_percentage < 100 
                  ? 'Complete all steps to get certification approval.' 
                  : data.stats.certification_status === 'approved' 
                    ? 'Your business is certified! You can now add products.' 
                    : 'Your application has been submitted and is being reviewed.'}
              </Text>
            </View>
          </View>
        </View>
        {/* Action Buttons - Use when completion percentage is less than 100% */}
        {data.completion_percentage < 100 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={navigateToCertification}
          >
            <LinearGradient
              colors={[colors.primary, '#e67e22']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeButtonGradient}
            >
              <Text style={styles.completeButtonText}>
                Continue Certification
              </Text>
            </LinearGradient>
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
  // Loading states
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
  // Error states
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
    marginBottom: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Header styles
  header: {
    padding: 0,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  headerGradient: {
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerContent: {
    padding: 20,
    alignItems: 'center',
  },
  businessName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  // Stats section styles
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  statsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  // Progress styles
  progressBarContainer: {
    marginBottom: 25,
  },
  progressBarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginBottom: 5,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
  },
  progressBarLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBarLabel: {
    fontSize: 12,
    color: '#888',
  },
  progressCircleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  progressTextContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  progressDetailsContainer: {
    flex: 1,
    minWidth: 200,
  },
  progressDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressDetailsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  progressDetailsButton: {
    backgroundColor: '#f39c12',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  progressDetailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Circle progress styles
  circleProgressContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValueText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  progressPercentText: {
    fontSize: 16,
    color: '#666',
  },
  // Checklist styles
  checklistContainer: {
    marginBottom: 20,
  },
  checkIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  checklistHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  checklistItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  checkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
  },
  checklistItemContent: {
    flex: 1,
  },
  checklistTextContainer: {
    flex: 1,
    paddingVertical: 5,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  checklistDescription: {
    fontSize: 12,
    color: '#777',
  },
  checklistStatus: {
    marginLeft: 10,
  },
  checklistStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  checklistItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  checklistItemDescription: {
    fontSize: 13,
    color: '#666',
  },
  // Status card styles
  statusCard: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 16,
  },
  statusCardIconContainer: {
    marginRight: 16,
  },
  statusCardContent: {
    flex: 1,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusCardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Button styles
  completeButtonGradient: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  completeButton: {
    borderRadius: 8,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Card styles
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
  // Document styles
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
  // Warning card styles
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
  // Additional styles (don't remove - used elsewhere)
}); 