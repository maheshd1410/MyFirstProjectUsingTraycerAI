import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createProduct,
  updateProduct,
  selectProducts,
  selectProductLoading,
} from '../../store/product/productSlice';
import { Input, Button } from '../../components';
import { variantService } from '../../services/variant.service';
import { theme } from '../../theme';

interface AdminProductFormScreenProps {
  navigation: any;
  route: any;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Product name is required').min(3, 'Name must be at least 3 characters'),
  price: Yup.number()
    .required('Price is required')
    .positive('Price must be positive'),
  stock: Yup.number()
    .required('Stock is required')
    .min(0, 'Stock cannot be negative'),
  category: Yup.string().required('Category is required'),
  description: Yup.string().required('Description is required'),
});

export const AdminProductFormScreen: React.FC<AdminProductFormScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const loading = useAppSelector(selectProductLoading);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [variants, setVariants] = useState<Array<{
    sku: string;
    name: string;
    price?: string;
    stockQuantity: string;
  }>>([]);

  const productId = route?.params?.productId;
  const existingProduct = productId
    ? products.find((p: any) => p.id === productId)
    : null;

  const initialValues = existingProduct
    ? {
        name: existingProduct.name,
        price: existingProduct.price.toString(),
        stock: existingProduct.stock.toString(),
        category: existingProduct.category,
        description: existingProduct.description || '',
      }
    : {
        name: '',
        price: '',
        stock: '',
        category: '',
        description: '',
      };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera roll permission is required to select images');
      }
    })();
  }, []);

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      const productData = {
        ...values,
        price: parseFloat(values.price),
        stock: parseInt(values.stock, 10),
        image: selectedImage,
      };

      let productId = productId;
      if (productId) {
        dispatch(updateProduct({ id: productId, ...productData }) as any);
      } else {
        const result = await dispatch(createProduct(productData) as any).unwrap();
        productId = result.id;
      }

      // Persist variants after product creation/update
      if (variants.length > 0 && productId) {
        try {
          for (const variant of variants) {
            // Validate variant required fields
            if (!variant.sku || !variant.name || !variant.stockQuantity) {
              Alert.alert('Validation Error', 'All variant SKU, name, and stock quantity are required');
              return;
            }

            await variantService.createVariant({
              productId,
              sku: variant.sku,
              name: variant.name,
              price: variant.price || undefined,
              stockQuantity: parseInt(variant.stockQuantity, 10),
              lowStockThreshold: 5, // Default low stock threshold
              sortOrder: variants.indexOf(variant),
            });
          }
          
          Alert.alert(
            'Success',
            `Product and ${variants.length} variant(s) saved successfully!`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } catch (variantError: any) {
          Alert.alert(
            'Warning',
            `Product saved but failed to save some variants: ${variantError.message}`
          );
          navigation.goBack();
        }
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save product');
    }
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        sku: '',
        name: '',
        price: '',
        stockQuantity: '',
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (
    index: number,
    field: 'sku' | 'name' | 'price' | 'stockQuantity',
    value: string
  ) => {
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: value,
    };
    setVariants(newVariants);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid }) => (
            <>
              {/* Image Selection */}
              <TouchableOpacity style={styles.imagePicker} onPress={handleSelectImage}>
                {selectedImage || existingProduct?.image ? (
                  <View style={styles.imagePreview}>
                    <Text style={styles.imageUrl}>
                      {selectedImage ? 'Image selected' : 'Current image'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="image-outline" size={40} color={theme.colors.primary} />
                    <Text style={styles.imagePickerText}>Select Product Image</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Product Name */}
              <Input
                label="Product Name"
                placeholder="Enter product name"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name ? errors.name : undefined}
                icon="cube-outline"
              />

              {/* Category */}
              <Input
                label="Category"
                placeholder="Enter category"
                value={values.category}
                onChangeText={handleChange('category')}
                onBlur={handleBlur('category')}
                error={touched.category ? errors.category : undefined}
                icon="tag-outline"
              />

              {/* Price */}
              <Input
                label="Price (₹)"
                placeholder="Enter product price"
                value={values.price}
                onChangeText={handleChange('price')}
                onBlur={handleBlur('price')}
                error={touched.price ? errors.price : undefined}
                icon="cash-outline"
                keyboardType="decimal-pad"
              />

              {/* Stock */}
              <Input
                label="Stock Quantity"
                placeholder="Enter stock quantity"
                value={values.stock}
                onChangeText={handleChange('stock')}
                onBlur={handleBlur('stock')}
                error={touched.stock ? errors.stock : undefined}
                icon="layers-outline"
                keyboardType="number-pad"
              />

              {/* Description */}
              <Input
                label="Description"
                placeholder="Enter product description"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                error={touched.description ? errors.description : undefined}
                icon="document-text-outline"
                multiline
                numberOfLines={4}
              />

              {/* Variant Management Section */}
              <View style={styles.variantSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Product Variants (Optional)</Text>
                  <Text style={styles.sectionSubtitle}>Add different sizes, colors, or options</Text>
                </View>

                {variants.map((variant, index) => (
                  <View key={index} style={styles.variantCard}>
                    <View style={styles.variantHeader}>
                      <Text style={styles.variantCardTitle}>Variant {index + 1}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveVariant(index)}
                        style={styles.deleteVariantButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={styles.variantInput}
                      placeholder="SKU (e.g., PROD-L-RED)"
                      value={variant.sku}
                      onChangeText={(value) => handleUpdateVariant(index, 'sku', value)}
                      placeholderTextColor={theme.colors.textLight}
                    />

                    <TextInput
                      style={styles.variantInput}
                      placeholder="Variant Name (e.g., Large - Red)"
                      value={variant.name}
                      onChangeText={(value) => handleUpdateVariant(index, 'name', value)}
                      placeholderTextColor={theme.colors.textLight}
                    />

                    <TextInput
                      style={styles.variantInput}
                      placeholder="Price Override (optional - leave empty to use product price)"
                      value={variant.price}
                      onChangeText={(value) => handleUpdateVariant(index, 'price', value)}
                      keyboardType="decimal-pad"
                      placeholderTextColor={theme.colors.textLight}
                    />

                    <TextInput
                      style={styles.variantInput}
                      placeholder="Stock Quantity"
                      value={variant.stockQuantity}
                      onChangeText={(value) => handleUpdateVariant(index, 'stockQuantity', value)}
                      keyboardType="number-pad"
                      placeholderTextColor={theme.colors.textLight}
                    />
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addVariantButton}
                  onPress={handleAddVariant}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.addVariantButtonText}>Add Variant</Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <View style={styles.buttonContainer}>
                <Button
                  title={loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
                  onPress={handleSubmit as any}
                  disabled={!isValid || loading}
                  icon="checkmark-circle-outline"
                />
              </View>
            </>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  formContainer: {
    padding: theme.spacing.lg,
  },
  imagePicker: {
    backgroundColor: theme.colors.surface,
    borderStyle: 'dashed' as any,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    minHeight: 150,
  },
  imagePreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUrl: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.success,
    marginTop: theme.spacing.md,
  },
  imagePickerText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  buttonContainer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  variantSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionHeader: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  variantCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  variantCardTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  deleteVariantButton: {
    padding: theme.spacing.xs,
  },
  variantInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
  },
  addVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  addVariantButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary,
  },
