/**
 * validation.js - JSON-Driven Reusable Validation System
 * Reads rules and messages dynamically from FORM_CONFIG without hardcoded checks.
 */

const ValidationEngine = {
  /**
   * Calculates age based on Date of Birth string (YYYY-MM-DD)
   * @param {string} dobString 
   * @returns {number|null} Calculated age or null
   */
  calculateAge(dobString) {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  },

  /**
   * Shows error message next to field and marks it with invalid CSS class
   * @param {string} fieldId Field identifier
   * @param {string} message Error message
   */
  showError(fieldId, message) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(fieldId);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }

    if (inputEl) {
      inputEl.classList.add('is-invalid');
      inputEl.classList.remove('is-valid');
    }

    // Special containers (radio & checkbox groups)
    if (fieldId === 'gender') {
      const group = document.getElementById('group-gender');
      if (group) group.classList.add('has-error');
    }
    if (fieldId === 'skills' || fieldId === 'hobbies') {
      const group = document.getElementById(`group-${fieldId}`);
      if (group) group.classList.add('has-error');
    }
    if (fieldId === 'photo') {
      const dropZone = document.getElementById('photoDropZone');
      if (dropZone) dropZone.classList.add('is-invalid');
    }
  },

  /**
   * Clears error and marks field valid if it has content
   * @param {string} fieldId Field identifier
   */
  clearError(fieldId) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(fieldId);

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }

    if (inputEl) {
      inputEl.classList.remove('is-invalid');
      if (inputEl.value && String(inputEl.value).trim() !== '') {
        inputEl.classList.add('is-valid');
      } else {
        inputEl.classList.remove('is-valid');
      }
    }

    // Special containers
    if (fieldId === 'gender') {
      const group = document.getElementById('group-gender');
      if (group) group.classList.remove('has-error');
    }
    if (fieldId === 'skills' || fieldId === 'hobbies') {
      const group = document.getElementById(`group-${fieldId}`);
      if (group) group.classList.remove('has-error');
    }
    if (fieldId === 'photo') {
      const dropZone = document.getElementById('photoDropZone');
      if (dropZone) dropZone.classList.remove('is-invalid');
    }
  },

  /**
   * Explicitly marks a field as valid
   * @param {string} fieldId Field identifier
   */
  showSuccess(fieldId) {
    this.clearError(fieldId);
    const inputEl = document.getElementById(fieldId);
    if (inputEl) {
      inputEl.classList.add('is-valid');
    }
  },

  /**
   * Clears all validation states (both error and success)
   * @param {string} fieldId Field identifier
   */
  clearValidationState(fieldId) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(fieldId);

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }

    if (inputEl) {
      inputEl.classList.remove('is-invalid');
      inputEl.classList.remove('is-valid');
    }

    const group = document.getElementById(`group-${fieldId}`);
    if (group) group.classList.remove('has-error');

    const dropZone = document.getElementById('photoDropZone');
    if (dropZone) dropZone.classList.remove('is-invalid');
  },

  /**
   * Validates a single field against its JSON configuration rules
   * @param {string} fieldId 
   * @param {any} value 
   * @param {Object} allValues 
   * @param {boolean} isEditMode 
   * @param {string|null} editingId 
   * @returns {{ isValid: boolean, message: string }}
   */
  validateField(fieldId, value, allValues = {}, isEditMode = false, editingId = null) {
    const config = FORM_CONFIG.fields[fieldId];
    if (!config) {
      return { isValid: true, message: '' };
    }

    const rules = config.validation || {};
    const msgs = config.messages || {};

    // 1. Required Check
    if (config.required) {
      if (config.type === 'checkbox') {
        if (!Array.isArray(value) || value.length === 0) {
          return { isValid: false, message: msgs.required || `${config.label} is required.` };
        }
      } else if (config.type === 'file') {
        // value can be file object or base64 string (during edit)
        if (!value) {
          return { isValid: false, message: msgs.required || `${config.label} is required.` };
        }
      } else {
        const strVal = value !== undefined && value !== null ? String(value).trim() : '';
        if (!strVal) {
          return { isValid: false, message: msgs.required || `${config.label} is required.` };
        }
      }
    } else {
      // Not required and empty -> valid
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return { isValid: true, message: '' };
      }
    }

    // String-based validations
    if (typeof value === 'string') {
      const trimmed = value.trim();

      // minLength
      if (rules.minLength && trimmed.length < rules.minLength) {
        return { isValid: false, message: msgs.minLength || `${config.label} must be at least ${rules.minLength} characters.` };
      }

      // maxLength
      if (rules.maxLength && trimmed.length > rules.maxLength) {
        return { isValid: false, message: msgs.maxLength || `${config.label} cannot exceed ${rules.maxLength} characters.` };
      }

      // Pattern / Regex
      if (rules.pattern) {
        const regex = typeof rules.pattern === 'string' ? new RegExp(rules.pattern) : rules.pattern;
        if (!regex.test(trimmed)) {
          return { isValid: false, message: msgs.pattern || `${config.label} format is invalid.` };
        }
      }
    }

    // Numeric / Range validations (Age, Semester)
    if (config.type === 'number' || rules.min !== undefined || rules.max !== undefined) {
      const numVal = Number(value);
      if (isNaN(numVal)) {
        return { isValid: false, message: `${config.label} must be a valid number.` };
      }
      if (rules.min !== undefined && numVal < rules.min) {
        return { isValid: false, message: msgs.min || `${config.label} must be at least ${rules.min}.` };
      }
      if (rules.max !== undefined && numVal > rules.max) {
        return { isValid: false, message: msgs.max || `${config.label} cannot exceed ${rules.max}.` };
      }
    }

    // Date of Birth validations
    if (config.type === 'date') {
      const inputDate = new Date(value);
      if (isNaN(inputDate.getTime())) {
        return { isValid: false, message: "Please select a valid date." };
      }

      if (rules.noFutureDate) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (inputDate > today) {
          return { isValid: false, message: msgs.futureDate || "Date cannot be in the future." };
        }
      }

      if (rules.minAge !== undefined || rules.maxAge !== undefined) {
        const age = this.calculateAge(value);
        if (age === null) {
          return { isValid: false, message: "Invalid date for age calculation." };
        }
        if (rules.minAge !== undefined && age < rules.minAge) {
          return { isValid: false, message: msgs.ageRange || `Student must be at least ${rules.minAge} years old (Current: ${age}).` };
        }
        if (rules.maxAge !== undefined && age > rules.maxAge) {
          return { isValid: false, message: msgs.ageRange || `Student cannot be older than ${rules.maxAge} years (Current: ${age}).` };
        }
      }
    }

    // Checkbox Min Selection (Skills, Hobbies)
    if (config.type === 'checkbox' && rules.minSelected) {
      const selectedArr = Array.isArray(value) ? value : [];
      if (selectedArr.length < rules.minSelected) {
        return { isValid: false, message: msgs.required || `Please select at least ${rules.minSelected} option.` };
      }
    }

    // File / Photo validations
    if (config.type === 'file' && value && typeof value === 'object' && value instanceof File) {
      if (rules.allowedTypes && !rules.allowedTypes.includes(value.type.toLowerCase())) {
        return { isValid: false, message: msgs.invalidType || "Allowed formats: JPG, JPEG, PNG." };
      }
      if (rules.maxSizeBytes && value.size > rules.maxSizeBytes) {
        return { isValid: false, message: msgs.maxSize || "File size exceeds maximum allowed limit (2 MB)." };
      }
    }

    // Uniqueness validations (Enrollment Number & Email)
    if (rules.isUnique) {
      if (fieldId === 'enrollmentNo') {
        const existingStudent = StorageService.findStudentByEnrollment(value);
        if (existingStudent) {
          // If in edit mode, ignore if matching the student being edited
          if (!isEditMode || existingStudent.id !== editingId) {
            return { isValid: false, message: msgs.unique || "Enrollment number already exists." };
          }
        }
      }

      if (fieldId === 'email') {
        const existingStudent = StorageService.findStudentByEmail(value);
        if (existingStudent) {
          // If in edit mode, ignore if matching the student being edited
          if (!isEditMode || existingStudent.id !== editingId) {
            return { isValid: false, message: msgs.unique || "Email address already exists." };
          }
        }
      }
    }

    return { isValid: true, message: '' };
  },

  /**
   * Validates the entire form and displays errors on invalid fields
   * @param {Object} formData Key-value map of form fields
   * @param {boolean} isEditMode 
   * @param {string|null} editingId 
   * @returns {{ isValid: boolean, errors: Object, firstInvalidField: string|null }}
   */
  validateForm(formData, isEditMode = false, editingId = null) {
    let isValid = true;
    const errors = {};
    let firstInvalidField = null;

    Object.keys(FORM_CONFIG.fields).forEach(fieldId => {
      const value = formData[fieldId];
      const result = this.validateField(fieldId, value, formData, isEditMode, editingId);

      if (!result.isValid) {
        isValid = false;
        errors[fieldId] = result.message;
        this.showError(fieldId, result.message);

        if (!firstInvalidField) {
          firstInvalidField = fieldId;
        }
      } else {
        this.clearError(fieldId);
      }
    });

    return { isValid, errors, firstInvalidField };
  }
};
