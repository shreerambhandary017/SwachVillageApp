import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../utils/config';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthToken } from '../utils/auth';
import * as ImagePicker from 'expo-image-picker';

// Step types
type StepType = 
  | 'business_details'
  | 'owner_details'
  | 'vendor_compliance'
  | 'cleanliness'
  | 'cruelty_free'
  | 'sustainability';

interface CertificationFormData {
  // Step 1: Business Details
  businessName: string;
  registrationNumber: string;
  panCard: string;
  aadhaarCard: string;
  gstNumber: string;
  
  // Step 2: Owner Details
  ownerName: string;
  citizenship: string;
  ownerMobile: string;
  ownerEmail: string;
  ownerPanCard: string;
  ownerAadhaarCard: string;
  
  // Step 3: Vendor Compliance
  vendorCount: number;
  vendorCertified: boolean;
  vendorCertificationNumbers: string;
  
  // Step 4: Cleanliness
  cleanlinessRating: number;
  photos: string[];
  sanitationPractices: boolean;
  wasteManagement: boolean;
  
  // Step 5: Cruelty-Free
  isVegetarian: boolean;
  isVegan: boolean;
  isCrueltyFree: boolean;
  
  // Step 6: Sustainability
  sustainability: string;
}

export default function CertificationScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepType>('business_details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  
  // Full form state
  const [form, setForm] = useState<CertificationFormData>({
    // Step 1: Business Details
    businessName: '',
    registrationNumber: '',
    panCard: '',
    aadhaarCard: '',
    gstNumber: '',
    
    // Step 2: Owner Details
    ownerName: '',
    citizenship: 'Indian',
    ownerMobile: '',
    ownerEmail: '',
    ownerPanCard: '',
    ownerAadhaarCard: '',
    
    // Step 3: Vendor Compliance
    vendorCount: 0,
    vendorCertified: false,
    vendorCertificationNumbers: '',
    
    // Step 4: Cleanliness
    cleanlinessRating: 3,
    photos: [],
    sanitationPractices: false,
    wasteManagement: false,
    
    // Step 5: Cruelty-Free
    isVegetarian: false,
    isVegan: false,
    isCrueltyFree: false,
    
    // Step 6: Sustainability
    sustainability: '',
  });

  // Load existing certification data if available
  useEffect(() => {
    async function loadCertificationData() {
      try {
        const token = await getAuthToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await fetch(`${API_CONFIG.API_URL}/business/certification`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.certification) {
            // Map API data to form state
            setForm({
              // Business Details
              businessName: data.certification.business_name || '',
              registrationNumber: data.certification.registration_number || '',
              panCard: data.certification.pan_card || '',
              aadhaarCard: data.certification.aadhaar_card || '',
              gstNumber: data.certification.gst_number || '',
              
              // Owner Details
              ownerName: data.certification.owner_name || '',
              citizenship: data.certification.citizenship || 'Indian',
              ownerMobile: data.certification.owner_mobile || '',
              ownerEmail: data.certification.owner_email || '',
              ownerPanCard: data.certification.pan_card_owner || '',
              ownerAadhaarCard: data.certification.aadhaar_card_owner || '',
              
              // Vendor Compliance
              vendorCount: data.certification.vendor_count || 0,
              vendorCertified: !!data.certification.vendor_certification,
              vendorCertificationNumbers: data.certification.vendor_certification || '',
              
              // Cleanliness
              cleanlinessRating: data.certification.cleanliness_rating || 3,
              photos: data.certification.photos ? JSON.parse(data.certification.photos) : [],
              sanitationPractices: !!data.certification.sanitation_practices,
              wasteManagement: !!data.certification.waste_management,
              
              // Cruelty-Free
              isVegetarian: !!data.certification.is_vegetarian,
              isVegan: !!data.certification.is_vegan,
              isCrueltyFree: !!data.certification.cruelty_free,
              
              // Sustainability
              sustainability: data.certification.sustainability || '',
            });
          }
        }
      } catch (error) {
        console.log('Error loading certification data:', error);
      } finally {
        setLoadingInitialData(false);
      }
    }
    
    loadCertificationData();
  }, []);

  const updateField = (field: keyof CertificationFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Step Navigation
  const nextStep = () => {
    if (currentStep === 'business_details') setCurrentStep('owner_details');
    else if (currentStep === 'owner_details') setCurrentStep('vendor_compliance');
    else if (currentStep === 'vendor_compliance') setCurrentStep('cleanliness');
    else if (currentStep === 'cleanliness') setCurrentStep('cruelty_free');
    else if (currentStep === 'cruelty_free') setCurrentStep('sustainability');
  };

  const prevStep = () => {
    if (currentStep === 'owner_details') setCurrentStep('business_details');
    else if (currentStep === 'vendor_compliance') setCurrentStep('owner_details');
    else if (currentStep === 'cleanliness') setCurrentStep('vendor_compliance');
    else if (currentStep === 'cruelty_free') setCurrentStep('cleanliness');
    else if (currentStep === 'sustainability') setCurrentStep('cruelty_free');
  };

  // Image picker
  const pickImage = async () => {
    // Request permission
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
      // Add new photo to array
      updateField('photos', [...form.photos, result.assets[0].uri]);
    }
  };

  // Form Validation for each step
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 'business_details':
        if (!form.businessName) {
          setError('Business name is required');
          return false;
        }
        if (!form.registrationNumber && !form.panCard && !form.gstNumber) {
          setError('At least one business identification document is required');
          return false;
        }
        break;
      
      case 'owner_details':
        if (!form.ownerName) {
          setError('Owner name is required');
          return false;
        }
        if (!form.ownerMobile) {
          setError('Owner mobile number is required');
          return false;
        }
        if (!form.ownerEmail) {
          setError('Owner email is required');
          return false;
        }
        if (!form.citizenship) {
          setError('Citizenship is required');
          return false;
        }
        break;
      
      case 'vendor_compliance':
        // Even though this step can be skipped, validate if they choose to save
        if (form.vendorCertified && !form.vendorCertificationNumbers) {
          setError('Vendor certification numbers are required if vendors are certified');
          return false;
        }
        if (form.vendorCount < 0) {
          setError('Vendor count cannot be negative');
          return false;
        }
        break;
      
      case 'cleanliness':
        // Require at least a cleanliness rating if they choose to save
        if (!form.cleanlinessRating || form.cleanlinessRating < 1 || form.cleanlinessRating > 5) {
          setError('Please provide a cleanliness rating between 1 and 5');
          return false;
        }
        break;
      
      case 'cruelty_free':
        // At least one field must be selected if they choose to save
        if (!form.isVegetarian && !form.isVegan && !form.isCrueltyFree) {
          setError('Please select at least one option');
          return false;
        }
        break;
      
      case 'sustainability':
        if (!form.sustainability || form.sustainability.trim() === '') {
          setError('Please provide information about your sustainability practices');
          return false;
        }
        break;
    }
    
    return true;
  };

  // Strict validation for each step that requires all fields to be filled
  const validateStepCompleteness = () => {
    switch (currentStep) {
      case 'business_details':
        if (!form.businessName || form.businessName.trim() === '') {
          setError('Business name is required');
          return false;
        }
        if (!form.registrationNumber && !form.panCard && !form.gstNumber) {
          setError('At least one business identification document is required');
          return false;
        }
        // Check that each field that has been started is also completed
        if (form.registrationNumber && form.registrationNumber.trim() === '') {
          setError('Registration number cannot be empty if provided');
          return false;
        }
        if (form.panCard && form.panCard.trim() === '') {
          setError('PAN card number cannot be empty if provided');
          return false;
        }
        if (form.aadhaarCard && form.aadhaarCard.trim() === '') {
          setError('Aadhaar card number cannot be empty if provided');
          return false;
        }
        if (form.gstNumber && form.gstNumber.trim() === '') {
          setError('GST number cannot be empty if provided');
          return false;
        }
        break;
      
      case 'owner_details':
        if (!form.ownerName || form.ownerName.trim() === '') {
          setError('Owner name is required');
          return false;
        }
        if (!form.ownerMobile || form.ownerMobile.trim() === '') {
          setError('Owner mobile number is required');
          return false;
        }
        if (!form.ownerEmail || form.ownerEmail.trim() === '') {
          setError('Owner email is required');
          return false;
        }
        if (!form.citizenship || form.citizenship.trim() === '') {
          setError('Citizenship is required');
          return false;
        }
        // Additional validations for optional fields if they've been started
        if (form.ownerPanCard && form.ownerPanCard.trim() === '') {
          setError('Owner PAN card number cannot be empty if provided');
          return false;
        }
        if (form.ownerAadhaarCard && form.ownerAadhaarCard.trim() === '') {
          setError('Owner Aadhaar card number cannot be empty if provided');
          return false;
        }
        break;
      
      case 'vendor_compliance':
        // Vendor count must be valid
        if (form.vendorCount < 0) {
          setError('Vendor count cannot be negative');
          return false;
        }
        // If vendor certified is checked, certification numbers must be provided
        if (form.vendorCertified && (!form.vendorCertificationNumbers || form.vendorCertificationNumbers.trim() === '')) {
          setError('Vendor certification numbers are required if vendors are certified');
          return false;
        }
        break;
      
      case 'cleanliness':
        // Cleanliness rating is required
        if (!form.cleanlinessRating || form.cleanlinessRating < 1 || form.cleanlinessRating > 5) {
          setError('Please provide a cleanliness rating between 1 and 5');
          return false;
        }
        // If photos are added, there should be at least one
        if (form.photos.length === 0) {
          setError('Please upload at least one photo of your facility');
          return false;
        }
        break;
      
      case 'cruelty_free':
        // At least one option must be selected
        if (!form.isVegetarian && !form.isVegan && !form.isCrueltyFree) {
          setError('Please select at least one option');
          return false;
        }
        break;
      
      case 'sustainability':
        // Sustainability text is required and must be meaningful
        if (!form.sustainability || form.sustainability.trim() === '') {
          setError('Please provide information about your sustainability practices');
          return false;
        }
        if (form.sustainability.trim().length < 50) {
          setError('Please provide more detailed information about your sustainability practices (at least 50 characters)');
          return false;
        }
        break;
    }
    
    return true;
  };
  
  // Save current step data
  const saveCurrentStep = async () => {
    // Use the stricter validation function for Save & Continue
    if (!validateStepCompleteness()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Prepare data based on current step
      let apiData = {};
      
      switch (currentStep) {
        case 'business_details':
          apiData = {
            business_name: form.businessName,
            registration_number: form.registrationNumber,
            pan_card: form.panCard,
            aadhaar_card: form.aadhaarCard,
            gst_number: form.gstNumber,
          };
          break;
        
        case 'owner_details':
          apiData = {
            owner_name: form.ownerName,
            citizenship: form.citizenship,
            owner_mobile: form.ownerMobile,
            owner_email: form.ownerEmail,
            pan_card_owner: form.ownerPanCard,
            aadhaar_card_owner: form.ownerAadhaarCard,
          };
          break;
        
        case 'vendor_compliance':
          apiData = {
            vendor_count: form.vendorCount,
            vendor_certification: form.vendorCertified ? form.vendorCertificationNumbers : null
          };
          break;
        
        case 'cleanliness':
          apiData = {
            cleanliness_rating: form.cleanlinessRating,
            photos: JSON.stringify(form.photos),
            sanitation_practices: form.sanitationPractices,
            waste_management: form.wasteManagement,
          };
          break;
        
        case 'cruelty_free':
          apiData = {
            is_vegetarian: form.isVegetarian,
            is_vegan: form.isVegan,
            cruelty_free: form.isCrueltyFree,
          };
          break;
        
        case 'sustainability':
          apiData = {
            sustainability: form.sustainability,
          };
          break;
      }
      
      // Send data to backend
      const response = await fetch(`${API_CONFIG.API_URL}/business/certification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          step: currentStep,
          ...apiData
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save data');
      }
      
      // If we're on the final step, show success message
      if (currentStep === 'sustainability') {
        Alert.alert(
          'Certification Submitted',
          'Your business certification has been submitted for review.',
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(business)') 
            }
          ]
        );
      } else {
        // Move to next step
        nextStep();
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while saving data');
    } finally {
      setLoading(false);
    }
  };
  
  // Skip the current step
  const skipStep = () => {
    if (currentStep === 'business_details' || currentStep === 'owner_details') {
      // Business and owner details are mandatory
      setError('This section cannot be skipped.');
      return;
    }
    
    nextStep();
  };
  
  // Save progress and go to dashboard
  const saveAndGoHome = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Save current progress first
      if (currentStep === 'business_details' || currentStep === 'owner_details') {
        // For mandatory steps, validate before saving
        if (!validateCurrentStep()) {
          setLoading(false);
          return;
        }
        
        // Try to save current step
        await saveCurrentStep();
      }
      
      // Navigate to dashboard
      router.replace('/(business)/dashboard');
    } catch (error) {
      console.error('Error saving progress:', error);
      setError('Failed to save progress. Please try again.');
      setLoading(false);
    }
  };

  // Final submission
  const finalSubmit = async () => {
    if (!form.sustainability.trim()) {
      setError('Please enter sustainability information');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_CONFIG.API_URL}/business/certification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sustainability: form.sustainability,
          final_submission: true
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit certification');
      }
      
      Alert.alert(
        'Certification Submitted',
        data.audit_required 
          ? 'Your business certification has been submitted for review. An audit may be required.'
          : 'Your business certification has been submitted for review.',
        [
          { 
            text: 'OK', 
            onPress: () => router.push('/(business)') 
          }
        ]
      );
    } catch (error: any) {
      setError(error.message || 'An error occurred during submission');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      'business_details',
      'owner_details',
      'vendor_compliance',
      'cleanliness',
      'cruelty_free',
      'sustainability'
    ];
    
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View 
              style={[
                styles.stepDot, 
                index <= currentIndex ? styles.activeStepDot : {}
              ]} 
            />
            {index < steps.length - 1 && (
              <View 
                style={[
                  styles.stepLine, 
                  index < currentIndex ? styles.activeStepLine : {}
                ]} 
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // Form step renders
  const renderBusinessDetailsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Business Details</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Business Name*</Text>
        <TextInput
          style={styles.input}
          value={form.businessName}
          onChangeText={(value) => updateField('businessName', value)}
          placeholder="Enter your business name"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Business Registration Number</Text>
        <TextInput
          style={styles.input}
          value={form.registrationNumber}
          onChangeText={(value) => updateField('registrationNumber', value)}
          placeholder="Enter registration number"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>PAN Card</Text>
        <TextInput
          style={styles.input}
          value={form.panCard}
          onChangeText={(value) => updateField('panCard', value)}
          placeholder="Enter PAN card number"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Aadhaar Card</Text>
        <TextInput
          style={styles.input}
          value={form.aadhaarCard}
          onChangeText={(value) => updateField('aadhaarCard', value)}
          placeholder="Enter Aadhaar card number"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>GST Number</Text>
        <TextInput
          style={styles.input}
          value={form.gstNumber}
          onChangeText={(value) => updateField('gstNumber', value)}
          placeholder="Enter GST number"
        />
      </View>
    </View>
  );
  
  const renderOwnerDetailsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Owner Details</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Owner Name*</Text>
        <TextInput
          style={styles.input}
          value={form.ownerName}
          onChangeText={(value) => updateField('ownerName', value)}
          placeholder="Enter owner's name"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Citizenship</Text>
        <TextInput
          style={styles.input}
          value={form.citizenship}
          onChangeText={(value) => updateField('citizenship', value)}
          placeholder="Enter your citizenship"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          value={form.ownerMobile}
          onChangeText={(value) => updateField('ownerMobile', value)}
          placeholder="Enter owner's mobile number"
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={form.ownerEmail}
          onChangeText={(value) => updateField('ownerEmail', value)}
          placeholder="Enter owner's email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Owner's PAN Card</Text>
        <TextInput
          style={styles.input}
          value={form.ownerPanCard}
          onChangeText={(value) => updateField('ownerPanCard', value)}
          placeholder="Enter owner's PAN card number"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Owner's Aadhaar Card</Text>
        <TextInput
          style={styles.input}
          value={form.ownerAadhaarCard}
          onChangeText={(value) => updateField('ownerAadhaarCard', value)}
          placeholder="Enter owner's Aadhaar card number"
        />
      </View>
    </View>
  );
  
  const renderVendorComplianceStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vendor Compliance</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Number of Vendors</Text>
        <TextInput
          style={styles.input}
          value={form.vendorCount.toString()}
          onChangeText={(value) => updateField('vendorCount', parseInt(value) || 0)}
          placeholder="Enter number of vendors"
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Vendors are Certified</Text>
        <Switch
          value={form.vendorCertified}
          onValueChange={(value) => updateField('vendorCertified', value)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={form.vendorCertified ? '#3498db' : '#f4f3f4'}
        />
      </View>
      
      {form.vendorCertified && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Vendor Certification Numbers</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.vendorCertificationNumbers}
            onChangeText={(value) => updateField('vendorCertificationNumbers', value)}
            placeholder="Enter certification numbers (one per line)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      )}
    </View>
  );
  
  const renderCleanlinessStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Cleanliness & Sanitation</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cleanliness Rating (1-5)</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                form.cleanlinessRating === rating && styles.activeRatingButton
              ]}
              onPress={() => updateField('cleanlinessRating', rating)}
            >
              <Text 
                style={[
                  styles.ratingText,
                  form.cleanlinessRating === rating && styles.activeRatingText
                ]}
              >
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.photoSection}>
        <Text style={styles.label}>Upload Photos of Facility</Text>
        <TouchableOpacity 
          style={styles.photoUploadButton}
          onPress={pickImage}
        >
          <Text style={styles.photoUploadText}>+ Add Photo</Text>
        </TouchableOpacity>
        
        {form.photos.length > 0 && (
          <View style={styles.photoPreviewContainer}>
            {form.photos.map((photo, index) => (
              <View key={index} style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => {
                    const updatedPhotos = [...form.photos];
                    updatedPhotos.splice(index, 1);
                    updateField('photos', updatedPhotos);
                  }}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Regular Sanitation Practices</Text>
        <Switch
          value={form.sanitationPractices}
          onValueChange={(value) => updateField('sanitationPractices', value)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={form.sanitationPractices ? '#3498db' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Proper Waste Management</Text>
        <Switch
          value={form.wasteManagement}
          onValueChange={(value) => updateField('wasteManagement', value)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={form.wasteManagement ? '#3498db' : '#f4f3f4'}
        />
      </View>
    </View>
  );
  
  const renderCrueltyFreeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Cruelty-Free Assessment</Text>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Vegetarian Business</Text>
        <Switch
          value={form.isVegetarian}
          onValueChange={(value) => updateField('isVegetarian', value)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={form.isVegetarian ? '#3498db' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Vegan Business</Text>
        <Switch
          value={form.isVegan}
          onValueChange={(value) => updateField('isVegan', value)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={form.isVegan ? '#3498db' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Cruelty-Free Business</Text>
        <Switch
          value={form.isCrueltyFree}
          onValueChange={(value) => updateField('isCrueltyFree', value)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={form.isCrueltyFree ? '#3498db' : '#f4f3f4'}
        />
      </View>
    </View>
  );
  
  const renderSustainabilityStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Sustainability Practices</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Describe Your Sustainability Practices</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.sustainability}
          onChangeText={(value) => updateField('sustainability', value)}
          placeholder="Describe how your business practices sustainability (recycling, energy efficiency, green initiatives, etc.)"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'business_details':
        return renderBusinessDetailsStep();
      case 'owner_details':
        return renderOwnerDetailsStep();
      case 'vendor_compliance':
        return renderVendorComplianceStep();
      case 'cleanliness':
        return renderCleanlinessStep();
      case 'cruelty_free':
        return renderCrueltyFreeStep();
      case 'sustainability':
        return renderSustainabilityStep();
    }
  };

  // Loading state
  if (loadingInitialData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading certification data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Business Certification</Text>
            <Text style={styles.subtitle}>
              Step {currentStep === 'business_details' ? '1' : 
                  currentStep === 'owner_details' ? '2' : 
                  currentStep === 'vendor_compliance' ? '3' : 
                  currentStep === 'cleanliness' ? '4' : 
                  currentStep === 'cruelty_free' ? '5' : '6'} of 6
            </Text>
          </View>

          {renderStepIndicator()}
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          {renderCurrentStep()}
          
          <View style={styles.navigationButtons}>
            {currentStep !== 'business_details' && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={prevStep}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            {/* Skip button for non-mandatory steps */}
            {(currentStep !== 'business_details' && currentStep !== 'owner_details') && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={skipStep}
                disabled={loading}
              >
                <Text style={styles.skipButtonText}>Skip This Step</Text>
              </TouchableOpacity>
            )}
            
            {currentStep === 'sustainability' ? (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={finalSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>Submit Certification</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={saveCurrentStep}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>Save & Continue</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Skip and go to home button */}
          <TouchableOpacity
            style={styles.skipToHomeButton}
            onPress={saveAndGoHome}
            disabled={loading}
          >
            <Text style={styles.skipToHomeButtonText}>Skip and go to home</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  activeStepDot: {
    backgroundColor: '#3498db',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeStepLine: {
    backgroundColor: '#3498db',
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeRatingButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  activeRatingText: {
    color: '#fff',
  },
  photoSection: {
    marginBottom: 20,
  },
  photoUploadButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  photoUploadText: {
    color: '#666',
    fontSize: 16,
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  photoPreview: {
    width: 100,
    height: 100,
    margin: 5,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f1c40f',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginRight: 8,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
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
  skipToHomeButton: {
    backgroundColor: '#f0ad4e',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#eea236',
  },
  skipToHomeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
});