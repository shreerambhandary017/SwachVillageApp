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
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_CONFIG.API_URL}/consumer/businesses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }

      const data = await response.json();
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
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

  const renderBusinessItem = ({ item }: { item: Business }) => (
    <View style={[styles.businessCard, { backgroundColor: colors.surface }]}>
      <View style={styles.businessLogoContainer}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.businessLogo} />
        ) : (
          <View style={[styles.businessLogoPlaceholder, { backgroundColor: colors.primary }]}>
            <Ionicons name="business-outline" size={24} color="white" />
          </View>
        )}
      </View>
      <View style={styles.businessInfo}>
        <Text style={[styles.businessName, { color: colors.text }]}>{item.business_name}</Text>
        <Text style={[styles.businessDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description || 'Certified clean and cruelty-free business'}
        </Text>
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>({item.rating.toFixed(1)})</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Swach Village</Text>
        <TouchableOpacity style={[styles.profileButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/profile')}>
          <Ionicons name="person" size={20} color="white" />
        </TouchableOpacity>
      </View>

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
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                Certified Eco-Friendly Businesses
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  listHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  businessCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  businessLogoContainer: {
    marginRight: 16,
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  businessLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  businessDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
  },
});