/**
 * dashboard.js - Admin Dashboard Controller
 * Handles auth guard, table rendering, stats counters, live search/filtering,
 * student deletion with confirmation, and student creation/editing via modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Auth Guard
  if (!StorageService.isAdminLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  let editingStudentId = null;
  let modalPhotoFile = null;
  let modalPhotoBase64 = null;

  // DOM Elements - Dashboard
  const logoutBtn = document.getElementById('logoutBtn');
  const totalStudentsStat = document.getElementById('totalStudentsStat');
  const courseCountStat = document.getElementById('courseCountStat');
  const maleCountStat = document.getElementById('maleCountStat');
  const femaleCountStat = document.getElementById('femaleCountStat');

  const searchInput = document.getElementById('searchInput');
  const filterCourseSelect = document.getElementById('filterCourse');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const tableCountBadge = document.getElementById('tableCountBadge');
  const studentTableBody = document.getElementById('studentTableBody');
  const emptyState = document.getElementById('emptyState');
  const btnOpenAddModal = document.getElementById('btnOpenAddModal');

  // Modal Elements
  const studentModal = document.getElementById('studentModal');
  const modalForm = document.getElementById('modalStudentForm');
  const modalTitle = document.getElementById('modalTitle');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');
  const modalSubmitBtnText = document.getElementById('modalSubmitBtnText');

  // Modal Inputs
  const mStudentName = document.getElementById('m_studentName');
  const mEnrollmentNo = document.getElementById('m_enrollmentNo');
  const mEmail = document.getElementById('m_email');
  const mMobile = document.getElementById('m_mobileNumber');
  const mDob = document.getElementById('m_dob');
  const mAge = document.getElementById('m_age');
  const mCourse = document.getElementById('m_course');
  const mSpecialization = document.getElementById('m_specialization');
  const mSemester = document.getElementById('m_semester');
  const mAddress = document.getElementById('m_address');
  const mCity = document.getElementById('m_city');
  const mState = document.getElementById('m_state');
  const mSkillsContainer = document.getElementById('m_skillsContainer');
  const mHobbiesContainer = document.getElementById('m_hobbiesContainer');

  // Modal Photo Elements
  const mPhotoDropZone = document.getElementById('m_photoDropZone');
  const mPhotoInput = document.getElementById('m_photoInput');
  const mBtnChoosePhoto = document.getElementById('m_btnChoosePhoto');
  const mUploadPrompt = document.getElementById('m_uploadPrompt');
  const mPhotoPreviewContainer = document.getElementById('m_photoPreviewContainer');
  const mPhotoPreviewImg = document.getElementById('m_photoPreviewImg');
  const mPreviewFileName = document.getElementById('m_previewFileName');
  const mPreviewFileSize = document.getElementById('m_previewFileSize');
  const mBtnRemovePhoto = document.getElementById('m_btnRemovePhoto');

  // Notification Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastTitle = document.getElementById('toastTitle');
  const toastDesc = document.getElementById('toastDesc');
  const closeToastBtn = document.getElementById('closeToastBtn');

  // =========================================================================
  // 1. INITIALIZATION
  // =========================================================================

  function initDashboard() {
    // Populate Course Filter in Toolbar
    if (filterCourseSelect) {
      filterCourseSelect.innerHTML = '<option value="all">All Courses</option>';
      FORM_CONFIG.options.courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        filterCourseSelect.appendChild(opt);
      });
    }

    // Populate Modal Course Select
    if (mCourse) {
      mCourse.innerHTML = '<option value="" disabled selected>Select Course</option>';
      FORM_CONFIG.options.courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        mCourse.appendChild(opt);
      });
    }

    // Populate Modal Semester Select
    if (mSemester) {
      mSemester.innerHTML = '<option value="" disabled selected>Select Semester</option>';
      FORM_CONFIG.options.semesters.forEach(sem => {
        const opt = document.createElement('option');
        opt.value = sem;
        opt.textContent = `Semester ${sem}`;
        mSemester.appendChild(opt);
      });
    }

    // Populate Modal Skills
    if (mSkillsContainer) {
      mSkillsContainer.innerHTML = '';
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
        mSkillsContainer.appendChild(label);
      });
    }

    // Populate Modal Hobbies
    if (mHobbiesContainer) {
      mHobbiesContainer.innerHTML = '';
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
        mHobbiesContainer.appendChild(label);
      });
    }

    // Render table & stats
    renderDashboardTable();
  }

  /**
   * Updates specialization dropdown inside modal
   */
  function updateModalSpecializations(courseName, preferredSpecialization = null) {
    if (!mSpecialization) return;
    mSpecialization.innerHTML = '<option value="" disabled selected>Select Specialization</option>';

    if (!courseName) {
      mSpecialization.disabled = true;
      return;
    }

    const courseObj = FORM_CONFIG.options.courses.find(c => c.name === courseName);
    if (courseObj && Array.isArray(courseObj.specializations)) {
      courseObj.specializations.forEach(spec => {
        const opt = document.createElement('option');
        opt.value = spec;
        opt.textContent = spec;
        if (preferredSpecialization && preferredSpecialization === spec) {
          opt.selected = true;
        }
        mSpecialization.appendChild(opt);
      });
      mSpecialization.disabled = false;
    } else {
      mSpecialization.disabled = true;
    }
  }

  // =========================================================================
  // 2. READ & TABLE RENDERING
  // =========================================================================

  function renderDashboardTable() {
    const query = searchInput ? searchInput.value : '';
    const courseFilter = filterCourseSelect ? filterCourseSelect.value : 'all';

    const students = StudentService.getStudents(query, courseFilter);
    const stats = StudentService.getStats();

    // Update Statistics Overview Cards
    if (totalStudentsStat) totalStudentsStat.textContent = stats.total;
    if (courseCountStat) courseCountStat.textContent = stats.coursesCount;
    if (maleCountStat) maleCountStat.textContent = stats.maleCount;
    if (femaleCountStat) femaleCountStat.textContent = stats.femaleCount;

    if (tableCountBadge) {
      tableCountBadge.textContent = `${students.length} student${students.length === 1 ? '' : 's'}`;
    }

    if (!students || students.length === 0) {
      if (studentTableBody) studentTableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (studentTableBody) {
      studentTableBody.innerHTML = students.map(s => renderStudentTableRow(s)).join('');
    }
  }

  function renderStudentTableRow(s) {
    let avatarHtml = '';
    if (s.passportPhoto) {
      avatarHtml = `<img src="${s.passportPhoto}" alt="${escapeHtml(s.studentName)}" class="student-avatar-img" />`;
    } else {
      const initials = s.studentName ? s.studentName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'ST';
      avatarHtml = `<div class="student-avatar-initials">${escapeHtml(initials)}</div>`;
    }

    const skillsHtml = Array.isArray(s.skills) && s.skills.length > 0
      ? s.skills.map(sk => `<span class="tag-pill">${escapeHtml(sk)}</span>`).join('')
      : '<span class="text-muted">None</span>';

    return `
      <tr class="student-row" data-id="${escapeHtml(s.id)}">
        <td class="col-student">
          <div class="student-profile-cell">
            <div class="student-avatar-wrap">${avatarHtml}</div>
            <div class="student-info-meta">
              <span class="student-name-text">${escapeHtml(s.studentName)}</span>
              <span class="student-id-text">${escapeHtml(s.id)}</span>
            </div>
          </div>
        </td>
        <td class="col-enrollment">
          <span class="enrollment-badge">${escapeHtml(s.enrollmentNo)}</span>
        </td>
        <td class="col-contact">
          <div class="contact-meta">
            <span class="contact-email">${escapeHtml(s.email)}</span>
            <span class="contact-mobile">${escapeHtml(s.mobileNumber)}</span>
          </div>
        </td>
        <td class="col-academic">
          <div class="academic-meta">
            <span class="course-name">${escapeHtml(s.course)}</span>
            <span class="spec-name">${escapeHtml(s.specialization || '')} • Sem ${escapeHtml(String(s.semester))}</span>
          </div>
        </td>
        <td class="col-personal">
          <div class="personal-meta">
            <span class="gender-pill ${s.gender ? s.gender.toLowerCase() : ''}">${escapeHtml(s.gender)}</span>
            <span class="age-text">Age: ${escapeHtml(String(s.age))}</span>
          </div>
        </td>
        <td class="col-location">
          <span class="location-text">${escapeHtml(s.city)}, ${escapeHtml(s.state)}</span>
        </td>
        <td class="col-skills">
          <div class="tags-cluster">${skillsHtml}</div>
        </td>
        <td class="col-actions">
          <div class="table-actions-group">
            <button type="button" class="btn-action btn-action-edit" data-action="edit" data-id="${escapeHtml(s.id)}" title="Edit Student">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
              <span>Edit</span>
            </button>
            <button type="button" class="btn-action btn-action-delete" data-action="delete" data-id="${escapeHtml(s.id)}" title="Delete Student">
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
  // 3. TABLE EVENT DELEGATION: EDIT & DELETE
  // =========================================================================

  if (studentTableBody) {
    studentTableBody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-action="edit"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');

      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        if (id) openEditStudentModal(id);
      } else if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (id) confirmAndDeleteStudent(id);
      }
    });
  }

  function confirmAndDeleteStudent(id) {
    const student = StorageService.findStudentById(id);
    if (!student) return;

    if (window.confirm(`Are you sure you want to permanently delete student "${student.studentName}" (${student.enrollmentNo})?`)) {
      const deleted = StudentService.deleteStudent(id);
      if (deleted) {
        showToast("Student Deleted", `Record for ${student.studentName} has been removed.`);
        renderDashboardTable();
      }
    }
  }

  // =========================================================================
  // 4. MODAL ADD / EDIT FORM
  // =========================================================================

  function openCreateStudentModal() {
    editingStudentId = null;
    modalPhotoFile = null;
    modalPhotoBase64 = null;

    if (modalForm) modalForm.reset();
    resetModalPhoto();

    if (modalTitle) modalTitle.textContent = "Add New Student";
    if (modalSubmitBtnText) modalSubmitBtnText.textContent = "Create Student";

    if (mSpecialization) {
      mSpecialization.innerHTML = '<option value="" disabled selected>Select Course First</option>';
      mSpecialization.disabled = true;
    }

    clearAllModalValidation();
    if (studentModal) studentModal.classList.add('active');
  }

  function openEditStudentModal(id) {
    const student = StorageService.findStudentById(id);
    if (!student) return;

    editingStudentId = student.id;
    modalPhotoFile = null;
    modalPhotoBase64 = student.passportPhoto || null;

    if (modalTitle) modalTitle.textContent = `Edit Student: ${student.studentName}`;
    if (modalSubmitBtnText) modalSubmitBtnText.textContent = "Save Changes";

    // Populate inputs
    if (mStudentName) mStudentName.value = student.studentName || '';
    if (mEnrollmentNo) mEnrollmentNo.value = student.enrollmentNo || '';
    if (mEmail) mEmail.value = student.email || '';
    if (mMobile) mMobile.value = student.mobileNumber || '';
    if (mDob) mDob.value = student.dob || '';
    if (mAge) mAge.value = student.age || '';
    if (mAddress) mAddress.value = student.address || '';
    if (mCity) mCity.value = student.city || '';
    if (mState) mState.value = student.state || '';

    // Radio
    const genderRadio = document.querySelector(`input[name="modal_gender"][value="${student.gender}"]`);
    if (genderRadio) genderRadio.checked = true;

    // Course & Specialization
    if (mCourse) {
      mCourse.value = student.course || '';
      updateModalSpecializations(student.course, student.specialization);
    }

    // Semester
    if (mSemester) mSemester.value = student.semester || '';

    // Skills
    const skillVals = Array.isArray(student.skills) ? student.skills : [];
    document.querySelectorAll('#m_skillsContainer input[name="skills"]').forEach(cb => {
      cb.checked = skillVals.includes(cb.value);
    });

    // Hobbies
    const hobbyVals = Array.isArray(student.hobbies) ? student.hobbies : [];
    document.querySelectorAll('#m_hobbiesContainer input[name="hobbies"]').forEach(cb => {
      cb.checked = hobbyVals.includes(cb.value);
    });

    // Photo
    if (student.passportPhoto) {
      setModalPhotoPreview(student.passportPhoto, student.photoFileName);
    } else {
      resetModalPhoto();
    }

    clearAllModalValidation();
    if (studentModal) studentModal.classList.add('active');
  }

  function closeStudentModal() {
    if (studentModal) studentModal.classList.remove('active');
    editingStudentId = null;
  }

  if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', openCreateStudentModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeStudentModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeStudentModal);

  // Close modal when clicking on backdrop
  if (studentModal) {
    studentModal.addEventListener('click', (e) => {
      if (e.target === studentModal) closeStudentModal();
    });
  }

  // Modal Real-time validation
  function collectModalData() {
    const selectedGender = document.querySelector('input[name="modal_gender"]:checked');
    const selectedSkills = Array.from(document.querySelectorAll('#m_skillsContainer input[name="skills"]:checked')).map(cb => cb.value);
    const selectedHobbies = Array.from(document.querySelectorAll('#m_hobbiesContainer input[name="hobbies"]:checked')).map(cb => cb.value);

    return {
      studentName: mStudentName ? mStudentName.value : '',
      enrollmentNo: mEnrollmentNo ? mEnrollmentNo.value : '',
      email: mEmail ? mEmail.value : '',
      mobileNumber: mMobile ? mMobile.value : '',
      dob: mDob ? mDob.value : '',
      age: mAge ? mAge.value : '',
      gender: selectedGender ? selectedGender.value : '',
      course: mCourse ? mCourse.value : '',
      specialization: mSpecialization ? mSpecialization.value : '',
      semester: mSemester ? mSemester.value : '',
      address: mAddress ? mAddress.value : '',
      city: mCity ? mCity.value : '',
      state: mState ? mState.value : '',
      skills: selectedSkills,
      hobbies: selectedHobbies,
      photo: modalPhotoFile || modalPhotoBase64 || null,
      photoFileName: modalPhotoFile ? modalPhotoFile.name : (mPreviewFileName ? mPreviewFileName.textContent : null)
    };
  }

  function triggerModalFieldValidation(fieldId) {
    const data = collectModalData();
    const isEdit = editingStudentId !== null;
    const result = ValidationEngine.validateField(fieldId, data[fieldId], data, isEdit, editingStudentId);

    const errorEl = document.getElementById(`m_error-${fieldId}`);
    const inputEl = document.getElementById(`m_${fieldId}`);

    if (errorEl) {
      errorEl.textContent = result.isValid ? '' : result.message;
      if (result.isValid) errorEl.classList.remove('visible');
      else errorEl.classList.add('visible');
    }

    if (inputEl) {
      if (result.isValid) {
        inputEl.classList.remove('is-invalid');
        if (inputEl.value && String(inputEl.value).trim() !== '') inputEl.classList.add('is-valid');
      } else {
        inputEl.classList.add('is-invalid');
        inputEl.classList.remove('is-valid');
      }
    }
    return result.isValid;
  }

  function clearAllModalValidation() {
    document.querySelectorAll('.modal-validation-message').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
    document.querySelectorAll('#modalStudentForm .form-control').forEach(el => {
      el.classList.remove('is-invalid');
      el.classList.remove('is-valid');
    });
  }

  // Modal input listeners
  if (mStudentName) {
    mStudentName.addEventListener('input', () => triggerModalFieldValidation('studentName'));
    mStudentName.addEventListener('blur', () => triggerModalFieldValidation('studentName'));
  }

  if (mEnrollmentNo) {
    mEnrollmentNo.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
      triggerModalFieldValidation('enrollmentNo');
    });
    mEnrollmentNo.addEventListener('blur', () => triggerModalFieldValidation('enrollmentNo'));
  }

  if (mEmail) {
    mEmail.addEventListener('input', () => triggerModalFieldValidation('email'));
    mEmail.addEventListener('blur', () => triggerModalFieldValidation('email'));
  }

  if (mMobile) {
    mMobile.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      triggerModalFieldValidation('mobileNumber');
    });
    mMobile.addEventListener('blur', () => triggerModalFieldValidation('mobileNumber'));
  }

  if (mDob) {
    mDob.addEventListener('change', () => {
      const calcAge = ValidationEngine.calculateAge(mDob.value);
      if (mAge) mAge.value = calcAge !== null && !isNaN(calcAge) ? calcAge : '';
      triggerModalFieldValidation('dob');
      triggerModalFieldValidation('age');
    });
    mDob.addEventListener('blur', () => {
      triggerModalFieldValidation('dob');
      triggerModalFieldValidation('age');
    });
  }

  if (mCourse) {
    mCourse.addEventListener('change', () => {
      updateModalSpecializations(mCourse.value);
      triggerModalFieldValidation('course');
    });
  }

  if (mSpecialization) mSpecialization.addEventListener('change', () => triggerModalFieldValidation('specialization'));
  if (mSemester) mSemester.addEventListener('change', () => triggerModalFieldValidation('semester'));
  if (mAddress) mAddress.addEventListener('input', () => triggerModalFieldValidation('address'));
  if (mCity) mCity.addEventListener('input', () => triggerModalFieldValidation('city'));
  if (mState) mState.addEventListener('input', () => triggerModalFieldValidation('state'));

  document.querySelectorAll('input[name="modal_gender"]').forEach(r => {
    r.addEventListener('change', () => triggerModalFieldValidation('gender'));
  });

  if (mSkillsContainer) mSkillsContainer.addEventListener('change', () => triggerModalFieldValidation('skills'));
  if (mHobbiesContainer) mHobbiesContainer.addEventListener('change', () => triggerModalFieldValidation('hobbies'));

  // Modal Photo Handling
  if (mBtnChoosePhoto && mPhotoInput) {
    mBtnChoosePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      mPhotoInput.click();
    });
  }

  if (mPhotoDropZone && mPhotoInput) {
    mPhotoDropZone.addEventListener('click', () => mPhotoInput.click());
    mPhotoDropZone.addEventListener('dragover', (e) => { e.preventDefault(); mPhotoDropZone.classList.add('dragover'); });
    mPhotoDropZone.addEventListener('dragleave', () => mPhotoDropZone.classList.remove('dragover'));
    mPhotoDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      mPhotoDropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) processModalPhoto(e.dataTransfer.files[0]);
    });
  }

  if (mPhotoInput) {
    mPhotoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) processModalPhoto(e.target.files[0]);
    });
  }

  if (mBtnRemovePhoto) {
    mBtnRemovePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      resetModalPhoto();
      mPhotoInput.click();
    });
  }

  function processModalPhoto(file) {
    modalPhotoFile = file;
    const res = ValidationEngine.validateField('photo', file);
    if (!res.isValid) {
      showModalError('photo', res.message);
      resetModalPhoto();
      return;
    }
    clearModalError('photo');

    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const formattedSize = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      modalPhotoBase64 = event.target.result;
      if (mPhotoPreviewImg) mPhotoPreviewImg.src = event.target.result;
      if (mPreviewFileName) mPreviewFileName.textContent = file.name;
      if (mPreviewFileSize) mPreviewFileSize.textContent = formattedSize;

      if (mUploadPrompt) mUploadPrompt.style.display = 'none';
      if (mPhotoPreviewContainer) mPhotoPreviewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  function resetModalPhoto() {
    modalPhotoFile = null;
    modalPhotoBase64 = null;
    if (mPhotoInput) mPhotoInput.value = '';
    if (mPhotoPreviewImg) mPhotoPreviewImg.src = '';
    if (mPreviewFileName) mPreviewFileName.textContent = '';
    if (mPreviewFileSize) mPreviewFileSize.textContent = '';
    if (mPhotoPreviewContainer) mPhotoPreviewContainer.style.display = 'none';
    if (mUploadPrompt) mUploadPrompt.style.display = 'flex';
  }

  function setModalPhotoPreview(base64Url, fileName = 'student_photo.jpg') {
    modalPhotoBase64 = base64Url;
    modalPhotoFile = null;
    if (mPhotoPreviewImg) mPhotoPreviewImg.src = base64Url;
    if (mPreviewFileName) mPreviewFileName.textContent = fileName || 'Photo Stored';
    if (mPreviewFileSize) mPreviewFileSize.textContent = 'Existing Image';
    if (mUploadPrompt) mUploadPrompt.style.display = 'none';
    if (mPhotoPreviewContainer) mPhotoPreviewContainer.style.display = 'flex';
  }

  function showModalError(fieldId, msg) {
    const errorEl = document.getElementById(`m_error-${fieldId}`);
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
    }
  }

  function clearModalError(fieldId) {
    const errorEl = document.getElementById(`m_error-${fieldId}`);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  // Modal Form Submission
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = collectModalData();
      const isEdit = editingStudentId !== null;

      // Validate all fields
      let isAllValid = true;
      let firstInvalidId = null;

      Object.keys(FORM_CONFIG.fields).forEach(fieldId => {
        const valRes = ValidationEngine.validateField(fieldId, formData[fieldId], formData, isEdit, editingStudentId);
        const errorEl = document.getElementById(`m_error-${fieldId}`);
        const inputEl = document.getElementById(`m_${fieldId}`);

        if (!valRes.isValid) {
          isAllValid = false;
          if (!firstInvalidId) firstInvalidId = fieldId;
          if (errorEl) {
            errorEl.textContent = valRes.message;
            errorEl.classList.add('visible');
          }
          if (inputEl) inputEl.classList.add('is-invalid');
        } else {
          if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('visible');
          }
          if (inputEl) {
            inputEl.classList.remove('is-invalid');
            if (inputEl.value) inputEl.classList.add('is-valid');
          }
        }
      });

      if (!isAllValid) {
        if (firstInvalidId) {
          const target = document.getElementById(`m_${firstInvalidId}`) || document.getElementById(`m_group-${firstInvalidId}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof target.focus === 'function') target.focus();
          }
        }
        return;
      }

      // Prepare Photo Data
      let photoDataUrl = modalPhotoBase64;
      if (modalPhotoFile) {
        try {
          photoDataUrl = await StudentService.convertFileToBase64(modalPhotoFile);
        } catch (err) {
          console.error("Photo conversion failed", err);
          return;
        }
      }

      if (isEdit) {
        const updated = StudentService.updateStudent(editingStudentId, formData, photoDataUrl);
        if (updated) {
          showToast("Student Updated", `Record for ${updated.studentName} (${updated.enrollmentNo}) updated.`);
        }
      } else {
        const created = StudentService.createStudent(formData, photoDataUrl);
        if (created) {
          showToast("Student Created", `Record for ${created.studentName} (${created.enrollmentNo}) added.`);
        }
      }

      closeStudentModal();
      renderDashboardTable();
    });
  }

  // =========================================================================
  // 5. TOOLBAR SEARCH, FILTER & LOGOUT
  // =========================================================================

  if (searchInput) searchInput.addEventListener('input', renderDashboardTable);
  if (filterCourseSelect) filterCourseSelect.addEventListener('change', renderDashboardTable);
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (filterCourseSelect) filterCourseSelect.value = 'all';
      renderDashboardTable();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      StorageService.setAdminLoggedIn(false);
      window.location.href = 'login.html';
    });
  }

  // Toast helper
  function showToast(title, msg) {
    if (toastTitle) toastTitle.textContent = title;
    if (toastDesc) toastDesc.textContent = msg;
    if (toastNotification) {
      toastNotification.classList.add('show');
      setTimeout(() => toastNotification.classList.remove('show'), 4000);
    }
  }

  if (closeToastBtn && toastNotification) {
    closeToastBtn.addEventListener('click', () => toastNotification.classList.remove('show'));
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

  initDashboard();
});
