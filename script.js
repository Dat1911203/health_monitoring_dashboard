  // API FIREBASE
  const firebaseConfig = {
    apiKey: "AIzaSyBdoNh2m7B7Ya6diI7ZeAGf_Cy5eL9b_7o",
    authDomain: "project-health-monitor-99c84.firebaseapp.com",
    databaseURL: "https://project-health-monitor-99c84-default-rtdb.firebaseio.com",
    projectId: "project-health-monitor-99c84",
    storageBucket: "project-health-monitor-99c84.firebasestorage.app",
    messagingSenderId: "159593870774",
    appId: "1:159593870774:web:10276e28dedd4dd90dbd17",
    measurementId: "G-Q77TJGQ4MF"
  };

  // Thông tin tài khoản
  const validUsername = "admin";
  const validPassword = "123456";

  // Hàm xử lý đăng nhập
function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const errorMsg = document.getElementById("loginError");
  const rememberMe = document.getElementById("rememberMe").checked;

  if (user === validUsername && pass === validPassword) {
    document.getElementById("loginPage").style.display = "none";
    document.querySelector(".dashboard").style.display = "block";
    document.body.classList.add("metrics-active"); 
    document.getElementById("logoutBtn").style.display = "block";

    if (rememberMe) {
      localStorage.setItem("rememberedUser", user);
      localStorage.setItem("rememberedPass", pass);
    } else {
      localStorage.removeItem("rememberedUser");
      localStorage.removeItem("rememberedPass");
    }
  } else {
    errorMsg.style.display = "block";
  }
}

// Đăng xuất
document.getElementById("logoutBtn").addEventListener("click", function() {
  document.getElementById("loginPage").style.display = "block";
  document.querySelector(".dashboard").style.display = "none";
  document.body.classList.remove("metrics-active");
  this.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".dashboard").style.display = "none";
  document.getElementById("logoutBtn").style.display = "none";

  const rememberedUser = localStorage.getItem("rememberedUser");
  const rememberedPass = localStorage.getItem("rememberedPass");
  if (rememberedUser && rememberedPass) {
    document.getElementById("username").value = rememberedUser;
    document.getElementById("password").value = rememberedPass;
    document.getElementById("rememberMe").checked = true;
  }
});

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var database = firebase.database()
  
// Hàm lấy dữ liệu
function listenData() {
  database.ref("HealthMonitoring").on("child_added", snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (
        data.timestamp &&
        data.pulse != null &&
        data.SpO2 != null &&
        data.bodytemperature != null
      ) {

      document.getElementById('SpO2').innerText = data.SpO2 + ' %';
      document.getElementById('bodytemperature').innerText = data.bodytemperature + ' °C';
      document.getElementById('pulse').innerText = data.pulse + ' BPM';

        if (!chart.data.labels.includes(data.timestamp)) {
          chart.data.labels.push(data.timestamp);
          chart.data.datasets[0].data.push(data.pulse);
          chart.data.datasets[1].data.push(data.SpO2);
          chart.data.datasets[2].data.push(data.bodytemperature);

          if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(ds => ds.data.shift());
          }

          chart.update();
        }
      }
    } else {
      console.log("Không có dữ liệu mới!");
    }
  }, error => {
    console.error("Lỗi khi lấy dữ liệu:", error);
  });
}
  
// Hàm lấy stream ESP32-CAM
function updateCamStream() {
  document.getElementById("esp32cam_stream").src = "http://192.168.50.138";
}

document.querySelector('[data-view="camera"]').addEventListener('click', function() {
  updateCamStream();
});

// Toggle Sidebar
document.getElementById("toggleSidebar").addEventListener("click", function () {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("active");
});

// Thanh sidebar
const viewLinks = document.querySelectorAll('.sidebar a');
const sections = document.querySelectorAll('.view-section');

viewLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const target = this.getAttribute('data-view');

    sections.forEach(sec => sec.style.display = 'none');
    document.querySelector(`.${target}-view`).style.display = 'block';

    document.getElementById("sidebar").classList.remove("active");
  });
});

// Thiết lập biểu đồ
let chart;
const ctx = document.getElementById('chartCanvas')?.getContext('2d');
if (ctx) {
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: "Nhịp tim (BPM)",
          data: [],
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: "SpO₂ (%)",
          data: [],
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 0, 255, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: "Nhiệt độ (°C)",
          data: [],
          borderColor: 'green',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Giá trị đo',
            font: {size: 14}
          }
        },
        x: {
          title: {
            display: true,
            text: 'Thời gian',
            font: {size: 14}
          }
        }
      },
      plugins: {
        legend: {
          labels: { font: { size: 14 } }
        }
      }
    }
  });
}

// Lắng nghe dữ liệu
listenData();  

// Ẩn tất cả view trừ metrics-view
window.addEventListener('DOMContentLoaded', () => {
  sections.forEach(sec => sec.style.display = 'none');
  document.querySelector('.metrics-view').style.display = 'block';
});

