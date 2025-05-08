import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { API_CONFIG } from '../utils/config';
import { getUserData, getAuthToken } from '../utils/auth';

// Feedback type definition
type Feedback = {
  id: number;
  business_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function FeedbackScreen() {
  const { colors } = useTheme();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_CONFIG.API_URL}/consumer/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setFeedback(data.feedback || []);
      } else {
        setError(data.message || 'Failed to fetch feedback');
      }
    } catch (error: any) {
      console.error('Error fetching feedback:', error);
      setError(error.message || 'Could not load your feedback. Please try again later.');
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

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderFeedbackItem = ({ item }: { item: Feedback }) => (
    <View style={[styles.feedbackCard, { backgroundColor: colors.surface }]}>
      <View style={styles.feedbackHeader}>
        <Text style={[styles.businessName, { color: colors.text }]}>{item.business_name}</Text>
        <Text style={[styles.feedbackDate, { color: colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      
      <View style={styles.ratingContainer}>
        {renderRatingStars(item.rating)}
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>({item.rating.toFixed(1)})</Text>
      </View>
      
      <Text style={[styles.feedbackComment, { color: colors.text }]}>
        {item.comment || 'No comment provided'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Your Feedback</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Reviews you've submitted
        </Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your feedback...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchFeedback}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : feedback.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You haven't provided any feedback yet
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Your reviews of businesses will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={feedback}
          renderItem={renderFeedbackItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
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
    fontWeight: '500',
  },
  emptySubText: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  feedbackCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackDate: {
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  feedbackComment: {
    fontSize: 14,
    lineHeight: 20,
  },
});
