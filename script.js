// Add this as the very last lines of script.js
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log("✅ Service Worker Registered"))
      .catch(err => console.error("SW Error", err));
  }
  
// Redirect if not authenticated
if (localStorage.getItem("auth") !== "true") {
    window.location.href = "login.html";
  }
  
let allocationChart = null;
let patients = [];
const translations = {
    en: {
      addPatient: "Add Patient",
      exportJSON: "Export as JSON",
      exportCSV: "Export as CSV",
      import: "Import Patient Data",
      allocate: "Allocate Resources",
      analytics: "Allocation Analytics",
      chart: "Allocation Chart",
      clear: "Clear All Data",
    },
    bn: {
      addPatient: "রোগী যুক্ত করুন",
      exportJSON: "JSON রফতানি",
      exportCSV: "CSV রফতানি",
      import: "রোগীর ডেটা ইমপোর্ট করুন",
      allocate: "সম্পদ বরাদ্দ দিন",
      analytics: "পরিসংখ্যান বিশ্লেষণ",
      chart: "বরাদ্দ চার্ট",
      clear: "সব মুছে ফেলুন",
    }
  };
 

function addPatient() {
  const name = document.getElementById("name").value.trim();
  const severity = parseInt(document.getElementById("severity").value);
  const beds = parseInt(document.getElementById("beds").value);
  const vents = parseInt(document.getElementById("vents").value);
  const survival = parseFloat(document.getElementById("survival").value);

  if (!name || isNaN(severity) || isNaN(beds) || isNaN(vents) || isNaN(survival)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  const needsDoctor = document.getElementById("needsDoctor").checked;
patients.push({ name, severity, beds, vents, survival, needsDoctor });

  updatePatientList();
  saveToLocalStorage();
  clearForm();
}

function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("severity").value = "";
  document.getElementById("beds").value = "";
  document.getElementById("vents").value = "";
  document.getElementById("survival").value = "";
}

function updatePatientList() {
    const list = document.getElementById("patientList");
    list.innerHTML = "";
  
    patients.forEach((p, index) => {
      const card = document.createElement("div");
      card.className = "patient-card";
  
      card.innerHTML = `
        <strong>${p.name}</strong><br>
        Severity: ${p.severity}<br>
        Survival: ${p.survival}<br>
        Beds: ${p.beds}, Vents: ${p.vents}<br>
        ${p.needsDoctor ? "Doctor Required<br>" : ""}
        <button onclick="editPatient(${index})">✏️ Edit</button>
        <button onclick="deletePatient(${index})">🗑️ Delete</button>
      `;
  
      list.appendChild(card);
    });
  }
  function deletePatient(index) {
    if (confirm("Are you sure you want to delete this patient?")) {
      patients.splice(index, 1);
      updatePatientList();
      saveToLocalStorage();

    }
  }
  
  function editPatient(index) {
    const p = patients[index];
  
    document.getElementById("name").value = p.name;
    document.getElementById("severity").value = p.severity;
    document.getElementById("beds").value = p.beds;
    document.getElementById("vents").value = p.vents;
    document.getElementById("survival").value = p.survival;
    document.getElementById("needsDoctor").checked = p.needsDoctor;
  
    patients.splice(index, 1); // remove temporarily — user will re-add it
    updatePatientList();
    saveToLocalStorage();

  }
  
  

  function allocateResources() {
    const totalBeds = parseInt(document.getElementById("totalBeds").value);
    const totalVents = parseInt(document.getElementById("totalVents").value);
    const totalDoctors = parseInt(document.getElementById("totalDoctors").value);
  
    document.getElementById("allocationResult").innerHTML = "";
  
    let allocated = 0;
    let skipped = 0;
    let usedBeds = 0;
    let usedVents = 0;
    let usedDoctors = 0;
  
    const sortedPatients = [...patients].sort((a, b) => (b.survival * b.severity) - (a.survival * a.severity));
  
    sortedPatients.forEach((p) => {
      const canAllocate = (
        usedBeds + p.beds <= totalBeds &&
        usedVents + p.vents <= totalVents &&
        (!p.needsDoctor || usedDoctors + 1 <= totalDoctors)
      );
  
      const card = document.createElement("div");
      card.className = "patient-card " + (canAllocate ? "allocated" : "skipped");
      card.innerHTML = `
        <strong>${p.name}</strong><br>
        Severity: ${p.severity}<br>
        Survival: ${p.survival}<br>
        Beds: ${p.beds}, Vents: ${p.vents}<br>
        ${p.needsDoctor ? "Doctor Required<br>" : ""}
        ${canAllocate ? "✅ Allocated" : "❌ Skipped"}
      `;
  
      if (canAllocate) {
        usedBeds += p.beds;
        usedVents += p.vents;
        if (p.needsDoctor) usedDoctors++;
        allocated++;
      } else {
        skipped++;
      }
  
      document.getElementById("allocationResult").appendChild(card);
    });
  
    document.getElementById("analyticsPanel").innerHTML = `
      Total Patients: ${patients.length}<br>
      ✅ Allocated: ${allocated} | ❌ Skipped: ${skipped}<br>
      🛏 Beds Remaining: ${totalBeds - usedBeds}<br>
      💨 Vents Remaining: ${totalVents - usedVents}<br>
      🧑‍⚕️ Doctors Remaining: ${totalDoctors - usedDoctors}
    `;
    updateChart(allocated, skipped);
    function updateChart(allocated, skipped) {
        const ctx = document.getElementById('allocationChart').getContext('2d');
        const data = {
          labels: ['Allocated', 'Skipped'],
          datasets: [{
            label: 'Patients',
            data: [allocated, skipped],
            backgroundColor: ['#28a745', '#dc3545'],
          }]
        };
      
        const config = {
          type: 'pie',
          data: data,
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: false,
                text: 'Patient Allocation'
              }
            }
          }
        };
      
        // If chart already exists, destroy it before creating a new one
        if (allocationChart) {
          allocationChart.destroy();
        }
        allocationChart = new Chart(ctx, config);
      }
      
  
}
  

function exportJSON() {
    const dataStr = JSON.stringify(patients, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patients.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  
  function exportCSV() {
    if (patients.length === 0) return alert("No patients to export.");
  
    const headers = ["Name", "Severity", "Beds", "Ventilators", "Survival"];
    const rows = patients.map(p =>
      [p.name, p.severity, p.beds, p.vents, p.survival]
    );
  
    let csvContent = headers.join(",") + "\n" +
      rows.map(r => r.join(",")).join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patients.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON() {
    const fileInput = document.getElementById("importFile");
    const file = fileInput.files[0];
  
    if (!file) {
      alert("Please select a .json file.");
      return;
    }
  
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedPatients = JSON.parse(e.target.result);
        if (Array.isArray(importedPatients)) {
          importedPatients.forEach(p => {
            if (p.name && p.severity && p.beds != null && p.vents != null && p.survival != null) {
              patients.push(p);
            }
          });
          updatePatientList();
          alert("Patients imported successfully!");
        } else {
          alert("Invalid file format.");
        }
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
  }

  function saveToLocalStorage() {
    localStorage.setItem("patients", JSON.stringify(patients));
  }
  
  function loadFromLocalStorage() {
    const saved = localStorage.getItem("patients");
    if (saved) {
      patients = JSON.parse(saved);
      updatePatientList();
    }
  }
  window.onload = loadFromLocalStorage;
  
  function clearAll() {
    if (confirm("Are you sure you want to delete all patient data?")) {
      patients = [];
      localStorage.removeItem("patients");
      updatePatientList();
      document.getElementById("allocationResult").innerHTML = "";
      document.getElementById("analyticsPanel").innerHTML = "";
      if (allocationChart) {
        allocationChart.destroy();
        allocationChart = null;
      }
    }
  }
  function switchLanguage() {
    const lang = document.getElementById("languageSelect").value;
    const labels = document.querySelectorAll("[data-i18n]");
  
    labels.forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = translations[lang][key] || key;
    });
  }
  window.onload = function () {
    loadFromLocalStorage();
    const savedLang = localStorage.getItem("language") || "en";
    document.getElementById("languageSelect").value = savedLang;
    switchLanguage();
    document.getElementById("app").style.display = "block"; // ✅ Show app after init
  };
  
  
  