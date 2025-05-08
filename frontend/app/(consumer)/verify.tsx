import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/ThemeContext';
import { API_CONFIG } from '../utils/config';

// Product type definition
type Product = {
  id: number;
  product_code: string;
  name: string;
  business_id: number;
  business_name: string;
  category: string;
  description: string;
  certification_status: string;
  certified_date: string;
};

export default function VerifyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [productCode, setProductCode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearchProduct = async () => {
    if (!productCode.trim()) {
      setError('Please enter a product code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSearched(true);
      
      const response = await fetch(`${API_CONFIG.API_URL}/products/verify?code=${productCode}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found. Please check the code and try again.');
        }
        throw new Error('Failed to verify product. Please try again.');
      }
      
      const data = await response.json();
      setProduct(data.product || null);
    } catch (error: any) {
      console.error('Error verifying product:', error);
      setError(error.message || 'Error verifying product. Please try again.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanBarcode = () => {
    router.push('/scan-barcode');
  };

  const renderCertificationBadge = (status: string) => {
    if (status.toLowerCase() === 'certified') {
      return (
        <View style={[styles.certificationBadge, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginRight: 5 }} />
          <Text style={styles.certificationText}>Certified</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.certificationBadge, { backgroundColor: colors.warning }]}>
          <Ionicons name="alert-circle" size={16} color="white" style={{ marginRight: 5 }} />
          <Text style={styles.certificationText}>Not Certified</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>Verify Product</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Check if a product is clean and cruelty-free
            </Text>

            <View style={styles.inputContainer}>
              <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Enter product code"
                  placeholderTextColor={colors.textSecondary}
                  value={productCode}
                  onChangeText={setProductCode}
                  returnKeyType="search"
                  onSubmitEditing={handleSearchProduct}
                />
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: colors.primary }]}
                  onPress={handleSearchProduct}
                >
                  <Ionicons name="search" size={20} color="white" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: colors.primary }]}
                onPress={handleScanBarcode}
              >
                <Ionicons name="barcode-outline" size={20} color="white" style={styles.scanIcon} />
                <Text style={styles.scanButtonText}>Scan Barcode</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Verifying product...
                </Text>
              </View>
            ) : searched && !product && !error ? (
              <View style={styles.notFoundContainer}>
                <Ionicons name="search-outline" size={60} color={colors.textSecondary} />
                <Text style={[styles.notFoundTitle, { color: colors.text }]}>Product Not Found</Text>
                <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
                  We couldn't find this product in our database.
                </Text>
              </View>
            ) : product ? (
              <View style={[styles.productCard, { backgroundColor: colors.surface }]}>
                <View style={styles.productHeader}>
                  <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                  {renderCertificationBadge(product.certification_status)}
                </View>
                
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.productDetailRow}>
                  <Text style={[styles.productDetailLabel, { color: colors.textSecondary }]}>Code:</Text>
                  <Text style={[styles.productDetailValue, { color: colors.text }]}>{product.product_code}</Text>
                </View>
                
                <View style={styles.productDetailRow}>
                  <Text style={[styles.productDetailLabel, { color: colors.textSecondary }]}>Business:</Text>
                  <Text style={[styles.productDetailValue, { color: colors.text }]}>{product.business_name}</Text>
                </View>
                
                <View style={styles.productDetailRow}>
                  <Text style={[styles.productDetailLabel, { color: colors.textSecondary }]}>Category:</Text>
                  <Text style={[styles.productDetailValue, { color: colors.text }]}>{product.category}</Text>
                </View>
                
                <View style={styles.productDescriptionContainer}>
                  <Text style={[styles.productDetailLabel, { color: colors.textSecondary }]}>Description:</Text>
                  <Text style={[styles.productDescription, { color: colors.text }]}>
                    {product.description || 'No description available'}
                  </Text>
                </View>
                
                {product.certification_status.toLowerCase() === 'certified' && (
                  <View style={styles.certificationDateContainer}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.certificationDate, { color: colors.textSecondary }]}>
                      Certified on {new Date(product.certified_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.initialStateContainer}>
                <Ionicons name="barcode-outline" size={60} color={colors.textSecondary} />
                <Text style={[styles.initialStateText, { color: colors.textSecondary }]}>
                  Enter a product code or scan a barcode to verify
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
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
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  scanButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  scanIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  notFoundText: {
    fontSize: 16,
    textAlign: 'center',
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  initialStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  productCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  certificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  productDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productDetailLabel: {
    fontSize: 16,
    width: 80,
    fontWeight: '500',
  },
  productDetailValue: {
    fontSize: 16,
    flex: 1,
  },
  productDescriptionContainer: {
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 16,
    marginTop: 4,
    lineHeight: 22,
  },
  certificationDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  certificationDate: {
    fontSize: 14,
    marginLeft: 8,
  },
});
