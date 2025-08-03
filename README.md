# DỰ ÁN GIÁM SÁT SỨC KHỎE VÀ PHÁT HIỆN TÉ NGÃ (REAL-TIME HEALTH MONITORING AND FALL DETECTION SYSTEM)

---

## I. GIỚI THIỆU DỰ ÁN

Dự án gồm hai hệ thống chính:

1. **Giám sát sức khỏe:** Thu thập và đánh giá các thông số sức khỏe cơ bản (nhiệt độ cơ thể, nhịp tim, nồng độ oxy trong máu), dự đoán tình trạng sức khỏe bằng mô hình học máy (SVM), cảnh báo nguy hiểm qua email, đồng thời cung cấp giao diện web hiển thị thông số và vẽ biểu đồ thời gian thực.

2. **Phát hiện té ngã:** Phát hiện sự kiện té ngã thông qua xử lý hình ảnh (CNN kết hợp MobileNetV2), cảnh báo qua email khi phát hiện nguy hiểm, phối hợp điều khiển phần cứng (servo), giao diện web hiển thị camera stream và tương tác điều khiển.

---

## II. KIẾN TRÚC & SƠ ĐỒ TỔNG QUAN

```
                         +---------------------------------------------+
                         |                 INTERNET                    |
                         +-------------------+-------------------------+
                                             |
+-------------------------------+            |           +---------------------------------+
| Hệ thống giám sát sức khỏe    |            |           | Hệ thống phát hiện té ngã       |
|-------------------------------|            |           |---------------------------------|
| - ESP32                       |            |           | - ESP32-CAM (Stream, hiển thị)  |
| - MLX90614 (đo nhiệt độ)      |            |           | - Điều khiển qua UART 	   |
| - MAX30100 (nhịp tim, SpO2)   |            |           | - ESP32 (Nhận lệnh)         	   |
|                               |            |           | - Servo (quay trục camera)      |
| [Đo thông số sức khỏe]        |            |           |    [Truyền video stream]        |
|        |                      |            |           | 	  |			   |
|        v                      |            |           |        |                        |
| [Gửi dữ liệu lên Firebase]    |            |           |        |                        |
|   	 |		        |	     |		 |   	  |			   |
|        v                      |            |           |        v                        |
+-------------------------------+            |           +---------------------------------+
                                             |
                         +-------------------+-------------------------+
                         |                SERVER CHÍNH                 |
                         |           (Python: SVM, CNN)                |
                         +-------------------+-------------------------+
                                             |
            +--------------------------------|------------------------------+
            |                          	     v                              |
            | [Rút dữ liệu sức khỏe từ Firebase]                            |
            | [Dự đoán sức khỏe (SVM)]                                      |
            | [Gửi lại kết quả lên Firebase]                                |
            | [Cảnh báo email nếu nguy hiểm]                                |
            |                                                               |
            | [Nhận hình ảnh/video từ ESP32-CAM]                            |
            | [Tiền xử lý hình ảnh và phân biệt vật thể]                    |
            | [Nhận diện té ngã (CNN + MobileNetV2)]                        |
            | [Cảnh báo email nếu té ngã]                                   |
            +---------------------------------------------------------------+
                                             |
                         +-------------------+-------------------------+
                                             |
                                    [GIAO DIỆN WEB]
                         - Hiển thị thông số sức khỏe, trạng thái
                         - Vẽ biểu đồ theo thời gian thực
                         - Hiển thị hình ảnh/video stream
                         - Các nút điều khiển phần cứng (servo)
```

---

## III. THÀNH PHẦN CHI TIẾT

### 1. HỆ THỐNG GIÁM SÁT SỨC KHỎE

#### a. Phần cứng

- **ESP32:** Vi điều khiển trung tâm chịu trách nhiệm thu thập và gửi dữ liệu.
- **MLX90614:** Cảm biến đo nhiệt độ cơ thể (không tiếp xúc).
- **MAX30100:** Cảm biến đo nhịp tim và nồng độ SpO2.
- **Nguồn cấp, dây nối, hộp đựng mạch.**

#### b. Nguyên lý hoạt động

1. **Thu thập dữ liệu:** 
    - ESP32 liên tục lấy đọc giá trị nhiệt độ, nhịp tim, SpO2 từ các cảm biến.
2. **Gửi dữ liệu lên Firebase:**
    - Dữ liệu được gửi thời gian thực lên Firebase Realtime Database.
3. **Phân tích, dự đoán & cảnh báo (Python Server):**
    - Hệ thống chính (Python) lấy dữ liệu từ Firebase.
    - Mô hình SVM phân loại sức khỏe thành 3 trạng thái:
        - **0**: Bình thường
        - **1**: Bị bệnh
        - **2**: Nguy hiểm
    - Nếu phát hiện nguy hiểm, hệ thống gửi email cảnh báo tự động.
    - Kết quả sức khỏe và các thông số được cập nhật lại lên Firebase.
4. **Hiển thị trên Web:**
    - Giao diện web lấy dữ liệu từ Firebase, hiển thị thông số, trạng thái, vẽ biểu đồ trực quan.

#### c. Luồng dữ liệu
1. ESP32 → Firebase (Dữ liệu sức khỏe)
2. Firebase ↔ Python Server (Xử lý, cảnh báo, cập nhật trạng thái)
3. Firebase → Web (Hiển thị số liệu & biểu đồ)

---

### 2. HỆ THỐNG PHÁT HIỆN TÉ NGÃ

#### a. Phần cứng

- **ESP32-CAM:** Truyền video stream thời gian thực, hiển thị giao diện điều khiển.
- **ESP32:** Nhận tín hiệu nút bấm qua giao tiếp UART, điều khiển servo.
- **Servo:** Điều chỉnh hướng/trục của camera.
- **Nguồn cấp, dây điện.**

#### b. Nguyên lý hoạt động

1. **Stream video:** ESP32-CAM truyền hình ảnh thời gian thực đến Python server.
2. **Giao tiếp điều khiển:**
    - Người dùng nhấn nút bấm, ESP32-CAM gửi tín hiệu điều khiển servo (quay camera) qua UART.
    - Tín hiệu truyền về ESP32 để quay trục pan-tilt.
3. **Nhận diện té ngã (Python Server):**
    - Nhận stream hình ảnh/video từ ESP32-CAM.
    - Phân biệt vật thể và người thông qua YOLO.
    - Xử lý hình ảnh bằng mô hình CNN kết hợp MobileNetV2 để phát hiện té ngã.
    - Nếu phát hiện té ngã, gửi email cảnh báo.
4. **Hiển thị và điều khiển trên Web:**
    - Xem camera stream, các nút điều khiển.

#### c. Luồng dữ liệu

1. ESP32-CAM → Python Server (Stream video)
2. Nút bấm → ESP32 → Servo (Điều khiển phần cứng)
3. ESP32-CAM → Web (Hiển thị hình ảnh, nút điều khiển)
4. Phân biệt vật thể → Phát hiện té ngã → Gửi email cảnh báo

---

## IV. CÔNG NGHỆ SỬ DỤNG

- **Vi điều khiển:** ESP32, ESP32-CAM
- **Cảm biến:** MLX90614, MAX30100
- **Điều khiển:** Servo, Nút bấm, UART
- **Cloud:** Firebase Realtime Database
- **Xử lý & học máy:** Python (Scikit-learn: SVM, TensorFlow/Keras: CNN + MobileNetV2, OpenCV, YOLO)
- **Gửi email:** smtplib (Python)
- **Front-end:** HTML/CSS/JS, Chart.js hoặc tương đương, Firebase SDK
- **Giao tiếp:** HTTP, Websocket, UART, REST API

---

## V. HƯỚNG DẪN TRIỂN KHAI

### 1. Phần cứng

- Kết nối cảm biến MLX90614, MAX30100 với ESP32 thông qua giao tiếp I2C.
- Kết nối ESP32-CAM, ESP32, nút bấm và servo theo sơ đồ mạch điện tử.
- Kiểm tra nguồn cấp ổn định.

### 2. Phần mềm nhúng

- Lập trình ESP32 đọc cảm biến và gửi dữ liệu lên Firebase (Arduino/ESP-IDF).
- Lập trình ESP32-CAM truyền video stream, ESP32 nhận tín hiệu nút bấm điều khiển servo qua UART.
- Flash firmware cho ESP32, ESP32-CAM.

### 3. Thiết lập Firebase

- Tạo Project Firebase, bật Realtime Database.
- Lưu lại các thông tin cấu hình (apiKey, databaseURL, v.v.) để sử dụng cho ESP32, Python server và web.

### 4. Hệ thống xử lý chính (Python)

- Cài đặt các thư viện: `firebase-admin`, `scikit-learn`, `tensorflow`, `opencv-python`, `smtplib`, v.v.
- Đào tạo mô hình SVM cho phân loại sức khỏe, lưu mô hình.
- Đào tạo hoặc tích hợp sẵn mô hình CNN + MobileNetV2 cho nhận diện té ngã, YOLO cho phân biệt vật thể.
- Viết script Python:
    - Lấy/gửi dữ liệu với Firebase.
    - Nhận video stream từ ESP32-CAM (qua HTTP, RTSP hoặc socket).
    - Dự đoán sức khỏe, phát hiện té ngã, gửi email cảnh báo khi cần.
    - Cập nhật trạng thái lên Firebase và/hoặc gửi tín hiệu cho frontend web.

### 5. Giao diện web

- Xây dựng web lấy dữ liệu từ Firebase, hiển thị số liệu, trạng thái và biểu đồ (Chart.js).
- Hiển thị stream hình ảnh/video từ ESP32-CAM.
- Thực hiện điều khiển phần cứng thông qua giao tiếp phù hợp (REST API, Websocket, Firebase Function, ...).

---

## VI. LƯU ĐỒ HOẠT ĐỘNG

### 1. Giám sát sức khỏe

- ESP32 → Đọc cảm biến → Gửi Firebase → Python lấy dữ liệu → SVM dự đoán → Gửi email (nếu nguy hiểm) → Cập nhật trạng thái Firebase → Web hiển thị.

### 2. Phát hiện té ngã

- ESP32-CAM → Stream video → Python → Phân biệt vật thể → Phát hiện té ngã (CNN+MobileNetV2) → Gửi email cảnh báo → Web hiển thị stream.
     		   |
    		   → Nút bấm → ESP32 → Điều khiển servo → Web cập nhật trạng thái điều khiển.

---

## VII. CẤU TRÚC FILE DỰ ÁN

### 1. Dự án Giám sát sức khỏe (`predicthealth`)

```
predicthealth/
├── DATH/                         # Thư mục chứa tài liệu hoặc mã nguồn phụ trợ
├── Health data.csv               # Dữ liệu mẫu về sức khỏe (dạng CSV)
├── Project_PredictHealth.ipynb   # Notebook Jupyter xử lý, huấn luyện, đánh giá mô hình sức khỏe
├── health_prediction_model.pkl   # File mô hình SVM đã huấn luyện (pickle)
├── project-health-monitor.json   # File cấu hình/luồng dữ liệu cho hệ thống monitor
├── project_predicthealth.py      # Mã nguồn Python chính cho dự đoán sức khỏe
```

---

### 2. Dashboard Web giám sát sức khỏe (`health_monitoring_dashboard`)

```
health_monitoring_dashboard/
├── CNAME              # Cấu hình tên miền cho Github Pages
├── background.jpg     # Ảnh nền trang dashboard
├── index.html         # Trang HTML chính
├── script.js          # Logic giao tiếp, hiển thị dữ liệu, vẽ biểu đồ
├── styles.css         # Giao diện, định dạng trang web
```

---

### 3. Dự án phát hiện té ngã (`Fall-Detection-main`)

```
Fall-Detection-main/
├── Pantilt/
│   └── Pan_Tilt_Camera/   # Mã nguồn điều khiển camera xoay
├── pantiltESP32/          # Mã nguồn cho ESP32 điều khiển servo qua nút bấm
├── Project_falldetection.ipynb   # Notebook Jupyter huấn luyện, thử nghiệm mô hình phát hiện té ngã
├── classes.txt                   # Danh sách nhãn cho mô hình phân biệt vật thể
├── fall_detection_model.keras    # Mô hình CNN lưu định dạng keras
├── fall_detection_model.tflite   # Mô hình CNN lưu nhẹ cho nhúng
├── main.py                      # Mã nguồn Python chính cho phát hiện té ngã
├── requirements.txt              # Danh sách thư viện Python cần thiết
├── yolov5nu.pt                   # File mô hình bổ sung (Phân biệt vật thể)
```

---

## VIII. ĐÓNG GÓP VÀ PHÁT TRIỂN

- Đóng góp code, ý tưởng hoặc báo lỗi qua issue hoặc pull request trên GitHub.
- Có thể mở rộng hệ thống với nhiều loại cảm biến, mô hình AI khác, tích hợp thêm các dịch vụ cảnh báo khác (SMS, push notification).

---

## IX. LICENSE

Xem trên file License.

---

## X. LIÊN HỆ

- Chủ dự án: [Phan Thành Đạt]
- Email liên hệ: [pthanhdat17@gmail.com]
- Github: [https://github.com/Dat1911203]
