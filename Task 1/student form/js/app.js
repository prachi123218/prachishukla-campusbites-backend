/**
 * app.js - Main Application Orchestrator
 * Connects UI elements, event listeners, form modes, real-time validation, and rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. STATE & DOM REFERENCES
  // =========================================================================
  let editingStudentId = null;
  let currentPhotoFile = null;
  let currentPhotoBase64 = null; // Used when restoring photo during edit

  // Form & Card
  const form = document.getElementById('studentRegistrationForm');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');
  const formModeBadge = document.getElementById('formModeBadge');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitBtnIcon = document.getElementById('submitBtnIcon');
  const resetBtn = document.getElementById('resetBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // Notifications
  const successNotification = document.getElementById('successNotification');
  const successTitle = document.getElementById('successTitle');
  const successDesc = document.getElementById('successDesc');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');

  // Input Elements
  const studentNameInput = document.getElementById('studentName');
  const enrollmentNoInput = document.getElementById('enrollmentNo');
  const emailInput = document.getElementById('email');
  const mobileNumberInput = document.getElementById('mobileNumber');
  const dobInput = document.getElementById('dob');
  const ageInput = document.getElementById('age');
  const courseSelect = document.getElementById('course');
  const specializationSelect = document.getElementById('specialization');
  const semesterSelect = document.getElementById('semester');
  const addressInput = document.getElementById('address');
  const cityInput = document.getElementById('city');
  const stateInput = document.getElementById('state');
  const skillsContainer = document.getElementById('skillsContainer');
  const hobbiesContainer = document.getElementById('hobbiesContainer');

  // Photo Upload Elements
  const photoDropZone = document.getElementById('photoDropZone');
  const photoInput = document.getElementById('photoInput');
  const btnChoosePhoto = document.getElementById('btnChoosePhoto');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const photoPreviewContainer = document.getElementById('photoPreviewContainer');
  const photoPreviewImg = document.getElementById('photoPreviewImg');
  const previewFileName = document.getElementById('previewFileName');
  const previewFileSize = document.getElementById('previewFileSize');
  const btnRemovePhoto = document.getElementById('btnRemovePhoto');

  // Table, Search & Filter Elements
  const studentTableBody = document.getElementById('studentTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableCountBadge = document.getElementById('tableCountBadge');
  const searchInput = document.getElementById('searchInput');
  const filterCourseSelect = document.getElementById('filterCourse');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // Statistics Dashboard Elements
  const totalStudentsStat = document.getElementById('totalStudentsStat');
  const courseCountStat = document.getElementById('courseCountStat');
  const maleCountStat = document.getElementById('maleCountStat');
  const femaleCountStat = document.getElementById('femaleCountStat');

  // =========================================================================
  // 2. INITIALIZATION & DYNAMIC DROPDOWN/OPTION POPULATION
  // =========================================================================

  function initializeFormOptions() {
    // Populate Courses
    if (courseSelect) {
      courseSelect.innerHTML = '<option value="" disabled selected>Select Course</option>';
      FORM_CONFIG.options.courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        courseSelect.appendChild(opt);
      });
    }

    // Populate Filter Courses Dropdown
    if (filterCourseSelect) {
      filterCourseSelect.innerHTML = '<option value="all">All Courses</option>';
      FORM_CONFIG.options.courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        filterCourseSelect.appendChild(opt);
      });
    }

    // Populate Semesters
    if (semesterSelect) {
      semesterSelect.innerHTML = '<option value="" disabled selected>Select Semester</option>';
      FORM_CONFIG.options.semesters.forEach(sem => {
        const opt = document.createElement('option');
        opt.value = sem;
        opt.textContent = `Semester ${sem}`;
        semesterSelect.appendChild(opt);
      });
    }

    // Populate Skills Checkboxes
    if (skillsContainer) {
      skillsContainer.innerHTML = '';
      FORM_CONFIG.options.skills.forEach(skill => {
        const label = document.createElement('label');
        label.className = 'checkbox-option';
        label.innerHTML = `
          <input type="checkbox" name="skills" value="${escapeHtml(skill)}" class="checkbox-input" />
          <span class="checkbox-custom-indicator">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </span>
          <span class="checkbox-text">${escapeHtml(skill)}</span>
        `;
        skillsContainer.appendChild(label);
      });
    }

    // Populate Hobbies Checkboxes
    if (hobbiesContainer) {
      hobbiesContainer.innerHTML = '';
      FORM_CONFIG.options.hobbies.forEach(hobby => {
        const label = document.createElement('label');
        label.className = 'checkbox-option';
        label.innerHTML = `
          <input type="checkbox" name="hobbies" value="${escapeHtml(hobby)}" class="checkbox-input" />
          <span class="checkbox-custom-indicator">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </span>
          <span class="checkbox-text">${escapeHtml(hobby)}</span>
        `;
        hobbiesContainer.appendChild(label);
      });
    }

    // Seed default demo students if storage is completely empty
    seedInitialDataIfEmpty();

    // Render initial table & statistics
    renderStudentsList();
  }

  /**
   * Updates the Specialization dropdown based on the selected Course
   * @param {string} selectedCourse 
   * @param {string|null} preferredSpecialization 
   */
  function updateSpecializationOptions(selectedCourse, preferredSpecialization = null) {
    if (!specializationSelect) return;

    specializationSelect.innerHTML = '<option value="" disabled selected>Select Specialization</option>';

    if (!selectedCourse) {
      specializationSelect.disabled = true;
      return;
    }

    const courseObj = FORM_CONFIG.options.courses.find(c => c.name === selectedCourse);
    if (courseObj && Array.isArray(courseObj.specializations)) {
      courseObj.specializations.forEach(spec => {
        const opt = document.createElement('option');
        opt.value = spec;
        opt.textContent = spec;
        if (preferredSpecialization && preferredSpecialization === spec) {
          opt.selected = true;
        }
        specializationSelect.appendChild(opt);
      });
      specializationSelect.disabled = false;
    } else {
      specializationSelect.disabled = true;
    }
  }

  /**
   * Seeds demo data if localStorage is empty
   */
  function seedInitialDataIfEmpty() {
    const existing = StorageService.getStudents();
    if (existing.length === 0) {
      const demoStudents = [
        {
          id: "STU-001",
          studentName: "Aarav Sharma",
          enrollmentNo: "24MSC001",
          email: "aarav.sharma@college.edu",
          mobileNumber: "9876543210",
          dob: "2002-04-15",
          age: 22,
          gender: "Male",
          course: "MSc IT",
          specialization: "Artificial Intelligence & ML",
          semester: 3,
          address: "402 Silicon Heights, SG Highway",
          city: "Ahmedabad",
          state: "Gujarat",
          skills: ["Python", "JavaScript", "Machine Learning", "SQL / Relational DB"],
          hobbies: ["Coding & Open Source", "Reading Tech Articles", "Gaming & Esports"],
          passportPhoto: null,
          photoFileName: null,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
          id: "STU-002",
          studentName: "Priya Patel",
          enrollmentNo: "24MSC002",
          email: "priya.patel@college.edu",
          mobileNumber: "9812345678",
          dob: "2003-08-20",
          age: 21,
          gender: "Female",
          course: "Computer Science & Engineering",
          specialization: "Artificial Intelligence",
          semester: 4,
          address: "15 Green Valley Residency",
          city: "Vadodara",
          state: "Gujarat",
          skills: ["Java", "React", "HTML5/CSS3", "Git & GitHub"],
          hobbies: ["Music & Instruments", "Photography"],
          passportPhoto: null,
          photoFileName: null,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ];
      StorageService.saveStudents(demoStudents);
    }
  }

  // =========================================================================
  // 3. FORM DATA EXTRACTION & REAL-TIME VALIDATION
  // =========================================================================

  /**
   * Collects current values from all form inputs into a plain JavaScript object
   * @returns {Object} Form data map
   */
  function collectFormData() {
    const selectedGender = document.querySelector('input[name="gender"]:checked');
    const selectedSkills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value);
    const selectedHobbies = Array.from(document.querySelectorAll('input[name="hobbies"]:checked')).map(cb => cb.value);

    return {
      studentName: studentNameInput ? studentNameInput.value : '',
      enrollmentNo: enrollmentNoInput ? enrollmentNoInput.value : '',
      email: emailInput ? emailInput.value : '',
      mobileNumber: mobileNumberInput ? mobileNumberInput.value : '',
      dob: dobInput ? dobInput.value : '',
      age: ageInput ? ageInput.value : '',
      gender: selectedGender ? selectedGender.value : '',
      course: courseSelect ? courseSelect.value : '',
      specialization: specializationSelect ? specializationSelect.value : '',
      semester: semesterSelect ? semesterSelect.value : '',
      address: addressInput ? addressInput.value : '',
      city: cityInput ? cityInput.value : '',
      state: stateInput ? stateInput.value : '',
      skills: selectedSkills,
      hobbies: selectedHobbies,
      photo: currentPhotoFile || currentPhotoBase64 || null,
      photoFileName: currentPhotoFile ? currentPhotoFile.name : (previewFileName ? previewFileName.textContent : null)
    };
  }

  /**
   * Helper to trigger real-time validation on a specific field
   * @param {string} fieldId 
   */
  function triggerFieldValidation(fieldId) {
    const formData = collectFormData();
    const isEditMode = editingStudentId !== null;
    const result = ValidationEngine.validateField(
      fieldId,
      formData[fieldId],
      formData,
      isEditMode,
      editingStudentId
    );

    if (!result.isValid) {
      ValidationEngine.showError(fieldId, result.message);
    } else {
      ValidationEngine.clearError(fieldId);
    }
    return result.isValid;
  }

  // Real-Time Event Listeners on Individual Controls
  if (studentNameInput) {
    studentNameInput.addEventListener('input', () => triggerFieldValidation('studentName'));
    studentNameInput.addEventListener('blur', () => triggerFieldValidation('studentName'));
  }

  if (enrollmentNoInput) {
    enrollmentNoInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
      triggerFieldValidation('enrollmentNo');
    });
    enrollmentNoInput.addEventListener('blur', () => triggerFieldValidation('enrollmentNo'));
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => triggerFieldValidation('email'));
    emailInput.addEventListener('blur', () => triggerFieldValidation('email'));
  }

  if (mobileNumberInput) {
    mobileNumberInput.addEventListener('input', (e) => {
      // Allow only numbers and limit to 10 digits
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      triggerFieldValidation('mobileNumber');
    });
    mobileNumberInput.addEventListener('blur', () => triggerFieldValidation('mobileNumber'));
  }

  if (dobInput) {
    dobInput.addEventListener('change', () => {
      // Calculate and sync age automatically
      const calculatedAge = ValidationEngine.calculateAge(dobInput.value);
      if (ageInput) {
        ageInput.value = calculatedAge !== null && !isNaN(calculatedAge) ? calculatedAge : '';
      }
      triggerFieldValidation('dob');
      triggerFieldValidation('age');
    });
    dobInput.addEventListener('blur', () => {
      triggerFieldValidation('dob');
      triggerFieldValidation('age');
    });
  }

  if (courseSelect) {
    courseSelect.addEventListener('change', () => {
      updateSpecializationOptions(courseSelect.value);
      triggerFieldValidation('course');
      ValidationEngine.clearValidationState('specialization');
    });
    courseSelect.addEventListener('blur', () => triggerFieldValidation('course'));
  }

  if (specializationSelect) {
    specializationSelect.addEventListener('change', () => triggerFieldValidation('specialization'));
    specializationSelect.addEventListener('blur', () => triggerFieldValidation('specialization'));
  }

  if (semesterSelect) {
    semesterSelect.addEventListener('change', () => triggerFieldValidation('semester'));
    semesterSelect.addEventListener('blur', () => triggerFieldValidation('semester'));
  }

  if (addressInput) {
    addressInput.addEventListener('input', () => triggerFieldValidation('address'));
    addressInput.addEventListener('blur', () => triggerFieldValidation('address'));
  }

  if (cityInput) {
    cityInput.addEventListener('input', () => triggerFieldValidation('city'));
    cityInput.addEventListener('blur', () => triggerFieldValidation('city'));
  }

  if (stateInput) {
    stateInput.addEventListener('input', () => triggerFieldValidation('state'));
    stateInput.addEventListener('blur', () => triggerFieldValidation('state'));
  }

  document.querySelectorAll('input[name="gender"]').forEach(radio => {
    radio.addEventListener('change', () => triggerFieldValidation('gender'));
  });

  if (skillsContainer) {
    skillsContainer.addEventListener('change', () => triggerFieldValidation('skills'));
  }

  if (hobbiesContainer) {
    hobbiesContainer.addEventListener('change', () => triggerFieldValidation('hobbies'));
  }

  // =========================================================================
  // 4. PHOTO UPLOAD & PREVIEW LOGIC
  // =========================================================================

  if (btnChoosePhoto && photoInput) {
    btnChoosePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      photoInput.click();
    });
  }

  if (photoDropZone && photoInput) {
    photoDropZone.addEventListener('click', () => {
      photoInput.click();
    });

    // Drag and Drop
    photoDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoDropZone.classList.add('dragover');
    });

    photoDropZone.addEventListener('dragleave', () => {
      photoDropZone.classList.remove('dragover');
    });

    photoDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      photoDropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processPhotoFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (btnRemovePhoto && photoInput) {
    btnRemovePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      resetPhotoPreview();
      photoInput.click();
    });
  }

  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processPhotoFile(e.target.files[0]);
      }
    });
  }

  /**
   * Validates and previews selected photo file
   * @param {File} file 
   */
  function processPhotoFile(file) {
    currentPhotoFile = file;

    const validationResult = ValidationEngine.validateField('photo', file);
    if (!validationResult.isValid) {
      ValidationEngine.showError('photo', validationResult.message);
      resetPhotoPreview();
      return;
    }

    ValidationEngine.clearError('photo');

    // Format file size
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const formattedSize = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    // Read and display Base64 preview
    const reader = new FileReader();
    reader.onload = (event) => {
      currentPhotoBase64 = event.target.result;
      if (photoPreviewImg) photoPreviewImg.src = event.target.result;
      if (previewFileName) previewFileName.textContent = file.name;
      if (previewFileSize) previewFileSize.textContent = formattedSize;

      if (uploadPrompt) uploadPrompt.style.display = 'none';
      if (photoPreviewContainer) photoPreviewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  /**
   * Resets the photo drop zone UI to its default initial state
   */
  function resetPhotoPreview() {
    currentPhotoFile = null;
    currentPhotoBase64 = null;
    if (photoInput) photoInput.value = '';
    if (photoPreviewImg) photoPreviewImg.src = '';
    if (previewFileName) previewFileName.textContent = '';
    if (previewFileSize) previewFileSize.textContent = '';
    if (photoPreviewContainer) photoPreviewContainer.style.display = 'none';
    if (uploadPrompt) uploadPrompt.style.display = 'flex';
  }

  /**
   * Sets photo preview from an existing Base64 string (during edit mode)
   * @param {string} base64Url 
   * @param {string} fileName 
   */
  function setPhotoPreviewFromBase64(base64Url, fileName = 'student_photo.jpg') {
    if (!base64Url) {
      resetPhotoPreview();
      return;
    }
    currentPhotoBase64 = base64Url;
    currentPhotoFile = null;
    if (photoPreviewImg) photoPreviewImg.src = base64Url;
    if (previewFileName) previewFileName.textContent = fileName || 'Uploaded Photo';
    if (previewFileSize) previewFileSize.textContent = 'Stored Image';
    if (uploadPrompt) uploadPrompt.style.display = 'none';
    if (photoPreviewContainer) photoPreviewContainer.style.display = 'flex';
    ValidationEngine.clearError('photo');
  }

  // =========================================================================
  // 5. CRUD OPERATIONS: CREATE & UPDATE
  // =========================================================================

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = collectFormData();
      const isEditMode = editingStudentId !== null;

      // 1. Validate Form
      const validationReport = ValidationEngine.validateForm(formData, isEditMode, editingStudentId);

      if (!validationReport.isValid) {
        // Focus first invalid field
        if (validationReport.firstInvalidField) {
          const firstEl = document.getElementById(validationReport.firstInvalidField) ||
            document.getElementById(`group-${validationReport.firstInvalidField}`);
          if (firstEl) {
            firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof firstEl.focus === 'function') firstEl.focus();
          }
        }
        return;
      }

      // 2. Prepare Base64 Image
      let photoDataUrl = currentPhotoBase64;
      if (currentPhotoFile) {
        try {
          photoDataUrl = await StudentService.convertFileToBase64(currentPhotoFile);
        } catch (err) {
          console.error("Photo conversion failed", err);
          ValidationEngine.showError('photo', "Failed to process photo. Please choose another image.");
          return;
        }
      }

      // 3. Execute Create or Update
      if (isEditMode) {
        const updated = StudentService.updateStudent(editingStudentId, formData, photoDataUrl);
        if (updated) {
          showNotification(
            "Student Updated Successfully",
            `Record for ${escapeHtml(updated.studentName)} (${escapeHtml(updated.enrollmentNo)}) has been updated.`
          );
        }
      } else {
        const created = StudentService.createStudent(formData, photoDataUrl);
        if (created) {
          showNotification(
            "Student Registered Successfully",
            `Record for ${escapeHtml(created.studentName)} (${escapeHtml(created.enrollmentNo)}) has been saved.`
          );
        }
      }

      // 4. Reset Form & UI Mode
      resetFormToCreateMode();

      // 5. Refresh Table & Stats
      renderStudentsList();
    });
  }

  // Reset Button Handler
  if (form) {
    form.addEventListener('reset', () => {
      setTimeout(resetFormToCreateMode, 10);
    });
  }

  // Cancel Edit Button Handler
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      resetFormToCreateMode();
      showNotification(
        "Edit Cancelled",
        "Form has been returned to Create Mode."
      );
    });
  }

  /**
   * Resets form to Create mode and clears all validation states
   */
  function resetFormToCreateMode() {
    editingStudentId = null;

    if (form) form.reset();
    resetPhotoPreview();

    // Reset Form Header & Button state
    if (formTitle) formTitle.textContent = "Student Registration";
    if (formSubtitle) formSubtitle.textContent = "Enter the student details below.";
    if (formModeBadge) {
      formModeBadge.textContent = "Create Mode";
      formModeBadge.className = "form-mode-badge create-mode";
    }
    if (submitBtnText) submitBtnText.textContent = "Add Student";
    if (submitBtnIcon) submitBtnIcon.textContent = "＋";
    if (cancelEditBtn) cancelEditBtn.style.display = "none";

    // Clear Specialization options
    if (specializationSelect) {
      specializationSelect.innerHTML = '<option value="" disabled selected>Select Specialization</option>';
      specializationSelect.disabled = true;
    }

    // Clear validation messages & classes
    Object.keys(FORM_CONFIG.fields).forEach(fieldId => {
      ValidationEngine.clearValidationState(fieldId);
    });
  }

  // =========================================================================
  // 6. CRUD OPERATIONS: READ & RENDERING
  // =========================================================================

  /**
   * Renders the list of students in the table and updates dashboard statistics
   */
  function renderStudentsList() {
    const query = searchInput ? searchInput.value : '';
    const courseFilter = filterCourseSelect ? filterCourseSelect.value : 'all';

    const students = StudentService.getStudents(query, courseFilter);
    const stats = StudentService.getStats();

    // Update Statistics Badges
    if (totalStudentsStat) totalStudentsStat.textContent = stats.total;
    if (courseCountStat) courseCountStat.textContent = stats.coursesCount;
    if (maleCountStat) maleCountStat.textContent = stats.maleCount;
    if (femaleCountStat) femaleCountStat.textContent = stats.femaleCount;

    if (tableCountBadge) {
      tableCountBadge.textContent = `${students.length} record${students.length === 1 ? '' : 's'}`;
    }

    // Empty state handling
    if (!students || students.length === 0) {
      if (studentTableBody) studentTableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Build Table Rows
    if (studentTableBody) {
      studentTableBody.innerHTML = students.map(student => renderStudentRow(student)).join('');
    }
  }

  /**
   * Generates HTML for a single student table row
   * Uses safe escaping for all user-provided data to prevent XSS.
   * @param {Object} student 
   * @returns {string} Table row HTML
   */
  function renderStudentRow(student) {
    const isCurrentlyEditing = student.id === editingStudentId;
    const rowClass = isCurrentlyEditing ? 'student-row editing-highlight' : 'student-row';

    // Photo avatar or initials
    let avatarHtml = '';
    if (student.passportPhoto) {
      avatarHtml = `<img src="${student.passportPhoto}" alt="${escapeHtml(student.studentName)}" class="student-avatar-img" />`;
    } else {
      const initials = student.studentName
        ? student.studentName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'ST';
      avatarHtml = `<div class="student-avatar-initials">${escapeHtml(initials)}</div>`;
    }

    // Skills pill tags
    const skillsHtml = Array.isArray(student.skills) && student.skills.length > 0
      ? student.skills.map(s => `<span class="tag-pill">${escapeHtml(s)}</span>`).join('')
      : '<span class="text-muted">None</span>';

    return `
      <tr class="${rowClass}" data-id="${escapeHtml(student.id)}">
        <td class="col-student">
          <div class="student-profile-cell">
            <div class="student-avatar-wrap">${avatarHtml}</div>
            <div class="student-info-meta">
              <span class="student-name-text">${escapeHtml(student.studentName)}</span>
              <span class="student-id-text">${escapeHtml(student.id)}</span>
            </div>
          </div>
        </td>
        <td class="col-enrollment">
          <span class="enrollment-badge">${escapeHtml(student.enrollmentNo)}</span>
        </td>
        <td class="col-contact">
          <div class="contact-meta">
            <span class="contact-email">${escapeHtml(student.email)}</span>
            <span class="contact-mobile">${escapeHtml(student.mobileNumber)}</span>
          </div>
        </td>
        <td class="col-academic">
          <div class="academic-meta">
            <span class="course-name">${escapeHtml(student.course)}</span>
            <span class="spec-name">${escapeHtml(student.specialization || '')} • Sem ${escapeHtml(String(student.semester))}</span>
          </div>
        </td>
        <td class="col-personal">
          <div class="personal-meta">
            <span class="gender-pill ${student.gender ? student.gender.toLowerCase() : ''}">${escapeHtml(student.gender)}</span>
            <span class="age-text">Age: ${escapeHtml(String(student.age))}</span>
          </div>
        </td>
        <td class="col-location">
          <span class="location-text">${escapeHtml(student.city)}, ${escapeHtml(student.state)}</span>
        </td>
        <td class="col-skills">
          <div class="tags-cluster">${skillsHtml}</div>
        </td>
        <td class="col-actions">
          <div class="table-actions-group">
            <button type="button" class="btn-action btn-action-edit" data-action="edit" data-id="${escapeHtml(student.id)}" title="Edit Student">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
              <span>Edit</span>
            </button>
            <button type="button" class="btn-action btn-action-delete" data-action="delete" data-id="${escapeHtml(student.id)}" title="Delete Student">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // =========================================================================
  // 7. CRUD OPERATIONS: UPDATE / EDIT MODE
  // =========================================================================

  /**
   * Sets the form into Edit Mode and populates it with student data
   * @param {string} studentId 
   */
  function startEditStudent(studentId) {
    const student = StorageService.findStudentById(studentId);
    if (!student) {
      alert("Student record not found.");
      return;
    }

    editingStudentId = student.id;

    // 1. Populate text inputs
    if (studentNameInput) studentNameInput.value = student.studentName || '';
    if (enrollmentNoInput) enrollmentNoInput.value = student.enrollmentNo || '';
    if (emailInput) emailInput.value = student.email || '';
    if (mobileNumberInput) mobileNumberInput.value = student.mobileNumber || '';
    if (dobInput) dobInput.value = student.dob || '';
    if (ageInput) ageInput.value = student.age || '';
    if (addressInput) addressInput.value = student.address || '';
    if (cityInput) cityInput.value = student.city || '';
    if (stateInput) stateInput.value = student.state || '';

    // 2. Populate Gender radio
    const genderRadio = document.querySelector(`input[name="gender"][value="${student.gender}"]`);
    if (genderRadio) {
      genderRadio.checked = true;
    }

    // 3. Populate Course & Dependent Specialization
    if (courseSelect) {
      courseSelect.value = student.course || '';
      updateSpecializationOptions(student.course, student.specialization);
    }

    // 4. Populate Semester
    if (semesterSelect) {
      semesterSelect.value = student.semester || '';
    }

    // 5. Populate Skills checkboxes
    const skillValues = Array.isArray(student.skills) ? student.skills : [];
    document.querySelectorAll('input[name="skills"]').forEach(cb => {
      cb.checked = skillValues.includes(cb.value);
    });

    // 6. Populate Hobbies checkboxes
    const hobbyValues = Array.isArray(student.hobbies) ? student.hobbies : [];
    document.querySelectorAll('input[name="hobbies"]').forEach(cb => {
      cb.checked = hobbyValues.includes(cb.value);
    });

    // 7. Restore Photo
    if (student.passportPhoto) {
      setPhotoPreviewFromBase64(student.passportPhoto, student.photoFileName);
    } else {
      resetPhotoPreview();
    }

    // 8. Clear previous validation states
    Object.keys(FORM_CONFIG.fields).forEach(fieldId => {
      ValidationEngine.clearValidationState(fieldId);
    });

    // 9. Update UI headers & action button
    if (formTitle) formTitle.textContent = "Edit Student Details";
    if (formSubtitle) formSubtitle.textContent = `Modifying record: ${student.studentName} (${student.enrollmentNo})`;
    if (formModeBadge) {
      formModeBadge.textContent = "Edit Mode";
      formModeBadge.className = "form-mode-badge edit-mode";
    }
    if (submitBtnText) submitBtnText.textContent = "Update Student";
    if (submitBtnIcon) submitBtnIcon.textContent = "✓";
    if (cancelEditBtn) cancelEditBtn.style.display = "inline-flex";

    // Highlight row in table
    renderStudentsList();

    // Scroll smoothly to form
    const formCard = document.querySelector('.form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // =========================================================================
  // 8. CRUD OPERATIONS: DELETE
  // =========================================================================

  /**
   * Confirms and deletes a student record
   * @param {string} studentId 
   */
  function confirmAndDeleteStudent(studentId) {
    const student = StorageService.findStudentById(studentId);
    if (!student) {
      alert("Student record not found.");
      return;
    }

    const confirmMessage = `Are you sure you want to delete student "${student.studentName}" (${student.enrollmentNo})?\n\nThis action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const isDeleted = StudentService.deleteStudent(studentId);
    if (isDeleted) {
      // If currently editing the deleted student, reset to Create mode
      if (editingStudentId === studentId) {
        resetFormToCreateMode();
      }

      showNotification(
        "Student Deleted Successfully",
        `Record for ${escapeHtml(student.studentName)} has been permanently removed.`
      );

      // Re-render table and stats
      renderStudentsList();
    } else {
      alert("Failed to delete the student record. Please try again.");
    }
  }

  // =========================================================================
  // 9. TABLE EVENT DELEGATION & SEARCH / FILTER LISTENERS
  // =========================================================================

  // Event Delegation for Table Actions (Edit & Delete)
  if (studentTableBody) {
    studentTableBody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-action="edit"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');

      if (editBtn) {
        const studentId = editBtn.getAttribute('data-id');
        if (studentId) startEditStudent(studentId);
      } else if (deleteBtn) {
        const studentId = deleteBtn.getAttribute('data-id');
        if (studentId) confirmAndDeleteStudent(studentId);
      }
    });
  }

  // Live Search & Course Filtering
  if (searchInput) {
    searchInput.addEventListener('input', () => renderStudentsList());
  }

  if (filterCourseSelect) {
    filterCourseSelect.addEventListener('change', () => renderStudentsList());
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (filterCourseSelect) filterCourseSelect.value = 'all';
      renderStudentsList();
    });
  }

  // Close Notification Handler
  if (closeSuccessBtn && successNotification) {
    closeSuccessBtn.addEventListener('click', () => {
      successNotification.classList.remove('show');
    });
  }

  /**
   * Displays the toast notification banner with custom title and message
   * @param {string} title 
   * @param {string} description 
   */
  function showNotification(title, description) {
    if (!successNotification) return;

    if (successTitle) successTitle.textContent = title;
    if (successDesc) successDesc.textContent = description;

    successNotification.classList.add('show');
    successNotification.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      successNotification.classList.remove('show');
    }, 5000);
  }

  /**
   * HTML escape helper to prevent XSS when rendering user input
   * @param {string} str 
   * @returns {string} Escaped string
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // 10. RUN INITIALIZATION
  // =========================================================================
  initializeFormOptions();
});
