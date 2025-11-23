// Activity Owner Validation Utilities

import { ValidationErrors } from '@/types/activity-owner-types';
import { CreateActivityData } from '@/types/activity-types';
import { VALIDATION_RULES, FILE_UPLOAD_LIMITS } from './activity-constants';

/**
 * Validate Business Information (Registration Step 1)
 */
export function validateBusinessInfo(data: {
    businessName?: string;
    businessDescription?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
}): ValidationErrors {
    const errors: ValidationErrors = {};

    // Business Name
    if (!data.businessName || data.businessName.trim().length === 0) {
        errors.businessName = 'Business name is required';
    } else if (data.businessName.length < VALIDATION_RULES.businessName.minLength) {
        errors.businessName = `Business name must be at least ${VALIDATION_RULES.businessName.minLength} characters`;
    } else if (data.businessName.length > VALIDATION_RULES.businessName.maxLength) {
        errors.businessName = `Business name must not exceed ${VALIDATION_RULES.businessName.maxLength} characters`;
    }

    // Business Description
    if (data.businessDescription) {
        if (data.businessDescription.length < VALIDATION_RULES.businessDescription.minLength) {
            errors.businessDescription = `Description must be at least ${VALIDATION_RULES.businessDescription.minLength} characters`;
        } else if (data.businessDescription.length > VALIDATION_RULES.businessDescription.maxLength) {
            errors.businessDescription = `Description must not exceed ${VALIDATION_RULES.businessDescription.maxLength} characters`;
        }
    }

    // Contact Person
    if (!data.contactPerson || data.contactPerson.trim().length === 0) {
        errors.contactPerson = 'Contact person name is required';
    }

    // Email
    if (!data.email || data.email.trim().length === 0) {
        errors.email = 'Email is required';
    } else if (!VALIDATION_RULES.emailPattern.test(data.email)) {
        errors.email = 'Invalid email format';
    }

    // Phone
    if (!data.phone || data.phone.trim().length === 0) {
        errors.phone = 'Phone number is required';
    } else if (!VALIDATION_RULES.phonePattern.test(data.phone)) {
        errors.phone = 'Invalid phone number format (use international format: +7XXXXXXXXXX)';
    }

    return errors;
}

/**
 * Validate Activity Data
 */
export function validateActivityData(data: CreateActivityData): ValidationErrors {
    const errors: ValidationErrors = {};

    // Name
    if (!data.name || data.name.trim().length === 0) {
        errors.name = 'Activity name is required';
    } else if (data.name.length < VALIDATION_RULES.activityName.minLength) {
        errors.name = `Name must be at least ${VALIDATION_RULES.activityName.minLength} characters`;
    } else if (data.name.length > VALIDATION_RULES.activityName.maxLength) {
        errors.name = `Name must not exceed ${VALIDATION_RULES.activityName.maxLength} characters`;
    }

    // Description
    if (!data.description || data.description.trim().length === 0) {
        errors.description = 'Description is required';
    } else if (data.description.length < VALIDATION_RULES.activityDescription.minLength) {
        errors.description = `Description must be at least ${VALIDATION_RULES.activityDescription.minLength} characters`;
    } else if (data.description.length > VALIDATION_RULES.activityDescription.maxLength) {
        errors.description = `Description must not exceed ${VALIDATION_RULES.activityDescription.maxLength} characters`;
    }

    // Short Description
    if (!data.shortDescription || data.shortDescription.trim().length === 0) {
        errors.shortDescription = 'Short description is required';
    } else if (data.shortDescription.length < VALIDATION_RULES.shortDescription.minLength) {
        errors.shortDescription = `Short description must be at least ${VALIDATION_RULES.shortDescription.minLength} characters`;
    } else if (data.shortDescription.length > VALIDATION_RULES.shortDescription.maxLength) {
        errors.shortDescription = `Short description must not exceed ${VALIDATION_RULES.shortDescription.maxLength} characters`;
    }

    // Duration
    if (!data.duration || data.duration <= 0) {
        errors.duration = 'Duration is required';
    } else if (data.duration < VALIDATION_RULES.duration.min) {
        errors.duration = `Duration must be at least ${VALIDATION_RULES.duration.min} minutes`;
    } else if (data.duration > VALIDATION_RULES.duration.max) {
        errors.duration = `Duration cannot exceed ${VALIDATION_RULES.duration.max} minutes`;
    }

    // Participants
    if (!data.minParticipants || data.minParticipants < VALIDATION_RULES.participants.min) {
        errors.minParticipants = 'Minimum participants must be at least 1';
    }
    if (!data.maxParticipants || data.maxParticipants < data.minParticipants) {
        errors.maxParticipants = 'Maximum participants must be greater than minimum';
    }
    if (data.maxParticipants > VALIDATION_RULES.participants.max) {
        errors.maxParticipants = `Maximum participants cannot exceed ${VALIDATION_RULES.participants.max}`;
    }

    // Age Restrictions
    if (data.ageRestrictions) {
        if (data.ageRestrictions.minAge !== undefined && data.ageRestrictions.minAge < 0) {
            errors.minAge = 'Minimum age cannot be negative';
        }
        if (data.ageRestrictions.maxAge !== undefined && data.ageRestrictions.maxAge > VALIDATION_RULES.age.max) {
            errors.maxAge = 'Maximum age is unrealistic';
        }
        if (
            data.ageRestrictions.minAge !== undefined &&
            data.ageRestrictions.maxAge !== undefined &&
            data.ageRestrictions.maxAge < data.ageRestrictions.minAge
        ) {
            errors.maxAge = 'Maximum age must be greater than minimum age';
        }
    }

    // Pricing
    if (!data.pricing || !data.pricing.basePrice) {
        errors.basePrice = 'Base price is required';
    } else if (data.pricing.basePrice < VALIDATION_RULES.price.min) {
        errors.basePrice = 'Price cannot be negative';
    } else if (data.pricing.basePrice > VALIDATION_RULES.price.max) {
        errors.basePrice = 'Price exceeds maximum allowed';
    }

    if (!data.pricing?.currency) {
        errors.currency = 'Currency is required';
    }

    // Safety Notes
    if (!data.safetyNotes || data.safetyNotes.trim().length === 0) {
        errors.safetyNotes = 'Safety notes are required';
    }

    // Cancellation Policy
    if (!data.cancellationPolicy || data.cancellationPolicy.trim().length === 0) {
        errors.cancellationPolicy = 'Cancellation policy is required';
    }

    return errors;
}

/**
 * Validate Photo Files
 */
export function validatePhotos(files: File[]): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!files || files.length === 0) {
        errors.photos = 'At least one photo is required';
        return errors;
    }

    if (files.length > FILE_UPLOAD_LIMITS.maxImagesPerActivity) {
        errors.photos = `Maximum ${FILE_UPLOAD_LIMITS.maxImagesPerActivity} photos allowed`;
        return errors;
    }

    files.forEach((file, index) => {
        // Check file type
        if (!FILE_UPLOAD_LIMITS.allowedImageTypes.includes(file.type)) {
            errors[`photo_${index}`] = `Invalid file type: ${file.type}. Allowed types: JPG, PNG, WebP, HEIC`;
        }

        // Check file size
        if (file.size > FILE_UPLOAD_LIMITS.maxImageSize) {
            const maxSizeMB = FILE_UPLOAD_LIMITS.maxImageSize / (1024 * 1024);
            errors[`photo_${index}`] = `File size exceeds ${maxSizeMB}MB limit`;
        }

        // Check file name length
        if (file.name.length > FILE_UPLOAD_LIMITS.maxFileNameLength) {
            errors[`photo_${index}`] = 'File name too long';
        }
    });

    return errors;
}

/**
 * Validate Pricing Data
 */
export function validatePricing(data: {
    basePrice?: number;
    currency?: string;
    packages?: any[];
    groupDiscounts?: any[];
}): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!data.basePrice || data.basePrice <= 0) {
        errors.basePrice = 'Base price is required and must be positive';
    }

    if (!data.currency) {
        errors.currency = 'Currency is required';
    }

    // Validate pricing packages
    if (data.packages && data.packages.length > 0) {
        data.packages.forEach((pkg, index) => {
            if (!pkg.name || pkg.name.trim().length === 0) {
                errors[`package_${index}_name`] = 'Package name is required';
            }
            if (!pkg.price || pkg.price <= 0) {
                errors[`package_${index}_price`] = 'Package price must be positive';
            }
        });
    }

    // Validate group discounts
    if (data.groupDiscounts && data.groupDiscounts.length > 0) {
        data.groupDiscounts.forEach((discount, index) => {
            if (!discount.minParticipants || discount.minParticipants < 1) {
                errors[`discount_${index}_min`] = 'Minimum participants must be at least 1';
            }
            if (discount.maxParticipants && discount.maxParticipants < discount.minParticipants) {
                errors[`discount_${index}_max`] = 'Maximum must be greater than minimum';
            }
            if (!discount.discountPercentage || discount.discountPercentage < 0 || discount.discountPercentage > 100) {
                errors[`discount_${index}_percentage`] = 'Discount must be between 0 and 100%';
            }
        });
    }

    return errors;
}

/**
 * Validate Document Upload
 */
export function validateDocument(file: File): string | null {
    // Check file type
    if (!FILE_UPLOAD_LIMITS.allowedDocumentTypes.includes(file.type)) {
        return `Invalid file type. Allowed types: PDF, JPG, PNG`;
    }

    // Check file size
    if (file.size > FILE_UPLOAD_LIMITS.maxDocumentSize) {
        const maxSizeMB = FILE_UPLOAD_LIMITS.maxDocumentSize / (1024 * 1024);
        return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file name
    if (file.name.length > FILE_UPLOAD_LIMITS.maxFileNameLength) {
        return 'File name too long';
    }

    return null; // No errors
}

/**
 * Check if form has validation errors
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
    return Object.keys(errors).length > 0;
}

/**
 * Get first error message from validation errors
 */
export function getFirstError(errors: ValidationErrors): string | null {
    const keys = Object.keys(errors);
    return keys.length > 0 ? errors[keys[0]] : null;
}
