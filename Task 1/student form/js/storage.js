/**
 * storage.js - LocalStorage Abstraction Layer & Auth Management
 * Manages all CRUD operations with browser's localStorage and admin sessions.
 */

const STORAGE_KEY = "students_data";
const AUTH_KEY = "sms_admin_auth";
const RECENT_STUDENT_KEY = "sms_recent_student_id";

const StorageService = {
  /**
   * Retrieves all students from localStorage
   * @returns {Array} List of student objects
   */
  getStudents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Storage read error: Corrupted data detected in localStorage.", error);
      return [];
    }
  },

  /**
   * Saves the entire array of students to localStorage
   * @param {Array} students Array of student objects
   * @returns {boolean} Success status
   */
  saveStudents(students) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        alert("Storage limit reached! Please delete older student records or use smaller photos.");
      }
      console.error("Storage write error: Unable to save students to localStorage.", error);
      return false;
    }
  },

  /**
   * Finds a student by their unique ID
   * @param {string} id Unique student ID
   * @returns {Object|null} Student object or null
   */
  findStudentById(id) {
    if (!id) return null;
    const students = this.getStudents();
    return students.find(s => s.id === id) || null;
  },

  /**
   * Finds a student by their Enrollment Number
   * @param {string} enrollmentNo Enrollment number to check
   * @returns {Object|null} Student object or null
   */
  findStudentByEnrollment(enrollmentNo) {
    if (!enrollmentNo) return null;
    const cleanNo = enrollmentNo.trim().toLowerCase();
    const students = this.getStudents();
    return students.find(s => s.enrollmentNo && s.enrollmentNo.trim().toLowerCase() === cleanNo) || null;
  },

  /**
   * Finds a student by their Email address
   * @param {string} email Email address to check
   * @returns {Object|null} Student object or null
   */
  findStudentByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const students = this.getStudents();
    return students.find(s => s.email && s.email.trim().toLowerCase() === cleanEmail) || null;
  },

  /**
   * Adds a new student record
   * @param {Object} student Student object
   * @returns {Object|null} Created student or null on error
   */
  addStudent(student) {
    const students = this.getStudents();
    students.unshift(student);
    const saved = this.saveStudents(students);
    return saved ? student : null;
  },

  /**
   * Updates an existing student record by ID
   * @param {string} id Unique student ID
   * @param {Object} updatedData Updated fields
   * @returns {Object|null} Updated student object or null
   */
  updateStudent(id, updatedData) {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) {
      console.error(`Student with ID ${id} not found for update.`);
      return null;
    }

    students[index] = {
      ...students[index],
      ...updatedData,
      id: id,
      updatedAt: new Date().toISOString()
    };

    const saved = this.saveStudents(students);
    return saved ? students[index] : null;
  },

  /**
   * Deletes a student record by ID
   * @param {string} id Unique student ID
   * @returns {boolean} True if deleted, false otherwise
   */
  deleteStudent(id) {
    const students = this.getStudents();
    const filtered = students.filter(s => s.id !== id);
    if (filtered.length === students.length) {
      return false;
    }
    return this.saveStudents(filtered);
  },

  // =========================================================================
  // Auth Session & Recent Registration Helpers
  // =========================================================================

  /**
   * Sets admin session
   */
  setAdminLoggedIn(isLoggedIn = true) {
    if (isLoggedIn) {
      sessionStorage.setItem(AUTH_KEY, "true");
    } else {
      sessionStorage.removeItem(AUTH_KEY);
    }
  },

  /**
   * Checks if admin is currently authenticated
   * @returns {boolean}
   */
  isAdminLoggedIn() {
    return sessionStorage.getItem(AUTH_KEY) === "true";
  },

  /**
   * Stores the ID of the most recently registered student
   * @param {string} studentId 
   */
  setRecentStudentId(studentId) {
    sessionStorage.setItem(RECENT_STUDENT_KEY, studentId);
  },

  /**
   * Gets the ID of the most recently registered student
   * @returns {string|null}
   */
  getRecentStudentId() {
    return sessionStorage.getItem(RECENT_STUDENT_KEY);
  }
};
