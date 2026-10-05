/**
 * studentService.js - Student Business Logic & Data Transformation
 * Handles ID generation, model formatting, calculations, and photo conversion.
 */

const StudentService = {
  /**
   * Generates a clean, unique student ID (e.g. STU-001, STU-002, or sequence-based)
   * @returns {string} Unique student ID
   */
  generateStudentId() {
    const students = StorageService.getStudents();
    const existingIds = students.map(s => s.id).filter(Boolean);

    // Look for STU-XXX numeric sequence
    let maxNum = 0;
    existingIds.forEach(id => {
      const match = id.match(/^STU-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `STU-${padded}`;
  },

  /**
   * Converts a File object into a Base64 data URL
   * @param {File} file 
   * @returns {Promise<string>} Base64 string
   */
  convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Creates and stores a new student record
   * @param {Object} rawData 
   * @param {string|null} photoBase64 
   * @returns {Object} Newly created student object
   */
  createStudent(rawData, photoBase64 = null) {
    const newStudent = {
      id: this.generateStudentId(),
      studentName: rawData.studentName.trim(),
      enrollmentNo: rawData.enrollmentNo.trim().toUpperCase(),
      email: rawData.email.trim().toLowerCase(),
      mobileNumber: rawData.mobileNumber.trim(),
      dob: rawData.dob,
      age: Number(rawData.age),
      gender: rawData.gender,
      course: rawData.course,
      specialization: rawData.specialization,
      semester: Number(rawData.semester),
      address: rawData.address.trim(),
      city: rawData.city.trim(),
      state: rawData.state.trim(),
      skills: Array.isArray(rawData.skills) ? rawData.skills : [],
      hobbies: Array.isArray(rawData.hobbies) ? rawData.hobbies : [],
      passportPhoto: photoBase64 || rawData.passportPhoto || null,
      photoFileName: rawData.photoFileName || null,
      createdAt: new Date().toISOString()
    };

    return StorageService.addStudent(newStudent);
  },

  /**
   * Updates an existing student record
   * @param {string} id Student ID
   * @param {Object} rawData 
   * @param {string|null} photoBase64 
   * @returns {Object|null} Updated student object
   */
  updateStudent(id, rawData, photoBase64 = null) {
    const existing = StorageService.findStudentById(id);
    if (!existing) return null;

    const updatedData = {
      studentName: rawData.studentName.trim(),
      enrollmentNo: rawData.enrollmentNo.trim().toUpperCase(),
      email: rawData.email.trim().toLowerCase(),
      mobileNumber: rawData.mobileNumber.trim(),
      dob: rawData.dob,
      age: Number(rawData.age),
      gender: rawData.gender,
      course: rawData.course,
      specialization: rawData.specialization,
      semester: Number(rawData.semester),
      address: rawData.address.trim(),
      city: rawData.city.trim(),
      state: rawData.state.trim(),
      skills: Array.isArray(rawData.skills) ? rawData.skills : [],
      hobbies: Array.isArray(rawData.hobbies) ? rawData.hobbies : [],
      // Preserve existing photo if a new one wasn't uploaded
      passportPhoto: photoBase64 !== undefined && photoBase64 !== null ? photoBase64 : existing.passportPhoto,
      photoFileName: rawData.photoFileName || existing.photoFileName || null,
      updatedAt: new Date().toISOString()
    };

    return StorageService.updateStudent(id, updatedData);
  },

  /**
   * Deletes a student by ID
   * @param {string} id Student ID
   * @returns {boolean}
   */
  deleteStudent(id) {
    return StorageService.deleteStudent(id);
  },

  /**
   * Retrieves all students, optionally filtered by search text and course
   * @param {string} search Filter search query
   * @param {string} courseFilter Course filter
   * @returns {Array} List of matching student objects
   */
  getStudents(search = '', courseFilter = '') {
    let students = StorageService.getStudents();

    if (courseFilter && courseFilter !== 'all') {
      students = students.filter(s => s.course === courseFilter);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      students = students.filter(s => {
        return (
          (s.studentName && s.studentName.toLowerCase().includes(q)) ||
          (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.city && s.city.toLowerCase().includes(q)) ||
          (s.specialization && s.specialization.toLowerCase().includes(q))
        );
      });
    }

    return students;
  },

  /**
   * Computes statistics dashboard summary counts
   * @returns {Object} Stats breakdown
   */
  getStats() {
    const students = StorageService.getStudents();
    const uniqueCourses = new Set(students.map(s => s.course).filter(Boolean));
    const maleCount = students.filter(s => s.gender === 'Male').length;
    const femaleCount = students.filter(s => s.gender === 'Female').length;
    const otherCount = students.filter(s => s.gender === 'Other').length;

    return {
      total: students.length,
      coursesCount: uniqueCourses.size,
      maleCount,
      femaleCount,
      otherCount
    };
  }
};
