import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { API_CONFIG } from '../utils/config';
import { getAuthToken } from '../utils/auth';

// Business type definition
type Business = {
  id: number;
  business_name: string;
  description: string;
  certification_status: string;
  rating: number;
  logo_url?: string;
};

export default function ConsumerDashboard() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      
      // Get authentication token
      const token = await getAuthToken();
      
      if (!token) {
        // Redirect to login if not authenticated
        console.log('No authentication token found, redirecting to login');
        router.replace('/(auth)/sign-in');
        return;
      }
      
      const response = await fetch(`${API_CONFIG.API_URL}/consumer/businesses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired, redirect to login
          console.log('Authentication token invalid or expired, redirecting to login');
          router.replace('/(auth)/sign-in');
          return;
        }
        throw new Error('Failed to fetch businesses');
      }

      const data = await response.json();
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      
      // Check if error is authentication related
      if (error instanceof Error && error.message === 'Authentication required') {
        router.replace('/(auth)/sign-in');
        return;
      }
      
      setError('Unable to load businesses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to render stars based on rating
  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`full-${i}`} name="star" size={16} color={colors.primary} style={styles.starIcon} />
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color={colors.primary} style={styles.starIcon} />
      );
    }

    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color={colors.primary} style={styles.starIcon} />
      );
    }

    return stars;
  };

  const  renderBusinessItem = ({ item }: { item: Business }) => (
    <TouchableOpacity 
      style={[styles.businessCard, { backgroundColor: colors.surface }]}
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to business details when implemented
        // For now, just show a feedback message
        console.log(`Selected business: ${item.business_name}`);
      }}
    >
      <View style={styles.businessContent}>
        <View style={styles.businessLogoContainer}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.businessLogo} resizeMode="cover" />
          ) : (
            <View style={[styles.businessLogoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="business-outline" size={24} color={colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.businessInfo}>
          <View style={styles.businessNameRow}>
            <Text style={[styles.businessName, { color: colors.text }]}>{item.business_name}</Text>
            {item.certification_status === 'certified' && (
              <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.verifiedIcon} />
            )}
          </View>
          <Text style={[styles.businessDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description || 'Certified clean and cruelty-free business'}
          </Text>
          <View style={styles.businessFooter}>
            <View style={styles.ratingContainer}>
              {renderRatingStars(item.rating)}
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>({item.rating.toFixed(1)})</Text>
            </View>
            <View style={[styles.categoryTag, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>Eco-friendly</Text>
            </View>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={styles.cardArrow} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Ionicons name="leaf" size={24} color={colors.primary} style={styles.titleIcon} />
            <Text style={[styles.title, { color: colors.text }]}>Swach Village</Text>
          </View>
          <TouchableOpacity 
            style={[styles.profileButton, { backgroundColor: theme === 'dark' ? colors.surface : colors.background }]} 
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>Search eco-friendly businesses...</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading businesses...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchBusinesses}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : businesses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No certified businesses found</Text>
          </View>
        ) : (
          <FlatList
            data={businesses}
            renderItem={renderBusinessItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Certified Businesses
                  </Text>
                  <View style={[styles.certificationBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                    <Text style={[styles.certificationText, { color: colors.primary }]}>Swach Verified</Text>
                  </View>
                </View>
                
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  Eco-friendly, cruelty-free businesses committed to sustainability
                </Text>
              </View>
            }
            refreshing={loading}
            onRefresh={fetchBusinesses}
            bounces={true}
            showsVerticalScrollIndicator={false}
            fadingEdgeLength={50}
          />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    borderRadius: 22,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  listHeader: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  certificationText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  businessCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  businessContent: {
    flex: 1,
    flexDirection: 'row',
  },
  businessLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  businessLogo: {
    width: '100%',
    height: '100%',
  },
  businessLogoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  businessInfo: {
    flex: 1,
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  businessDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  businessFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardArrow: {
    marginLeft: 8,
  },
});