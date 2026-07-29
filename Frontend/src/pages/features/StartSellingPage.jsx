import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { useInventoryStore } from '@/store/inventoryStore';
import Footer from '@/pages/modules/Footer';
import { getStartSellingPageClasses } from '@/styles/features/startSellingPageStyles';

const PRODUCT_CATEGORIES = [
  'Art',
  'Music',
  'Electronics',
  'Books',
  'Fashion',
  'Collectibles',
  'Sports',
  'Home Decor',
  'Jewelry',
  'Antiques',
  'Toys & Models',
  'Wine & Spirits',
  'Automobiles & Motorcycles',
  'Archaeology & Fossils',
  'Asian & Tribal Art',
  'Other',
];

const PRODUCT_CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Used'];
const PRODUCT_SIZE_UNITS = ['cm', 'inch', 'metre'];
const PRODUCT_WEIGHT_UNITS = ['g', 'kg'];
const REVIEW_WINDOW_MINUTES = import.meta.env.VITE_REVIEW_WINDOW_MINUTES || 30;

const initialFormData = {
  title: '',
  description: '',
  category: '',
  price: '',
  startOption: 'now',
  startAuctionAt: '',
  auctionDuration: '5',
  auctionDurationUnit: 'minutes',
  size: '',
  sizeUnit: 'cm',
  weight: '',
  weightUnit: 'g',
  color: '',
  brand: '',
  condition: '',
  material: '',
  images: [],
};

const StartSellingPage = () => {
  const MIN_DESCRIPTION_LENGTH = 50;
  const MAX_DESCRIPTION_LENGTH = 1000;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editProductId = searchParams.get('edit');

  const { theme } = useThemeStore();
  const classes = getStartSellingPageClasses(theme);
  const createProduct = useInventoryStore((state) => state.createProduct);
  const updateProduct = useInventoryStore((state) => state.updateProduct);
  const creatingProduct = useInventoryStore((state) => state.creatingProduct);
  const updatingProduct = useInventoryStore((state) => state.updatingProduct);
  const listedItems = useInventoryStore((state) => state.listedItems);
  const fetchListedItems = useInventoryStore((state) => state.fetchListedItems);
  const fetchProductById = useInventoryStore((state) => state.fetchProductById);
  const currentEditingProduct = useInventoryStore((state) => state.currentEditingProduct);
  const existingProduct = currentEditingProduct || listedItems.find((item) => item._id === editProductId);

  const [formData, setFormData] = useState(initialFormData);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageIndexToDelete, setImageIndexToDelete] = useState(null);
  const [originalStartAuctionAt, setOriginalStartAuctionAt] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      return;
    }

    if (formData.images.length + files.length > 2) {
      setErrors((prevErrors) => ({ ...prevErrors, images: 'You can upload a maximum of 2 images.' }));
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      images: [...prevData.images, ...files],
    }));

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);

    if (errors.images) {
      setErrors((prevErrors) => ({ ...prevErrors, images: undefined }));
    }
  };

  const performRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    URL.revokeObjectURL(imagePreviews[index]);

    setFormData((prevData) => ({
      ...prevData,
      images: newImages,
    }));
    setImagePreviews(newPreviews);

    if (!editProductId && newImages.length < 1) {
      setErrors((prevErrors) => ({ ...prevErrors, images: 'Please upload at least one image.' }));
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, images: undefined }));
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    if (!editProductId && formData.images.length <= 1) {
      setImageIndexToDelete(indexToRemove);
      setShowConfirmation(true);
      return;
    }

    performRemoveImage(indexToRemove);
  };

  const handleConfirmRemove = () => {
    if (imageIndexToDelete !== null) {
      performRemoveImage(imageIndexToDelete);
    }
    setShowConfirmation(false);
    setImageIndexToDelete(null);
  };

  const handleCancelRemove = () => {
    setShowConfirmation(false);
    setImageIndexToDelete(null);
  };

  const handleDragStart = (e, index) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedImageIndex !== null && draggedImageIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === targetIndex) {
      setDragOverIndex(null);
      return;
    }

    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];

    const [movedImage] = newImages.splice(draggedImageIndex, 1);
    const [movedPreview] = newPreviews.splice(draggedImageIndex, 1);

    newImages.splice(targetIndex, 0, movedImage);
    newPreviews.splice(targetIndex, 0, movedPreview);

    setFormData((prevData) => ({ ...prevData, images: newImages }));
    setImagePreviews(newPreviews);
    setDraggedImageIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedImageIndex(null);
    setDragOverIndex(null);
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (!editProductId) {
      return;
    }

    if (listedItems.length === 0) {
      fetchListedItems();
    }
    fetchProductById(editProductId).catch((err) => {
      toast.error(err.response?.data?.message || 'Failed to load product for editing.');
      navigate('/listed-items');
    });
  }, [editProductId, listedItems.length, fetchListedItems, fetchProductById, navigate]);

  useEffect(() => {
    if (!editProductId || !existingProduct) {
      return;
    }

    const startTime = existingProduct.startAuctionAt ? new Date(existingProduct.startAuctionAt) : null;
    // If the product is editable, its auction has not started.
    // It should be treated as "scheduled for later" to preserve its start time in the form.
    const isScheduledLater = existingProduct.canEdit;

    const formattedStartTime = isScheduledLater && startTime
        ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : '';

    setFormData({
      title: existingProduct.title || '',
      description: existingProduct.description || '',
      category: existingProduct.category || '',
      price: existingProduct.price?.toString() || '',
      startOption: isScheduledLater ? 'later' : 'now', // If not editable, it's live/ended, so default to 'now' view.
      startAuctionAt: formattedStartTime,
      auctionDuration: existingProduct.auctionDuration?.toString() || '7',
      auctionDurationUnit: existingProduct.auctionDurationUnit || 'days',
      size: existingProduct.size || '',
      sizeUnit: existingProduct.sizeUnit || 'cm',
      weight: existingProduct.weight?.toString() || '',
      weightUnit: existingProduct.weightUnit || 'g',
      color: existingProduct.color || '',
      brand: existingProduct.brand || '',
      condition: existingProduct.condition || '',
      material: existingProduct.material || '',
      images: [],
    });
    setOriginalStartAuctionAt(formattedStartTime);
    setExistingImages(existingProduct.images || []);
    setErrors({});
  }, [editProductId, existingProduct]);

  const resetFormAndPreviews = () => {
    setFormData(initialFormData);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setExistingImages([]);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    if (!formData.category) newErrors.category = 'Category is required.';
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number.';
    }
    if (!/^\d+(\.\d+)?\*\d+(\.\d+)?$/.test(formData.size.trim())) {
      newErrors.size = 'Size must be in a*b format, for example 10*20.';
    }
    if (!formData.sizeUnit) newErrors.sizeUnit = 'Size unit is required.';
    if (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Weight must be a positive number.';
    }
    if (!formData.weightUnit) newErrors.weightUnit = 'Weight unit is required.';
    if (!formData.color.trim()) newErrors.color = 'Color is required.';
    if (!formData.material.trim()) newErrors.material = 'Material is required.';
    if (!formData.condition) newErrors.condition = 'Condition is required.';
    if (formData.startOption === 'later') {
      if (!formData.startAuctionAt) {
        newErrors.startAuctionAt = 'Start time is required when scheduling later.';
      } else {
        // Only validate against 'now' if the user has changed the start time or if it's a new product.
        const isStartTimeChanged = formData.startAuctionAt !== originalStartAuctionAt;
        if (!editProductId || isStartTimeChanged) {
          const scheduledTime = new Date(formData.startAuctionAt).getTime();
          if (scheduledTime <= Date.now()) {
            newErrors.startAuctionAt = 'Scheduled start time must be in the future.';
          }
        }
      }
    }
    const duration = parseInt(formData.auctionDuration, 10);
    if (isNaN(duration) || duration < 1) {
      newErrors.auctionDuration = 'Duration must be a positive number.';
    }
    if (!formData.auctionDurationUnit) {
      newErrors.auctionDurationUnit = 'Unit is required.';
    }
    if (!editProductId && formData.images.length < 1) {
      newErrors.images = 'Please upload at least one image.';
    } else if (formData.images.length > 2) {
      newErrors.images = 'You can upload a maximum of 2 images.';
    }    if (formData.description.length < MIN_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
    }
    if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    setIsLoading(true);
    try {
      const uploadData = new FormData();

      // Determine if the start time was changed by the user.
      const isStartTimeChanged = formData.startAuctionAt !== originalStartAuctionAt;

      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') {
          value.forEach((image) => uploadData.append('images', image));
          return;
        }
        // If startOption is 'now', the backend will calculate startAuctionAt, so no need to send it from frontend
        if (key === 'startAuctionAt' && formData.startOption === 'now') {
          return;
        }
        uploadData.append(key, value);
      });

      if (editProductId) {
        await updateProduct(editProductId, uploadData);
        toast.success('Your item has been updated successfully!');
        setSearchParams({});
        navigate('/listed-items');
      } else {
        await createProduct(uploadData);
        toast.success('Your item has been listed successfully!');
        navigate('/');
      }

      resetFormAndPreviews();
    } catch (err) {
      const backendErrors = err.response?.data?.errors;

      if (Array.isArray(backendErrors)) {
        const nextErrors = {};
        backendErrors.forEach(({ path, msg }) => {
          if (path && !nextErrors[path]) {
            nextErrors[path] = msg;
          }
        });
        setErrors(nextErrors);
      }

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to list item. Please try again.';
      toast.error(errorMessage);
      console.error('Submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <main className={classes.mainContent}>
        <h1 className={classes.title}>{editProductId ? 'Edit Your Item' : 'List Your Item for Auction'}</h1>
        <p className={classes.subtitle}>
          {editProductId ? 'Update your product before the auction begins.' : 'Fill out the details below to start selling on BidBazaar.'}
        </p>

        <form onSubmit={handleSubmit} className={classes.form}>
          <div className={classes.formGroup}>
            <label htmlFor="title" className={classes.label}>Item Title</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className={classes.input} />
            {errors.title && <p className={classes.errorText}>{errors.title}</p>}
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="description" className={classes.label}>Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="5" className={classes.textarea} minLength={MIN_DESCRIPTION_LENGTH} maxLength={MAX_DESCRIPTION_LENGTH}></textarea>
            <p className={classes.characterCounter}>
              {formData.description.length} / {MAX_DESCRIPTION_LENGTH} characters
            </p>
            {formData.description.length < MIN_DESCRIPTION_LENGTH && (
              <p className={classes.errorText}>
                Description must be at least {MIN_DESCRIPTION_LENGTH} characters.
              </p>
            )}
            {errors.description && <p className={classes.errorText}>{errors.description}</p>}
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="category" className={classes.label}>Category</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange} className={classes.select}>
              <option value="">Select a category</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && <p className={classes.errorText}>{errors.category}</p>}
          </div>

          <div className={classes.formRow}>
            <div className={classes.formGroupHalf}>
              <label htmlFor="price" className={classes.label}>Price (Rs)</label>
              <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className={classes.input} step="0.01" min="0.01" />
              {errors.price && <p className={classes.errorText}>{errors.price}</p>}
            </div>
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="startOption" className={classes.label}>Auction Start</label>
            <select id="startOption" name="startOption" value={formData.startOption} onChange={handleChange} className={classes.select}>
              <option value="now">Start now</option>
              <option value="later">Schedule for later</option>
            </select>
          </div>

          {formData.startOption === 'later' && (
            <div className={classes.formGroup}>
              <label htmlFor="startAuctionAt" className={classes.label}>Start Date & Time</label>
              <input
                type="datetime-local"
                id="startAuctionAt"
                name="startAuctionAt"
                value={formData.startAuctionAt}
                onChange={handleChange}
                className={classes.input}
              />
              {errors.startAuctionAt && <p className={classes.errorText}>{errors.startAuctionAt}</p>}
            </div>
          )}

          <div className={classes.formGroup}>
            <label htmlFor="auctionDuration" className={classes.label}>Auction Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="auctionDuration"
                name="auctionDuration"
                value={formData.auctionDuration}
                onChange={handleChange}
                className={classes.input}
                min="1"
                placeholder="e.g., 7"
              />
              <select
                id="auctionDurationUnit"
                name="auctionDurationUnit"
                value={formData.auctionDurationUnit}
                onChange={handleChange}
                className={classes.select}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            {errors.auctionDuration && <p className={classes.errorText}>{errors.auctionDuration}</p>}
            {errors.auctionDurationUnit && <p className={classes.errorText}>{errors.auctionDurationUnit}</p>}
          </div>

          <div className={classes.formRow}>
            <div className={classes.formGroupHalf}>
              <label htmlFor="size" className={classes.label}>Size</label>
              <input type="text" id="size" name="size" value={formData.size} onChange={handleChange} className={classes.input} placeholder="10*20" />
              {errors.size && <p className={classes.errorText}>{errors.size}</p>}
            </div>

            <div className={classes.formGroupHalf}>
              <label htmlFor="sizeUnit" className={classes.label}>Size Unit</label>
              <select id="sizeUnit" name="sizeUnit" value={formData.sizeUnit} onChange={handleChange} className={classes.select}>
                {PRODUCT_SIZE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              {errors.sizeUnit && <p className={classes.errorText}>{errors.sizeUnit}</p>}
            </div>
          </div>

          <div className={classes.formRow}>
            <div className={classes.formGroupHalf}>
              <label htmlFor="weight" className={classes.label}>Weight</label>
              <input type="number" id="weight" name="weight" value={formData.weight} onChange={handleChange} className={classes.input} step="0.01" min="0.01" />
              {errors.weight && <p className={classes.errorText}>{errors.weight}</p>}
            </div>

            <div className={classes.formGroupHalf}>
              <label htmlFor="weightUnit" className={classes.label}>Weight Unit</label>
              <select id="weightUnit" name="weightUnit" value={formData.weightUnit} onChange={handleChange} className={classes.select}>
                {PRODUCT_WEIGHT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              {errors.weightUnit && <p className={classes.errorText}>{errors.weightUnit}</p>}
            </div>
          </div>

          <div className={classes.formRow}>
            <div className={classes.formGroupHalf}>
              <label htmlFor="color" className={classes.label}>Color</label>
              <input type="text" id="color" name="color" value={formData.color} onChange={handleChange} className={classes.input} />
              {errors.color && <p className={classes.errorText}>{errors.color}</p>}
            </div>

            <div className={classes.formGroupHalf}>
              <label htmlFor="brand" className={classes.label}>Brand / Manufacturer (Optional)</label>
              <input type="text" id="brand" name="brand" value={formData.brand} onChange={handleChange} className={classes.input} />
            </div>
          </div>

          <div className={classes.formRow}>
            <div className={classes.formGroupHalf}>
              <label htmlFor="condition" className={classes.label}>Condition</label>
              <select id="condition" name="condition" value={formData.condition} onChange={handleChange} className={classes.select}>
                <option value="">Select condition</option>
                {PRODUCT_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
              {errors.condition && <p className={classes.errorText}>{errors.condition}</p>}
            </div>

            <div className={classes.formGroupHalf}>
              <label htmlFor="material" className={classes.label}>Material</label>
              <input type="text" id="material" name="material" value={formData.material} onChange={handleChange} className={classes.input} />
              {errors.material && <p className={classes.errorText}>{errors.material}</p>}
            </div>
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="images" className={classes.label}>Upload Images (min 1, max 2)</label>
            <input type="file" id="images" name="images" multiple accept="image/*" onChange={handleImageChange} className={classes.fileInput} />
            {errors.images && <p className={classes.errorText}>{errors.images}</p>}
            {editProductId && existingImages.length > 0 && imagePreviews.length === 0 && (
              <div className={classes.imagePreviewContainer}>
                {existingImages.map((image, index) => (
                  <div key={image.id || index} className={classes.imagePreviewWrapper}>
                    <img
                      src={image.url || image.thumbnailUrl}
                      alt={`Current ${index + 1}`}
                      className={classes.imagePreview}
                    />
                  </div>
                ))}
              </div>
            )}
            {editProductId && (
              <p className={classes.characterCounter}>
                Upload new images only if you want to replace the current ones.
              </p>
            )}
            <div className={classes.imagePreviewContainer}>
              {imagePreviews.map((src, index) => (
                <div
                  key={index}
                  className={`${classes.imagePreviewWrapper} ${
                    draggedImageIndex === index ? classes.dragging : ''
                  } ${
                    dragOverIndex === index && draggedImageIndex !== index ? classes.dragOver : ''
                  }`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <img src={src} alt={`Preview ${index + 1}`} className={classes.imagePreview} />
                  <button type="button" onClick={() => handleRemoveImage(index)} className={classes.removeImageButton}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {showConfirmation && (
            <div className={classes.confirmationDialogOverlay}>
              <div className={classes.confirmationDialog}>
                <h3 className={classes.confirmationTitle}>Confirm Image Removal</h3>
                <p className={classes.confirmationMessage}>
                  You need at least one image. Are you sure you want to remove this image?
                </p>
                <div className={classes.confirmationActions}>
                  <button type="button" onClick={handleCancelRemove} className={classes.cancelButton}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleConfirmRemove} className={classes.confirmButton}>
                    Yes, Remove
                  </button>
                </div>
              </div>
            </div>
          )}
          <button type="submit" className={classes.submitButton} disabled={isLoading || creatingProduct || updatingProduct}>
            {isLoading || creatingProduct || updatingProduct
              ? editProductId ? 'Saving Changes...' : 'Listing Item...'
              : editProductId ? 'Save Changes' : 'List Item'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default StartSellingPage;
