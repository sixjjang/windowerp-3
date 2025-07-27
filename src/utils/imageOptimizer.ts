// 이미지 최적화 유틸리티 함수들

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export interface OptimizedImageResult {
  blob: Blob;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

/**
 * 이미지 리사이징 및 최적화
 */
export const optimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    format = 'jpeg',
    maintainAspectRatio = true,
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context를 생성할 수 없습니다.'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        // 원본 크기 저장
        const originalWidth = img.width;
        const originalHeight = img.height;
        const originalSize = file.size;

        // 새로운 크기 계산
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        if (maintainAspectRatio) {
          const aspectRatio = originalWidth / originalHeight;
          
          if (newWidth > maxWidth) {
            newWidth = maxWidth;
            newHeight = newWidth / aspectRatio;
          }
          
          if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
          }
        } else {
          newWidth = Math.min(newWidth, maxWidth);
          newHeight = Math.min(newHeight, maxHeight);
        }

        // 캔버스 크기 설정
        canvas.width = newWidth;
        canvas.height = newHeight;

        // 이미지 그리기 (고품질 렌더링)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedSize = blob.size;
              const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

              resolve({
                blob,
                originalSize,
                optimizedSize,
                compressionRatio,
                width: newWidth,
                height: newHeight,
              });
            } else {
              reject(new Error('이미지 최적화에 실패했습니다.'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 이미지 품질 조절 (용량 압축)
 */
export const compressImage = async (
  file: File,
  quality: number = 0.8
): Promise<OptimizedImageResult> => {
  return optimizeImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality,
    maintainAspectRatio: true,
  });
};

/**
 * 썸네일 생성
 */
export const createThumbnail = async (
  file: File,
  size: number = 150
): Promise<OptimizedImageResult> => {
  return optimizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    maintainAspectRatio: true,
  });
};

/**
 * 이미지 메타데이터 추출
 */
export const getImageMetadata = (file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
  lastModified: number;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
    };
    img.onerror = () => {
      reject(new Error('이미지 메타데이터를 추출할 수 없습니다.'));
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 파일 크기 포맷팅
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 이미지 파일 유효성 검사
 */
export const validateImageFile = (file: File): {
  isValid: boolean;
  error?: string;
} => {
  // 파일 타입 검사
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: '이미지 파일만 업로드 가능합니다.',
    };
  }

  // 파일 크기 검사 (10MB 제한)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `파일 크기는 ${formatFileSize(maxSize)}을 초과할 수 없습니다.`,
    };
  }

  // 지원하는 이미지 형식 검사
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 지원)',
    };
  }

  return { isValid: true };
};

/**
 * 이미지 미리보기 URL 생성
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('이미지 미리보기를 생성할 수 없습니다.'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 자동 이미지 최적화 (용량에 따른 자동 조절)
 */
export const autoOptimizeImage = async (
  file: File,
  targetSize: number = 2 * 1024 * 1024 // 2MB
): Promise<OptimizedImageResult> => {
  let quality = 0.9;
  let result: OptimizedImageResult;

  do {
    result = await optimizeImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality,
      maintainAspectRatio: true,
    });

    // 목표 크기보다 작으면 품질을 높임
    if (result.optimizedSize < targetSize && quality < 0.95) {
      quality += 0.05;
    } else {
      break;
    }
  } while (result.optimizedSize > targetSize && quality > 0.1);

  return result;
}; 