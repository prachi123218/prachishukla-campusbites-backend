/**
 * welcome.js - Welcome page for a newly registered student
 * Loads that student from localStorage and flashes their details.
 */

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "nirman_student_records_json";
  const RECENT_STUDENT_KEY = "sms_recent_student_id";

  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get("id") || sessionStorage.getItem(RECENT_STUDENT_KEY);

  const welcomeContent = document.getElementById("welcomeContent");
  const notFoundContent = document.getElementById("notFoundContent");

  if (!studentId) {
    showNotFound();
    return;
  }

  const students = loadStudents();
  const student = students.find((s) => String(s.id) === String(studentId));

  if (!student) {
    showNotFound();
    return;
  }

  renderStudentReceipt(student);

  function loadStudents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function renderStudentReceipt(s) {
    if (notFoundContent) notFoundContent.style.display = "none";
    if (welcomeContent) welcomeContent.style.display = "block";

    const heading = document.getElementById("welcomeHeading");
    if (heading) {
      heading.textContent = "Welcome, " + (s.name || "Student") + "!";
    }

    setElemText("receiptName", s.name);
    setElemText("receiptId", s.id ? "ID " + s.id : "");
    setElemText("receiptEmail", s.email);
    setElemText("receiptMobile", s.mobile);
    setElemText("receiptCourse", s.course);
    setElemText("receiptDob", formatDate(s.dob));
    setElemText("receiptGender", s.gender);
    setElemText("receiptAddress", s.address);

    const photoWrap = document.getElementById("receiptPhotoWrap");
    if (photoWrap) {
      if (s.photo) {
        photoWrap.innerHTML = '<img src="' + s.photo + '" alt="' + escapeHtml(s.name) + '" class="receipt-photo-img" />';
      } else {
        const initials = getInitials(s.name);
        photoWrap.innerHTML = '<div class="receipt-avatar-initials">' + escapeHtml(initials) + "</div>";
      }
    }

    if (welcomeContent) {
      welcomeContent.classList.remove("flash-details");
      void welcomeContent.offsetWidth;
      welcomeContent.classList.add("flash-details");
    }
    if (heading) {
      heading.classList.remove("flash-name");
      void heading.offsetWidth;
      heading.classList.add("flash-name");
    }
  }

  function showNotFound() {
    if (welcomeContent) welcomeContent.style.display = "none";
    if (notFoundContent) notFoundContent.style.display = "block";
  }

  function setElemText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || "—";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const parts = String(dateStr).split("-");
    if (parts.length === 3) {
      return parts[2] + "/" + parts[1] + "/" + parts[0];
    }
    return dateStr;
  }

  function getInitials(name) {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
