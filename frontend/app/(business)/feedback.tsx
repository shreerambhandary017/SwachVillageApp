import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../utils/config';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList
} from 'react-native';
import { getAuthToken } from '../utils/auth';

// Types for feedback data
interface Feedback {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  consumer_name: string;
  profile_picture?: string;
}

interface FeedbackSummary {
  total_feedback: number;
  average_rating: number;
  rating_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

interface FeedbackData {
  feedback: Feedback[];
  summary: FeedbackSummary;
}

export default function FeedbackOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FeedbackData | null>(null);
  const [error, setError] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'date'>('rating');

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch feedback data from API
      const response = await fetch(`${API_CONFIG.API_URL}/business/feedback`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch feedback data');
      }

      const result = await response.json();
      console.log('Feedback data:', result);
      setData(result);
    } catch (error: any) {
      console.error('Feedback error:', error);
      setError(error.message || 'An error occurred while fetching feedback data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const sortFeedback = (feedback: Feedback[]) => {
    if (sortBy === 'rating') {
      return [...feedback].sort((a, b) => b.rating - a.rating);
    } else {
      return [...feedback].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  // Filter feedback by rating if a rating filter is selected
  const getFilteredFeedback = () => {
    if (!data || !data.feedback) return [];
    
    if (selectedRating) {
      return data.feedback.filter(item => item.rating === selectedRating);
    }
    
    return data.feedback;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f39c12" />
          <Text style={styles.loadingText}>Loading feedback data...</Text>
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
            onPress={fetchFeedbackData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data || !data.feedback || data.feedback.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Feedback Available</Text>
          <Text style={styles.errorText}>
            Your business doesn't have any products with feedback yet.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchFeedbackData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredFeedback = getFilteredFeedback();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Overall Rating */}
        <View style={styles.overallRatingCard}>
          <Text style={styles.overallRatingTitle}>Overall Customer Satisfaction</Text>
          <View style={styles.overallRatingContent}>
            <Text style={styles.overallRatingValue}>{data.summary.average_rating.toFixed(1)}</Text>
            <View style={styles.overallRatingDetails}>
              {renderStars(data.summary.average_rating)}
              <Text style={styles.totalFeedback}>Based on {data.summary.total_feedback} reviews</Text>
            </View>
          </View>
        </View>

        {/* Rating Filters */}
        <Text style={styles.sectionTitle}>Filter by Rating</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ratingFiltersList}
        >
          {/* All ratings option */}
          <TouchableOpacity
            style={[
              styles.ratingFilterCard,
              selectedRating === null && styles.activeRatingFilter
            ]}
            onPress={() => setSelectedRating(null)}
          >
            <Text 
              style={[
                styles.ratingFilterText,
                selectedRating === null && styles.activeRatingFilterText
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          {/* Individual star ratings from 5 to 1 */}
          {[5, 4, 3, 2, 1].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingFilterCard,
                selectedRating === rating && styles.activeRatingFilter
              ]}
              onPress={() => setSelectedRating(rating)}
            >
              <View style={styles.ratingFilterContent}>
                <Text 
                  style={[
                    styles.ratingFilterText,
                    selectedRating === rating && styles.activeRatingFilterText
                  ]}
                >
                  {rating}
                </Text>
                <Text style={styles.ratingFilterStar}>★</Text>
                <Text 
                  style={[
                    styles.ratingCount,
                    selectedRating === rating && styles.activeRatingFilterText
                  ]}
                >
                  ({data.summary.rating_distribution[rating as 1 | 2 | 3 | 4 | 5]})
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* All Feedback */}
        <View style={styles.feedbackSection}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackTitle}>
              Customer Feedback
              {selectedRating ? ` (${selectedRating} Star${selectedRating !== 1 ? 's' : ''})` : ''}
            </Text>
            <View style={styles.sortOptions}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'rating' && styles.activeSortButton
                ]}
                onPress={() => setSortBy('rating')}
              >
                <Text style={styles.sortButtonText}>Rating</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'date' && styles.activeSortButton
                ]}
                onPress={() => setSortBy('date')}
              >
                <Text style={styles.sortButtonText}>Date</Text>
              </TouchableOpacity>
            </View>
          </View>

          {filteredFeedback.length === 0 ? (
            <View style={styles.noFeedbackContainer}>
              <Text style={styles.noFeedbackText}>
                No feedback available with the selected filter.
              </Text>
            </View>
          ) : (
            sortFeedback(filteredFeedback).map((feedback) => (
              <View key={feedback.id} style={styles.feedbackItem}>
                <View style={styles.feedbackItemHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{feedback.consumer_name}</Text>
                    <Text style={styles.feedbackDate}>{formatDate(feedback.created_at)}</Text>
                  </View>
                  <View style={styles.feedbackRating}>
                    {renderStars(feedback.rating)}
                  </View>
                </View>
                <Text style={styles.feedbackText}>{feedback.comment}</Text>
                
                {feedback.profile_picture && (
                  <View style={styles.userImageContainer}>
                    <Image 
                      source={{ uri: feedback.profile_picture }} 
                      style={styles.userImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                <View style={styles.feedbackFooter}>
                  <Text style={styles.feedbackMetadata}>Feedback ID: #{feedback.id}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const renderStars = (rating: number) => {
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ color: star <= rating ? '#f39c12' : '#ddd', fontSize: 18, marginRight: 2 }}>
          ★
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  overallRatingCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overallRatingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  overallRatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallRatingValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#f39c12',
    marginRight: 15,
  },
  overallRatingDetails: {
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  totalFeedback: {
    color: '#888',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  ratingFiltersList: {
    paddingVertical: 10,
  },
  ratingFilterCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeRatingFilter: {
    borderColor: '#f39c12',
    backgroundColor: '#f39c12',
  },
  ratingFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingFilterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activeRatingFilterText: {
    color: '#fff',
  },
  ratingFilterStar: {
    color: '#f39c12',
    fontSize: 18,
    marginLeft: 3,
  },
  ratingCount: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  feedbackSection: {
    marginTop: 20,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  sortOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 5,
    backgroundColor: '#eee',
  },
  activeSortButton: {
    backgroundColor: '#f39c12',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  noFeedbackContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  noFeedbackText: {
    fontSize: 16,
    color: '#888',
  },
  feedbackItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  feedbackItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feedbackDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  feedbackRating: {
    alignItems: 'flex-end',
  },
  feedbackText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 20,
    marginBottom: 10,
  },
  photosList: {
    marginVertical: 8,
  },
  photoContainer: {
    marginRight: 8,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  photo: {
    width: 100,
    height: 80,
  },
  feedbackFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  upvotes: {
    fontSize: 14,
    color: '#888',
  },
  userImageContainer: {
    marginTop: 5,
    marginBottom: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  userImage: {
    width: '100%',
    height: 200,
  },
  feedbackMetadata: {
    fontSize: 12,
    color: '#888',
  },
}); 