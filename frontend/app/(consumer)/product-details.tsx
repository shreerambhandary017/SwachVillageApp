import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../utils/config';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAuthToken } from '../utils/auth';
import * as ImagePicker from 'expo-image-picker';

interface Feedback {
  id: number;
  user_name: string;
  feedback_text: string;
  rating: number;
  upvotes: number;
  created_at: string;
  photos?: string[];
}

interface BusinessDetails {
  id: number;
  business_name: string;
  certification_status: string;
  cleanliness_rating: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  cruelty_free: boolean;
  photos: string[];
  feedback: Feedback[];
  average_rating: number;
}

export default function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { productCode, businessId } = params;
  
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [error, setError] = useState('');
  
  // Feedback form state
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackPhotos, setFeedbackPhotos] = useState<string[]>([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  useEffect(() => {
    fetchBusinessDetails();
  }, []);
  
  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_CONFIG.API_URL}/products/details?product_code=${productCode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch business details');
      }
      
      setBusiness(data.business);
    } catch (error: any) {
      setError(error.message || 'An error occurred while fetching business details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpvote = async (feedbackId: number) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_CONFIG.API_URL}/feedback/upvote/${feedbackId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upvote feedback');
      }
      
      // Refresh business details to show updated upvote count
      fetchBusinessDetails();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upvote feedback');
    }
  };
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFeedbackPhotos([...feedbackPhotos, result.assets[0].uri]);
    }
  };
  
  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter feedback text');
      return;
    }
    
    if (selectedRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    
    try {
      setSubmittingFeedback(true);
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const feedbackData = {
        product_code: productCode,
        business_id: businessId,
        feedback_text: feedbackText,
        rating: selectedRating,
        photos: JSON.stringify(feedbackPhotos)
      };
      
      const response = await fetch(`${API_CONFIG.API_URL}/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(feedbackData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }
      
      // Reset form
      setFeedbackText('');
      setSelectedRating(0);
      setFeedbackPhotos([]);
      
      // Refresh business details to show new feedback
      fetchBusinessDetails();
      
      Alert.alert('Success', 'Your feedback has been submitted');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading business details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Product Not Found</Text>
          <Text style={styles.errorText}>
            We couldn't find any business associated with this product.
          </Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{business.business_name}</Text>
          <View style={[
            styles.certificationBadge,
            business.certification_status === 'approved' 
              ? styles.approvedBadge 
              : styles.pendingBadge
          ]}>
            <Text style={styles.certificationText}>
              {business.certification_status === 'approved' 
                ? 'Certified Clean & Cruelty-Free' 
                : 'Certification Pending'}
            </Text>
          </View>
        </View>
        
        <View style={styles.productSection}>
          <Text style={styles.sectionTitle}>Product Code</Text>
          <Text style={styles.productCode}>{productCode}</Text>
        </View>
        
        <View style={styles.certificationSection}>
          <Text style={styles.sectionTitle}>Certification Details</Text>
          
          <View style={styles.certificationItem}>
            <Text style={styles.certificationLabel}>Cleanliness Rating:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <View
                  key={rating}
                  style={[
                    styles.ratingCircle,
                    business.cleanliness_rating >= rating && styles.filledRating
                  ]}
                />
              ))}
              <Text style={styles.ratingText}>{business.cleanliness_rating}/5</Text>
            </View>
          </View>
          
          <View style={styles.certificationItem}>
            <Text style={styles.certificationLabel}>Vegetarian:</Text>
            <Text style={[
              styles.certificationValue,
              business.is_vegetarian ? styles.positiveValue : styles.negativeValue
            ]}>
              {business.is_vegetarian ? 'Yes' : 'No'}
            </Text>
          </View>
          
          <View style={styles.certificationItem}>
            <Text style={styles.certificationLabel}>Vegan:</Text>
            <Text style={[
              styles.certificationValue,
              business.is_vegan ? styles.positiveValue : styles.negativeValue
            ]}>
              {business.is_vegan ? 'Yes' : 'No'}
            </Text>
          </View>
          
          <View style={styles.certificationItem}>
            <Text style={styles.certificationLabel}>Cruelty-Free:</Text>
            <Text style={[
              styles.certificationValue,
              business.cruelty_free ? styles.positiveValue : styles.negativeValue
            ]}>
              {business.cruelty_free ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
        
        {business.photos && business.photos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>Business Photos</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosList}
            >
              {business.photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image 
                    source={{ uri: photo }} 
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        <View style={styles.feedbackSection}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.sectionTitle}>User Feedback</Text>
            <View style={styles.averageRating}>
              <Text style={styles.averageRatingValue}>{business.average_rating.toFixed(1)}</Text>
              <Text style={styles.averageRatingLabel}>/5</Text>
            </View>
          </View>
          
          {business.feedback && business.feedback.length > 0 ? (
            <View>
              {business.feedback.map((item) => (
                <View key={item.id} style={styles.feedbackItem}>
                  <View style={styles.feedbackTop}>
                    <Text style={styles.feedbackUser}>{item.user_name}</Text>
                    <View style={styles.feedbackRating}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <View
                          key={rating}
                          style={[
                            styles.smallRatingCircle,
                            item.rating >= rating && styles.filledRating
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  
                  <Text style={styles.feedbackText}>{item.feedback_text}</Text>
                  
                  {item.photos && item.photos.length > 0 && (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.feedbackPhotosList}
                    >
                      {item.photos.map((photo, index) => (
                        <Image 
                          key={index}
                          source={{ uri: photo }} 
                          style={styles.feedbackPhoto}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  )}
                  
                  <View style={styles.feedbackFooter}>
                    <Text style={styles.feedbackDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.upvoteButton}
                      onPress={() => handleUpvote(item.id)}
                    >
                      <Text style={styles.upvoteText}>👍 {item.upvotes}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyFeedback}>
              <Text style={styles.emptyFeedbackText}>No feedback yet</Text>
            </View>
          )}
        </View>
        
        <View style={styles.addFeedbackSection}>
          <Text style={styles.sectionTitle}>Add Your Feedback</Text>
          
          <View style={styles.ratingSelector}>
            <Text style={styles.ratingLabel}>Your Rating:</Text>
            <View style={styles.ratingButtons}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    selectedRating === rating && styles.selectedRatingButton
                  ]}
                  onPress={() => setSelectedRating(rating)}
                >
                  <Text 
                    style={[
                      styles.ratingButtonText,
                      selectedRating === rating && styles.selectedRatingButtonText
                    ]}
                  >
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.feedbackInputContainer}>
            <TextInput
              style={styles.feedbackInput}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Enter your feedback about this business..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.photoUploadSection}>
            <TouchableOpacity 
              style={styles.photoUploadButton}
              onPress={pickImage}
            >
              <Text style={styles.photoUploadText}>+ Add Photo</Text>
            </TouchableOpacity>
            
            {feedbackPhotos.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoPreviewContainer}
              >
                {feedbackPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoPreview}>
                    <Image source={{ uri: photo }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={() => {
                        const updatedPhotos = [...feedbackPhotos];
                        updatedPhotos.splice(index, 1);
                        setFeedbackPhotos(updatedPhotos);
                      }}
                    >
                      <Text style={styles.removePhotoText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={submitFeedback}
            disabled={submittingFeedback}
          >
            {submittingFeedback ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Scanner</Text>
        </TouchableOpacity>
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
  errorButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  certificationBadge: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  approvedBadge: {
    backgroundColor: '#27ae60',
  },
  pendingBadge: {
    backgroundColor: '#f39c12',
  },
  certificationText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  productSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  productCode: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  certificationSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  certificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  certificationLabel: {
    fontSize: 16,
    color: '#555',
  },
  certificationValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  positiveValue: {
    color: '#27ae60',
  },
  negativeValue: {
    color: '#e74c3c',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filledRating: {
    backgroundColor: '#f39c12',
    borderColor: '#f39c12',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 4,
  },
  photosSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  photosList: {
    paddingVertical: 10,
  },
  photoContainer: {
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  photo: {
    width: 150,
    height: 100,
  },
  feedbackSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  averageRatingValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  averageRatingLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 2,
  },
  emptyFeedback: {
    padding: 20,
    alignItems: 'center',
  },
  emptyFeedbackText: {
    fontSize: 16,
    color: '#999',
  },
  feedbackItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  feedbackTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feedbackRating: {
    flexDirection: 'row',
  },
  smallRatingCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginRight: 3,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  feedbackText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 10,
    lineHeight: 20,
  },
  feedbackPhotosList: {
    marginVertical: 8,
  },
  feedbackPhoto: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 8,
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  feedbackDate: {
    fontSize: 13,
    color: '#888',
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  upvoteText: {
    fontSize: 14,
    color: '#555',
  },
  addFeedbackSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ratingSelector: {
    marginBottom: 15,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  ratingButtons: {
    flexDirection: 'row',
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedRatingButton: {
    backgroundColor: '#f39c12',
    borderColor: '#f39c12',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  selectedRatingButtonText: {
    color: '#fff',
  },
  feedbackInputContainer: {
    marginBottom: 15,
  },
  feedbackInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoUploadSection: {
    marginBottom: 15,
  },
  photoUploadButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  photoUploadText: {
    color: '#555',
    fontSize: 16,
  },
  photoPreviewContainer: {
    marginTop: 10,
  },
  photoPreview: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 4,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#95a5a6',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 