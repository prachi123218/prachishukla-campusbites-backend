/**
 * registration.js - Student Registration Form Controller
 * Handles student self-registration, real-time JSON validation, photo preview,
 * and redirection to the Welcome page upon submission.
 */

document.addEventListener('DOMContentLoaded', () => {
  let currentPhotoFile = null;

  // DOM Elements
  const form = document.getElementById('studentRegistrationForm');
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

  // Submit button
  const submitBtn = document.getElementById('submitBtn');

  // =========================================================================
  // 1. INITIALIZE DROPDOWNS & CHECKBOXES FROM JSON CONFIG
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

    // Populate Semesters (1 to 6)
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

    // Seed sample demo students in localStorage if first visit
    seedInitialDemoData();
  }

  /**
   * Updates the Specialization dropdown based on selected course
   */
  function updateSpecializations(courseName) {
    if (!specializationSelect) return;
    specializationSelect.innerHTML = '<option value="" disabled selected>Select Specialization</option>';

    if (!courseName) {
      specializationSelect.disabled = true;
      return;
    }

    const courseObj = FORM_CONFIG.options.courses.find(c => c.name === courseName);
    if (courseObj && Array.isArray(courseObj.specializations)) {
      courseObj.specializations.forEach(spec => {
        const opt = document.createElement('option');
        opt.value = spec;
        opt.textContent = spec;
        specializationSelect.appendChild(opt);
      });
      specializationSelect.disabled = false;
    } else {
      specializationSelect.disabled = true;
    }
  }

  function seedInitialDemoData() {
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
          hobbies: ["Coding & Open Source", "Reading Tech Articles"],
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
        },
        {
          id: "STU-003",
          studentName: "Ananya Desai",
          enrollmentNo: "24MSC003",
          email: "ananya.desai@college.edu",
          mobileNumber: "9823456789",
          dob: "2003-01-10",
          age: 21,
          gender: "Female",
          course: "Information Technology",
          specialization: "Web & Mobile App Development",
          semester: 2,
          address: "Plot 88, Sunrise Park",
          city: "Surat",
          state: "Gujarat",
          skills: ["JavaScript", "HTML5/CSS3", "React", "Node.js"],
          hobbies: ["Travelling & Trekking", "Coding & Open Source"],
          passportPhoto: null,
          photoFileName: null,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      StorageService.saveStudents(demoStudents);
    }
  }

  // =========================================================================
  // 2. FORM DATA EXTRACTION & REAL-TIME VALIDATION
  // =========================================================================

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
      photo: currentPhotoFile || null,
      photoFileName: currentPhotoFile ? currentPhotoFile.name : null
    };
  }

  function triggerFieldValidation(fieldId) {
    const formData = collectFormData();
    const result = ValidationEngine.validateField(
      fieldId,
      formData[fieldId],
      formData,
      false,
      null
    );

    if (!result.isValid) {
      ValidationEngine.showError(fieldId, result.message);
    } else {
      ValidationEngine.clearError(fieldId);
    }
    return result.isValid;
  }

  // Real-time Event Listeners
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
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      triggerFieldValidation('mobileNumber');
    });
    mobileNumberInput.addEventListener('blur', () => triggerFieldValidation('mobileNumber'));
  }

  if (dobInput) {
    dobInput.addEventListener('change', () => {
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
      updateSpecializations(courseSelect.value);
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
  // 3. PHOTO UPLOAD & PREVIEW
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

  function processPhotoFile(file) {
    currentPhotoFile = file;

    const validationResult = ValidationEngine.validateField('photo', file);
    if (!validationResult.isValid) {
      ValidationEngine.showError('photo', validationResult.message);
      resetPhotoPreview();
      return;
    }

    ValidationEngine.clearError('photo');

    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const formattedSize = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (photoPreviewImg) photoPreviewImg.src = event.target.result;
      if (previewFileName) previewFileName.textContent = file.name;
      if (previewFileSize) previewFileSize.textContent = formattedSize;

      if (uploadPrompt) uploadPrompt.style.display = 'none';
      if (photoPreviewContainer) photoPreviewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  function resetPhotoPreview() {
    currentPhotoFile = null;
    if (photoInput) photoInput.value = '';
    if (photoPreviewImg) photoPreviewImg.src = '';
    if (previewFileName) previewFileName.textContent = '';
    if (previewFileSize) previewFileSize.textContent = '';
    if (photoPreviewContainer) photoPreviewContainer.style.display = 'none';
    if (uploadPrompt) uploadPrompt.style.display = 'flex';
  }

  // =========================================================================
  // 4. FORM SUBMISSION & REDIRECT TO WELCOME PAGE
  // =========================================================================

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = collectFormData();

      // Validate all fields
      const validationReport = ValidationEngine.validateForm(formData, false, null);

      if (!validationReport.isValid) {
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

      // Convert photo to Base64
      let photoDataUrl = null;
      if (currentPhotoFile) {
        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Processing...';
          photoDataUrl = await StudentService.convertFileToBase64(currentPhotoFile);
        } catch (err) {
          console.error("Photo conversion failed", err);
          ValidationEngine.showError('photo', "Failed to process photo file.");
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Registration';
          return;
        }
      }

      // Create student record in localStorage
      const newStudent = StudentService.createStudent(formData, photoDataUrl);

      if (newStudent && newStudent.id) {
        // Store recent student ID for the welcome page
        StorageService.setRecentStudentId(newStudent.id);

        // Redirect to welcome page
        window.location.href = `welcome.html?id=${encodeURIComponent(newStudent.id)}`;
      } else {
        alert("Registration could not be saved. Please check the entered details.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
      }
    });

    // Form Reset Handler
    form.addEventListener('reset', () => {
      setTimeout(() => {
        resetPhotoPreview();
        if (specializationSelect) {
          specializationSelect.innerHTML = '<option value="" disabled selected>Select Course First</option>';
          specializationSelect.disabled = true;
        }
        Object.keys(FORM_CONFIG.fields).forEach(fieldId => {
          ValidationEngine.clearValidationState(fieldId);
        });
      }, 10);
    });
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize form
  initializeFormOptions();
});
