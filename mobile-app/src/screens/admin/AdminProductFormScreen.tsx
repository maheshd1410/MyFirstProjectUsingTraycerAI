import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
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

      if (productId) {
        dispatch(updateProduct({ id: productId, ...productData }) as any);
      } else {
        dispatch(createProduct(productData) as any);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    }
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
});
