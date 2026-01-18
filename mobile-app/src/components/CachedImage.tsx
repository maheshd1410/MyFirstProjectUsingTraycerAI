import React, { useState } from 'react';
import {
  Image,
  ImageProps,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme';

interface CachedImageProps extends ImageProps {
  fallbackSource?: ImageProps['source'];
  showLoadingIndicator?: boolean;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  fallbackSource,
  showLoadingIndicator = true,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  // If error and fallback source provided, use fallback
  if (error && fallbackSource) {
    return (
      <Image
        {...props}
        source={fallbackSource}
        style={style}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        {...props}
        style={[styles.image, style]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        // React Native automatically caches images
        cache="force-cache"
      />
      
      {loading && showLoadingIndicator && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      
      {error && !fallbackSource && (
        <View style={[styles.errorContainer, style]}>
          <View style={styles.errorContent}>
            <Text style={styles.errorIcon}>📷</Text>
            <Text style={styles.errorText}>Image not available</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.backgroundSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
