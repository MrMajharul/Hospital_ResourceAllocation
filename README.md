# 🏥 Hospital Resource Allocation

A simple, interactive web-based simulator that helps allocate limited hospital resources (like beds and ventilators) to patients based on urgency, survival probability, and available resources using algorithmic strategies.

---

## 🌐 Live Preview

> _To host the project, open `index.html` in any modern browser._

---

## 🎯 Features

- ✅ Add/Edit/Delete Patient Data
- ✅ Real-time Allocation Simulation
- ✅ 2 Algorithm Modes:
  - 🚦 **Priority-Based Allocation (Greedy)**
  - 🎯 **Optimized Survival Allocation (Knapsack / 3D DP)**
- ✅ Resource Tracking (Beds, Ventilators)
- ✅ Toggle Algorithm Mode
- ✅ Responsive UI with modern styling

---

## 📂 Folder Structure

hospital-resource-simulator/
│
├── index.html # Main UI and Layout
├── login.html
├── login.js
├── manifest.json
├── script.js # Core logic and algorithm handling
├── style.css # Custom styling for layout & components
├── sw.js
└── README.md # Project info and usage


---

## 🧠 Algorithms Used

### 1. 🚦 Priority-Based Allocation (Greedy)

- Sorts patients by: `severity × survivalProbability`
- Allocates if enough resources are available
- Fast but not always optimal

### 2. 🎯 Optimized Survival Allocation (Knapsack)

- Uses **0-1 Knapsack (3D Dynamic Programming)**:
  - Resource constraints: beds, ventilators
- Maximizes total survival probability
- Slower but more efficient and optimal

---

## ▶️ How to Use

1. Open `index.html` in a web browser
2. Input patient details (name, severity, resources, survival probability)
3. Set available resources (beds, ventilators)
4. Choose allocation mode
5. Click **Allocate** to see results

---

## 🧩 Technologies Used

- **HTML5**
- **CSS3**
- **Vanilla JavaScript**

_No frameworks or libraries required._

---

## 📌 Future Enhancements

- 🔄 Add undo/reset functionality
- 📈 Add visual charts/graphs (e.g., D3.js/Chart.js)
- 🧮 Add support for more complex constraints (doctors, ICU types)
- 💾 Save/load patient data from localStorage or file
- 🔒 Add authentication and user roles (doctor/admin)
- 📱 Improve mobile responsiveness further

---

## 👨‍💻 Author

Developed by [Majharul Islam (https://github.com/MrMajharul)] – CSE Student at Green University of Bangladesh  

---

## 📄 License

This project is open-source and free to use for educational purposes.
