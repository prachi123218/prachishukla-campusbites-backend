/**
 * ==============================================================================
 * Student Management System - Pure JavaScript & JSON CRUD Operations
 * Nirman Club Task 1
 * ==============================================================================
 * 
 * ⚙️ CRUD REQUIREMENTS IMPLEMENTED:
 * 1. CREATE:
 *    • Get data from the form.
 *    • Validate the data.
 *    • Create a student object.
 *    • Add the student to an array.
 *    • Display the student in the table.
 * 
 * 2. READ:
 *    • Display all students in a table.
 *    • Show student details and action buttons.
 *    • Each student should have Edit and Delete buttons.
 * 
 * 3. UPDATE:
 *    • Click Edit.
 *    • Load the selected student's data back into the form.
 *    • Allow the user to modify the data.
 *    • Validate the updated data.
 *    • Update the student record.
 *    • Display the updated data in the table.
 * 
 * 4. DELETE:
 *    • Click Delete.
 *    • Remove the selected student.
 *    • Display the updated data in the table.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// Data State & JSON Storage Key
// ------------------------------------------------------------------------------
let students = [];           // Array of student objects
let editIndex = -1;          // -1 = Add mode (CREATE), >= 0 = Edit mode (UPDATE)
let currentPhotoBase64 = ""; // Holds Base64 photo string if uploaded
const STORAGE_KEY = "nirman_student_records_json";
const AUTH_KEY = "sms_admin_auth";
const RECENT_STUDENT_KEY = "sms_recent_student_id";
const PAGE = document.body && document.body.dataset.page ? document.body.dataset.page : "form";

// Default sample data so table is populated on initial run
const initialSampleStudents = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    mobile: "9876543210",
    gender: "Male",
    dob: "2003-05-14",
    course: "B.Tech Computer Science",
    address: "Flat 402, Green Valley Heights, MG Road, Pune",
    photo: ""
  },
  {
    name: "Priya Patel",
    email: "priya.patel@example.com",
    mobile: "9123456780",
    gender: "Female",
    dob: "2004-08-22",
    course: "BCA",
    address: "15 Nilkanth Park, SG Highway, Ahmedabad",
    photo: ""
  },
  {
    name: "Rohan Verma",
    email: "rohan.verma@example.com",
    mobile: "9988776655",
    gender: "Male",
    dob: "2002-11-10",
    course: "MCA",
    address: "88 Lakeview Apartments, Sector 14, Gurgaon",
    photo: ""
  }
];

// ------------------------------------------------------------------------------
// JSON LocalStorage Synchronization
// ------------------------------------------------------------------------------

/**
 * Loads student records from localStorage JSON.
 * If empty, initializes with default sample data.
 */
function loadStudentsFromJSON() {
  const jsonString = localStorage.getItem(STORAGE_KEY);
  if (jsonString) {
    try {
      students = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON records from localStorage:", e);
      students = [...initialSampleStudents];
      saveStudentsToJSON();
    }
  } else {
    students = [...initialSampleStudents];
    saveStudentsToJSON();
  }
}

/**
 * Saves current students array to localStorage as a JSON string.
 */
function saveStudentsToJSON() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// ------------------------------------------------------------------------------
// DOM Element References
// ------------------------------------------------------------------------------
let studentForm;
let studentNameInput;
let emailInput;
let mobileNumberInput;
let dobInput;
let courseInput;
let addressInput;
let photoInput;
let photoPreviewContainer;
let photoPreviewImg;
let removePhotoBtn;
let submitBtn;
let submitBtnText;
let resetBtn;
let cancelEditBtn;
let editModeBadge;
let formCardTitle;
let studentTableBody;
let emptyState;
let totalCountBadge;
let searchInput;
let filterCourseSelect;
let toastElement;
let toastMessageElement;

// ------------------------------------------------------------------------------
// Form Validation Logic
// ------------------------------------------------------------------------------

/**
 * Helper to show an error message for an input field.
 */
function showError(fieldName, message) {
  const errorEl = document.getElementById("error-" + fieldName);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("visible");
  }
  const inputEl = document.getElementById(fieldName);
  if (inputEl) {
    inputEl.classList.add("is-invalid");
    inputEl.classList.remove("is-valid");
  }
}

/**
 * Helper to clear error state for an input field.
 */
function clearError(fieldName) {
  const errorEl = document.getElementById("error-" + fieldName);
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("visible");
  }
  const inputEl = document.getElementById(fieldName);
  if (inputEl) {
    inputEl.classList.remove("is-invalid");
  }
}

/**
 * Clears all validation error messages on the form.
 */
function clearAllErrors() {
  const fields = ["studentName", "email", "mobileNumber", "gender", "dob", "course", "address", "photo"];
  fields.forEach(clearError);
}

/**
 * Validates all student form fields according to assignment requirements.
 * Returns true if valid, false otherwise.
 */
function validateData(data) {
  clearAllErrors();
  let isValid = true;

  // 1. Student Name: Required, letters/spaces only, 2-50 chars
  const nameRegex = /^[a-zA-Z\s.'-]+$/;
  if (!data.name) {
    showError("studentName", "Student name is required.");
    isValid = false;
  } else if (data.name.length < 2 || data.name.length > 50) {
    showError("studentName", "Name must be between 2 and 50 characters.");
    isValid = false;
  } else if (!nameRegex.test(data.name)) {
    showError("studentName", "Name can only contain letters and spaces.");
    isValid = false;
  }

  // 2. Email: Required, valid email format regex, unique check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email) {
    showError("email", "Email address is required.");
    isValid = false;
  } else if (!emailRegex.test(data.email)) {
    showError("email", "Please enter a valid email (e.g. student@college.edu).");
    isValid = false;
  } else {
    // Uniqueness check (ignore current student if updating)
    const emailExists = students.some((s, i) => i !== editIndex && s.email.toLowerCase() === data.email.toLowerCase());
    if (emailExists) {
      showError("email", "This email is already registered with another student.");
      isValid = false;
    }
  }

  // 3. Mobile Number: Required, exactly 10 digits
  const mobileRegex = /^[0-9]{10}$/;
  if (!data.mobile) {
    showError("mobileNumber", "Mobile number is required.");
    isValid = false;
  } else if (!mobileRegex.test(data.mobile)) {
    showError("mobileNumber", "Mobile number must be exactly 10 digits.");
    isValid = false;
  }

  // 4. Gender: Required, Radio (Male/Female/Other)
  if (!data.gender) {
    showError("gender", "Please select a gender.");
    isValid = false;
  }

  // 5. Date of Birth: Required, valid date, not future date, at least 15 years old
  if (!data.dob) {
    showError("dob", "Date of birth is required.");
    isValid = false;
  } else {
    const selectedDate = new Date(data.dob);
    const today = new Date();
    if (selectedDate >= today) {
      showError("dob", "Date of birth cannot be in the future.");
      isValid = false;
    } else {
      let age = today.getFullYear() - selectedDate.getFullYear();
      const monthDiff = today.getMonth() - selectedDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
        age--;
      }
      if (age < 15 || age > 75) {
        showError("dob", "Student age must be between 15 and 75 years.");
        isValid = false;
      }
    }
  }

  // 6. Course: Required, dropdown selection
  if (!data.course || data.course === "") {
    showError("course", "Please select a course from the dropdown.");
    isValid = false;
  }

  // 7. Address: Required, textarea, min 5 chars
  if (!data.address) {
    showError("address", "Address is required.");
    isValid = false;
  } else if (data.address.length < 5) {
    showError("address", "Please provide a more detailed address (min 5 characters).");
    isValid = false;
  }

  return isValid;
}

/**
 * Extracts raw data values from the form.
 */
function getFormData() {
  const genderRadio = document.querySelector('input[name="gender"]:checked');
  return {
    name: studentNameInput.value.trim(),
    email: emailInput.value.trim(),
    mobile: mobileNumberInput.value.trim(),
    gender: genderRadio ? genderRadio.value : "",
    dob: dobInput.value,
    course: courseInput.value,
    address: addressInput.value.trim(),
    photo: currentPhotoBase64
  };
}

// ------------------------------------------------------------------------------
// 1. CREATE OPERATION
// ------------------------------------------------------------------------------

/**
 * Handles adding a new student to the system.
 * • Get data from the form.
 * • Validate the data.
 * • Create a student object.
 * • Add the student to an array.
 * • Display the student in the table.
 */
function handleCreateStudent(formData) {
  // Create student object
  const newStudent = {
    id: Date.now(),
    name: formData.name,
    email: formData.email,
    mobile: formData.mobile,
    gender: formData.gender,
    dob: formData.dob,
    course: formData.course,
    address: formData.address,
    photo: currentPhotoBase64 || ""
  };

  // Add the student to an array
  students.push(newStudent);

  // Save to JSON in localStorage
  saveStudentsToJSON();

  if (PAGE === "form") {
    sessionStorage.setItem(RECENT_STUDENT_KEY, String(newStudent.id));
    window.location.href = "welcome.html?id=" + encodeURIComponent(newStudent.id);
    return;
  }

  displayStudents();
  resetForm();
  showToast("Success", "New student '" + newStudent.name + "' has been added successfully!");
}

// ------------------------------------------------------------------------------
// 2. READ OPERATION
// ------------------------------------------------------------------------------

/**
 * Displays all students in a table.
 * • Show student details and action buttons.
 * • Each student should have Edit and Delete buttons.
 */
function displayStudents(recordsToDisplay) {
  if (!studentTableBody) return;

  const list = recordsToDisplay || getFilteredStudents();

  // Update total badge count
  if (totalCountBadge) {
    totalCountBadge.textContent = students.length + (students.length === 1 ? " record" : " records");
  }

  // Clear existing table content
  studentTableBody.innerHTML = "";

  // Show empty state if no students
  if (list.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  // Loop through students and create rows
  list.forEach(student => {
    // Find original index in master students array
    const originalIndex = students.indexOf(student);

    const row = document.createElement("tr");
    row.className = "student-row";
    if (originalIndex === editIndex) {
      row.style.backgroundColor = "#EFF6FF"; // Highlight row currently being edited
    }

    // Avatar initials or photo img
    let avatarHTML = "";
    if (student.photo) {
      avatarHTML = `<img src="${student.photo}" alt="${escapeHtml(student.name)}" class="student-avatar-img" />`;
    } else {
      const initials = getInitials(student.name);
      avatarHTML = `<span class="student-avatar-initials">${initials}</span>`;
    }

    // Format DOB to local readable string (DD/MM/YYYY)
    let formattedDOB = student.dob;
    if (student.dob) {
      const parts = student.dob.split("-");
      if (parts.length === 3) {
        formattedDOB = parts[2] + "/" + parts[1] + "/" + parts[0];
      }
    }

    const genderClass = student.gender ? student.gender.toLowerCase() : "other";

    row.innerHTML = `
      <td>
        <div class="student-profile-cell">
          <div class="student-avatar-wrap">
            ${avatarHTML}
          </div>
          <div class="student-info-meta">
            <span class="student-name-text">${escapeHtml(student.name)}</span>
          </div>
        </div>
      </td>
      <td>
        <div class="contact-meta">
          <span class="contact-email">${escapeHtml(student.email)}</span>
        </div>
      </td>
      <td>
        <span class="contact-mobile">${escapeHtml(student.mobile)}</span>
      </td>
      <td>
        <span class="gender-pill ${genderClass}">${escapeHtml(student.gender)}</span>
      </td>
      <td>
        <span class="dob-text">${formattedDOB}</span>
      </td>
      <td>
        <span class="course-badge">${escapeHtml(student.course)}</span>
      </td>
      <td>
        <span class="address-cell" title="${escapeHtml(student.address)}">${escapeHtml(student.address)}</span>
      </td>
      <td class="text-right">
        <div class="table-actions-group">
          <!-- 3. UPDATE: Click Edit Button -->
          <button type="button" class="btn-action btn-action-edit" onclick="editStudent(${originalIndex})" title="Edit Student">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span>Edit</span>
          </button>

          <!-- 4. DELETE: Click Delete Button -->
          <button type="button" class="btn-action btn-action-delete" onclick="deleteStudent(${originalIndex})" title="Delete Student">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </td>
    `;

    studentTableBody.appendChild(row);
  });
}

// ------------------------------------------------------------------------------
// 3. UPDATE OPERATION
// ------------------------------------------------------------------------------

/**
 * Click Edit:
 * • Load the selected student's data back into the form.
 * • Allow the user to modify the data.
 * • Set editIndex to track the active record.
 */
function editStudent(index) {
  if (PAGE !== "dashboard") return;
  if (index < 0 || index >= students.length) return;

  const student = students[index];
  editIndex = index;

  const adminEditCard = document.getElementById("adminEditCard");
  if (adminEditCard) adminEditCard.style.display = "block";

  // Clear any existing errors
  clearAllErrors();

  // Load the selected student's data back into the form
  studentNameInput.value = student.name || "";
  emailInput.value = student.email || "";
  mobileNumberInput.value = student.mobile || "";
  dobInput.value = student.dob || "";
  courseInput.value = student.course || "";
  addressInput.value = student.address || "";

  // Set gender radio
  const genderRadio = document.querySelector(`input[name="gender"][value="${student.gender}"]`);
  if (genderRadio) {
    genderRadio.checked = true;
  }

  // Load student photo if present
  currentPhotoBase64 = student.photo || "";
  if (currentPhotoBase64) {
    photoPreviewImg.src = currentPhotoBase64;
    photoPreviewContainer.style.display = "flex";
  } else {
    photoPreviewContainer.style.display = "none";
    photoPreviewImg.src = "";
  }

  // Switch form UI to Edit Mode
  submitBtnText.textContent = "Update Student";
  submitBtn.classList.add("btn-update-mode");
  cancelEditBtn.style.display = "inline-flex";

  if (editModeBadge) {
    editModeBadge.textContent = "Editing Student #" + (index + 1) + ": " + student.name;
    editModeBadge.style.display = "inline-flex";
  }
  if (formCardTitle) {
    formCardTitle.textContent = "Edit Student Information";
  }

  // Highlight active row in table
  displayStudents();

  // Smoothly scroll to the form card for easy editing
  studentForm.scrollIntoView({ behavior: "smooth", block: "start" });
  studentNameInput.focus();
}

/**
 * Handles saving the modified student data:
 * • Validate the updated data.
 * • Update the student record in array.
 * • Save to JSON.
 * • Display the updated data in the table.
 */
function handleUpdateStudent(formData) {
  if (editIndex < 0 || editIndex >= students.length) return;

  // Update the student record in array
  students[editIndex] = {
    ...students[editIndex],
    name: formData.name,
    email: formData.email,
    mobile: formData.mobile,
    gender: formData.gender,
    dob: formData.dob,
    course: formData.course,
    address: formData.address,
    photo: currentPhotoBase64 || students[editIndex].photo || ""
  };

  // Save to JSON (localStorage)
  saveStudentsToJSON();

  // Reset form and UI back to Add mode
  resetForm();

  // Display the updated data in the table
  displayStudents();

  // Show success toast
  showToast("Updated", "Student record has been updated successfully!");
}

/**
 * Cancels current edit mode and resets the form.
 */
function cancelEdit() {
  resetForm();
  displayStudents();
}

// ------------------------------------------------------------------------------
// 4. DELETE OPERATION
// ------------------------------------------------------------------------------

/**
 * Click Delete:
 * • Confirm deletion.
 * • Remove the selected student from array.
 * • Save to JSON.
 * • Display the updated data in the table.
 */
function deleteStudent(index) {
  if (index < 0 || index >= students.length) return;

  const studentToDelete = students[index];
  const confirmDelete = confirm("Are you sure you want to delete student: " + studentToDelete.name + "?");
  if (!confirmDelete) return;

  // If the student currently being deleted is in edit mode, cancel edit mode
  if (editIndex === index) {
    resetForm();
  } else if (editIndex > index) {
    editIndex--; // Adjust index pointer
  }

  // Remove the selected student from array
  students.splice(index, 1);

  // Save updated array to JSON (localStorage)
  saveStudentsToJSON();

  // Display the updated data in the table
  displayStudents();

  // Feedback toast
  showToast("Deleted", "Student '" + studentToDelete.name + "' has been removed.");
}

// ------------------------------------------------------------------------------
// Form Submission & Reset Orchestration
// ------------------------------------------------------------------------------

/**
 * Form Submit Event Handler:
 * Branches to CREATE or UPDATE depending on editIndex.
 */
function handleFormSubmit(e) {
  e.preventDefault();

  // 1. Get data from the form
  const formData = getFormData();

  // 2. Validate the data
  const isValid = validateData(formData);
  if (!isValid) {
    return;
  }

  // Branch based on mode
  if (editIndex === -1) {
    // 1. CREATE
    handleCreateStudent(formData);
  } else {
    // 3. UPDATE
    handleUpdateStudent(formData);
  }
}

/**
 * Resets form fields, errors, photo preview, and restores Add Student mode.
 */
function resetForm() {
  studentForm.reset();
  clearAllErrors();
  editIndex = -1;
  currentPhotoBase64 = "";

  if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
  if (photoPreviewImg) photoPreviewImg.src = "";
  if (photoInput) photoInput.value = "";

  submitBtnText.textContent = "Add Student";
  submitBtn.classList.remove("btn-update-mode");
  cancelEditBtn.style.display = "none";

  if (editModeBadge) editModeBadge.style.display = "none";
  if (formCardTitle) formCardTitle.textContent = "Student Registration";

  const adminEditCard = document.getElementById("adminEditCard");
  if (adminEditCard && PAGE === "dashboard") {
    adminEditCard.style.display = "none";
  }
}

// ------------------------------------------------------------------------------
// Photo File Upload Handling (Base64)
// ------------------------------------------------------------------------------

function handlePhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    showError("photo", "Please select a valid image file (JPG, PNG, WebP).");
    photoInput.value = "";
    return;
  }

  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showError("photo", "Image size must be less than 2 MB.");
    photoInput.value = "";
    return;
  }

  clearError("photo");

  // Read image as Base64 Data URL
  const reader = new FileReader();
  reader.onload = function(event) {
    currentPhotoBase64 = event.target.result;
    photoPreviewImg.src = currentPhotoBase64;
    photoPreviewContainer.style.display = "flex";
  };
  reader.readAsDataURL(file);
}

function handleRemovePhoto() {
  currentPhotoBase64 = "";
  photoInput.value = "";
  photoPreviewImg.src = "";
  photoPreviewContainer.style.display = "none";
}

// ------------------------------------------------------------------------------
// Search & Filter Operations
// ------------------------------------------------------------------------------

function getFilteredStudents() {
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectedCourse = filterCourseSelect ? filterCourseSelect.value : "all";

  return students.filter(student => {
    // Search match
    const matchesSearch =
      !searchTerm ||
      student.name.toLowerCase().includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm) ||
      student.mobile.includes(searchTerm) ||
      student.address.toLowerCase().includes(searchTerm);

    // Course match
    const matchesCourse =
      selectedCourse === "all" ||
      student.course === selectedCourse;

    return matchesSearch && matchesCourse;
  });
}

function handleSearchOrFilter() {
  displayStudents();
}

// ------------------------------------------------------------------------------
// Helper Utilities
// ------------------------------------------------------------------------------

function getInitials(name) {
  if (!name) return "ST";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(title, message) {
  if (!toastElement) return;
  const titleEl = document.getElementById("toastTitle");
  if (titleEl) titleEl.textContent = title;
  if (toastMessageElement) toastMessageElement.textContent = message;

  toastElement.classList.add("visible");
  setTimeout(() => {
    toastElement.classList.remove("visible");
  }, 3500);
}

// ------------------------------------------------------------------------------
// Initialization on DOM Ready
// ------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (PAGE === "dashboard") {
    const isLoggedIn = sessionStorage.getItem(AUTH_KEY) === "true";
    if (!isLoggedIn) {
      window.location.replace("login.html");
      return;
    }
  }

  // Grab references to DOM elements
  studentForm = document.getElementById("studentForm");
  studentNameInput = document.getElementById("studentName");
  emailInput = document.getElementById("email");
  mobileNumberInput = document.getElementById("mobileNumber");
  dobInput = document.getElementById("dob");
  courseInput = document.getElementById("course");
  addressInput = document.getElementById("address");
  photoInput = document.getElementById("studentPhoto");
  photoPreviewContainer = document.getElementById("photoPreviewContainer");
  photoPreviewImg = document.getElementById("photoPreviewImg");
  removePhotoBtn = document.getElementById("btnRemovePhoto");
  submitBtn = document.getElementById("submitBtn");
  submitBtnText = document.getElementById("submitBtnText");
  resetBtn = document.getElementById("resetBtn");
  cancelEditBtn = document.getElementById("cancelEditBtn");
  editModeBadge = document.getElementById("editModeBadge");
  formCardTitle = document.getElementById("formCardTitle");
  studentTableBody = document.getElementById("studentTableBody");
  emptyState = document.getElementById("emptyState");
  totalCountBadge = document.getElementById("totalCountBadge");
  searchInput = document.getElementById("searchInput");
  filterCourseSelect = document.getElementById("filterCourse");
  toastElement = document.getElementById("toastNotification");
  toastMessageElement = document.getElementById("toastDesc");

  // Event Listeners
  if (studentForm) {
    studentForm.addEventListener("submit", handleFormSubmit);
    studentForm.addEventListener("reset", () => {
      setTimeout(resetForm, 10);
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", cancelEdit);
  }

  if (photoInput) {
    photoInput.addEventListener("change", handlePhotoSelect);
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", handleRemovePhoto);
  }

  if (searchInput) {
    searchInput.addEventListener("input", handleSearchOrFilter);
  }

  if (filterCourseSelect) {
    filterCourseSelect.addEventListener("change", handleSearchOrFilter);
  }

  const closeToastBtn = document.getElementById("closeToastBtn");
  if (closeToastBtn && toastElement) {
    closeToastBtn.addEventListener("click", () => {
      toastElement.classList.remove("visible");
    });
  }

  // Real-time error clearance on user input
  const inputs = [studentNameInput, emailInput, mobileNumberInput, dobInput, courseInput, addressInput];
  inputs.forEach(input => {
    if (input) {
      input.addEventListener("input", () => clearError(input.id));
      input.addEventListener("change", () => clearError(input.id));
    }
  });

  const genderRadios = document.querySelectorAll('input[name="gender"]');
  genderRadios.forEach(radio => {
    radio.addEventListener("change", () => clearError("gender"));
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(AUTH_KEY);
      window.location.replace("login.html");
    });
  }

  // Load existing records from JSON and display in table
  loadStudentsFromJSON();
  if (PAGE === "dashboard") {
    displayStudents();
  }
});
