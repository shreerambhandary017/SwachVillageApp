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
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
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
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateImage}>
            <Svg width="120" height="120" viewBox="0 0 120 120">
              <Circle cx="60" cy="60" r="50" fill="#FFEBEE" stroke="#F39C12" strokeWidth="4"/>
              <SvgText x="60" y="70" fontSize="50" fill="#F39C12" textAnchor="middle" fontWeight="bold">!</SvgText>
            </Svg>
          </View>
          <Text style={styles.emptyStateTitle}>Oops! Something went wrong</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={fetchFeedbackData}
          >
            <Text style={styles.actionButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data || !data.feedback || data.feedback.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateImage}>
            <Svg width="120" height="120" viewBox="0 0 120 120">
              <Circle cx="60" cy="60" r="50" fill="#FFF3E0" stroke="#F39C12" strokeWidth="4"/>
              <Circle cx="45" cy="45" r="5" fill="#F39C12"/>
              <Circle cx="75" cy="45" r="5" fill="#F39C12"/>
              <Path d="M40 80 A20 20 0 0 0 80 80" stroke="#F39C12" strokeWidth="4" fill="none"/>
            </Svg>
          </View>
          <Text style={styles.emptyStateTitle}>No Feedback Yet</Text>
          <Text style={styles.emptyStateText}>
            You haven't received any customer feedback yet. When customers leave reviews for your products, they'll appear here.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={fetchFeedbackData}
          >
            <Text style={styles.actionButtonText}>Refresh</Text>
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
            <Text style={styles.overallRatingValue}>
              {typeof data.summary.average_rating === 'number' ? data.summary.average_rating.toFixed(1) : '0.0'}
            </Text>
            <View style={styles.overallRatingDetails}>
              {renderStars(typeof data.summary.average_rating === 'number' ? data.summary.average_rating : 0)}
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
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'rating' && styles.activeSortButtonText
                ]}>Rating</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'date' && styles.activeSortButton
                ]}
                onPress={() => setSortBy('date')}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'date' && styles.activeSortButtonText
                ]}>Date</Text>
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
  // Empty state styles (for both error and no feedback cases)
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#f39c12',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: '#f39c12',
    borderRadius: 8,
    padding: 15,
    width: '80%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Keeping old styles for backward compatibility
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
    borderRadius: 12, // Larger border radius for modern look
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // More elevation for prominent display
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12', // Orange accent border to match theme
  },
  overallRatingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  overallRatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the rating display
  },
  overallRatingValue: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#f39c12',
    marginRight: 18,
    textShadowColor: 'rgba(243, 156, 18, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3, // Add subtle text shadow for emphasis
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 25, // More rounded corners for modern look
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f39c12', // Orange border to match theme
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeRatingFilter: {
    backgroundColor: '#f39c12',
    borderColor: '#e67e22', // Darker orange border for contrast
  },
  ratingFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingFilterText: {
    fontSize: 16,
    color: '#f39c12', // Orange text to match theme
    fontWeight: '500',
  },
  activeRatingFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ratingFilterStar: {
    color: '#f39c12',
    fontSize: 18,
    marginLeft: 5,
  },
  ratingCount: {
    fontSize: 14,
    color: '#777',
    marginLeft: 5,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 5,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  activeSortButton: {
    backgroundColor: '#f39c12',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    borderRadius: 12, // Larger border radius for modern look
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Slight elevation for card-like appearance
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