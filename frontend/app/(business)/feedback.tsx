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
  FlatList
} from 'react-native';
import { getAuthToken } from '../utils/auth';

// Types for feedback data
interface Feedback {
  id: number;
  text: string;
  rating: number;
  upvotes: number;
  created_at: string;
  consumer_name: string;
  photos: string[];
}

interface Product {
  product_id: number;
  product_name: string;
  feedback: Feedback[];
  average_rating: number;
  feedback_count: number;
}

interface FeedbackData {
  overall_rating: number;
  total_feedback: number;
  products: Product[];
}

export default function FeedbackOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FeedbackData | null>(null);
  const [error, setError] = useState('');
  const [activeProduct, setActiveProduct] = useState<number | null>(null);
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
      const response = await fetch('http://192.168.1.5:5000/api/business/feedback', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch feedback data');
      }

      setData(result.data);
      
      // Set initial active product to the highest rated one if available
      if (result.data.products && result.data.products.length > 0) {
        setActiveProduct(result.data.products[0].product_id);
      }
    } catch (error: any) {
      console.error('Feedback error:', error);
      setError(error.message || 'An error occurred while fetching feedback data');
      
      // Use mock data for testing when API fails
      const mockData = {
        overall_rating: 4.2,
        total_feedback: 12,
        products: [
          {
            product_id: 1,
            product_name: 'Eco-Friendly Hand Soap',
            feedback: [
              {
                id: 1,
                text: 'Great product, love the natural ingredients!',
                rating: 5,
                upvotes: 3,
                created_at: '2023-08-15T14:30:00Z',
                consumer_name: 'Jane Doe',
                photos: []
              },
              {
                id: 2,
                text: 'Not as foamy as I expected, but still good.',
                rating: 4,
                upvotes: 1,
                created_at: '2023-08-10T09:15:00Z',
                consumer_name: 'John Smith',
                photos: []
              }
            ],
            average_rating: 4.5,
            feedback_count: 2
          },
          {
            product_id: 2,
            product_name: 'Natural Shampoo',
            feedback: [
              {
                id: 3,
                text: 'Leaves my hair feeling clean and healthy',
                rating: 5,
                upvotes: 2,
                created_at: '2023-08-12T10:20:00Z',
                consumer_name: 'Emily Johnson',
                photos: []
              }
            ],
            average_rating: 5.0,
            feedback_count: 1
          }
        ]
      };
      
      setData(mockData);
      if (mockData.products && mockData.products.length > 0) {
        setActiveProduct(mockData.products[0].product_id);
      }
    } finally {
      setLoading(false);
    }
  };

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

  const getActiveProduct = () => {
    if (!data || !data.products || data.products.length === 0) return null;
    return data.products.find(p => p.product_id === activeProduct) || data.products[0];
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

  if (!data || data.products.length === 0) {
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

  const activeProductData = getActiveProduct();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Overall Rating */}
        <View style={styles.overallRatingCard}>
          <Text style={styles.overallRatingTitle}>Overall Customer Satisfaction</Text>
          <View style={styles.overallRatingContent}>
            <Text style={styles.overallRatingValue}>{data.overall_rating.toFixed(1)}</Text>
            <View style={styles.overallRatingDetails}>
              {renderStars(data.overall_rating)}
              <Text style={styles.totalFeedback}>Based on {data.total_feedback} reviews</Text>
            </View>
          </View>
        </View>

        {/* Product Selection */}
        <Text style={styles.sectionTitle}>Your Products</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        >
          {data.products.map((product) => (
            <TouchableOpacity
              key={product.product_id}
              style={[
                styles.productCard,
                activeProduct === product.product_id && styles.activeProductCard
              ]}
              onPress={() => setActiveProduct(product.product_id)}
            >
              <Text 
                style={[
                  styles.productName,
                  activeProduct === product.product_id && styles.activeProductName
                ]}
                numberOfLines={2}
              >
                {product.product_name}
              </Text>
              <View style={styles.productRatingContainer}>
                {renderStars(product.average_rating)}
                <Text style={styles.productFeedbackCount}>
                  ({product.feedback_count})
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feedback for Selected Product */}
        {activeProductData && (
          <View style={styles.feedbackSection}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>
                Customer Feedback for {activeProductData.product_name}
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

            {activeProductData.feedback.length === 0 ? (
              <View style={styles.noFeedbackContainer}>
                <Text style={styles.noFeedbackText}>
                  No feedback for this product yet.
                </Text>
              </View>
            ) : (
              sortFeedback(activeProductData.feedback).map((feedback) => (
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
                  <Text style={styles.feedbackText}>{feedback.text}</Text>
                  
                  {feedback.photos && feedback.photos.length > 0 && (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photosList}
                    >
                      {feedback.photos.map((photo, index) => (
                        <View key={index} style={styles.photoContainer}>
                          <Image 
                            source={{ uri: photo }} 
                            style={styles.photo}
                            resizeMode="cover"
                          />
                        </View>
                      ))}
                    </ScrollView>
                  )}
                  
                  <View style={styles.feedbackFooter}>
                    <Text style={styles.upvotes}>👍 {feedback.upvotes} helpful</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  productsList: {
    paddingVertical: 8,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeProductCard: {
    backgroundColor: '#f39c12',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    height: 40,
  },
  activeProductName: {
    color: '#fff',
  },
  productRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productFeedbackCount: {
    fontSize: 14,
    color: '#888',
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
}); 